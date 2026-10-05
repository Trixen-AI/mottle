// Everything that talks to Solana: balances, history, transfers. Pure functions over a Connection.
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type ConfirmedSignatureInfo,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
  type PartiallyDecodedInstruction,
} from '@solana/web3.js'
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import { SOL, TOKENS, rpcUrl, tokenByMint, type Cluster, type Token } from '../config'

// Mainnet carries version 1 transactions; asking for less makes the RPC refuse the whole request.
export const MAX_TX_VERSION = 1

const MEMO_PROGRAM = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

const connections = new Map<Cluster, Connection>()
export function getConnection(cluster: Cluster) {
  let c = connections.get(cluster)
  if (!c) {
    c = new Connection(rpcUrl(cluster), 'confirmed')
    connections.set(cluster, c)
  }
  return c
}

export function isAddress(value: string) {
  try {
    new PublicKey(value.trim())
    return true
  } catch {
    return false
  }
}

/* ─────────── Amounts ─────────── */

// Decimal string -> base units, without floating point.
export function toBaseUnits(amount: string, decimals: number): bigint {
  const clean = amount.trim()
  if (!/^\d+(\.\d+)?$/.test(clean)) throw new Error('Enter a number like 25 or 12.50')
  const [whole, frac = ''] = clean.split('.')
  if (frac.length > decimals) throw new Error(`Use at most ${decimals} decimal places`)
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0') || '0')
}

export function fromBaseUnits(units: bigint, decimals: number) {
  return Number(units) / 10 ** decimals
}

/* ─────────── Balances ─────────── */

export type Holding = { token: Token; amount: number; units: bigint }
export type Balances = { holdings: Holding[]; otherTokens: number; lamports: number }

export async function fetchBalances(cluster: Cluster, owner: string): Promise<Balances> {
  const conn = getConnection(cluster)
  const key = new PublicKey(owner)
  const mints = TOKENS[cluster].flatMap((t) => (t.mint ? [new PublicKey(t.mint)] : []))
  const atas = mints.map((m) => getAssociatedTokenAddressSync(m, key))
  // Independent reads, in parallel. Plain account reads (the wallet's associated token accounts)
  // work on every RPC; the owner index is used when the endpoint allows it (keyless RPCs often block it).
  const [lamports, ataInfos, classic, t22] = await Promise.all([
    conn.getBalance(key),
    conn.getMultipleParsedAccounts(atas),
    conn.getParsedTokenAccountsByOwner(key, { programId: TOKEN_PROGRAM_ID }).catch(() => null),
    conn.getParsedTokenAccountsByOwner(key, { programId: TOKEN_2022_PROGRAM_ID }).catch(() => null),
  ])
  const byMint = new Map<string, bigint>()
  const indexed = classic !== null
  if (indexed) {
    for (const acc of [...classic.value, ...(t22?.value ?? [])]) {
      const info = acc.account.data.parsed.info as { mint: string; tokenAmount: { amount: string } }
      byMint.set(info.mint, (byMint.get(info.mint) ?? 0n) + BigInt(info.tokenAmount.amount))
    }
  } else {
    ataInfos.value.forEach((acc, i) => {
      const data = acc?.data
      if (data && 'parsed' in data) byMint.set(mints[i].toBase58(), BigInt((data.parsed.info as { tokenAmount: { amount: string } }).tokenAmount.amount))
    })
  }
  const holdings: Holding[] = TOKENS[cluster].map((token) => {
    const units = token.mint ? byMint.get(token.mint) ?? 0n : BigInt(lamports)
    return { token, units, amount: fromBaseUnits(units, token.decimals) }
  })
  const known = new Set(TOKENS[cluster].map((t) => t.mint))
  const otherTokens = indexed ? [...byMint.entries()].filter(([mint, units]) => !known.has(mint) && units > 0n).length : 0
  return { holdings, otherTokens, lamports }
}

/* ─────────── History ─────────── */

export type Asset = { symbol: string; mint: string | null; decimals: number }
export type Movement = { asset: Asset; amount: number } // signed, from the owner's point of view
export type Activity = {
  signature: string
  time: number | null // unix seconds
  status: 'success' | 'failed'
  kind: 'sent' | 'received' | 'swap' | 'other'
  movements: Movement[]
  primary: Movement | null
  counterparty: string | null
  fee: number // SOL, only when the owner paid it
  memo: string | null
}

const shortMint = (m: string) => `${m.slice(0, 4)}…${m.slice(-4)}`

function instructionsOf(tx: ParsedTransactionWithMeta) {
  const outer = tx.transaction.message.instructions
  const inner = (tx.meta?.innerInstructions ?? []).flatMap((i) => i.instructions)
  return [...outer, ...inner] as (ParsedInstruction | PartiallyDecodedInstruction)[]
}

export function parseActivity(cluster: Cluster, owner: string, sig: ConfirmedSignatureInfo, tx: ParsedTransactionWithMeta | null): Activity {
  const base: Activity = {
    signature: sig.signature,
    time: sig.blockTime ?? null,
    status: sig.err ? 'failed' : 'success',
    kind: 'other',
    movements: [],
    primary: null,
    counterparty: null,
    fee: 0,
    memo: sig.memo ?? null,
  }
  if (!tx?.meta) return base
  const meta = tx.meta
  const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58())
  const idx = keys.indexOf(owner)
  const feeLamports = keys[0] === owner ? meta.fee : 0
  base.fee = feeLamports / LAMPORTS_PER_SOL

  const movements: Movement[] = []
  // token balance changes for accounts the owner controls, plus everyone else's for counterparty lookup
  const deltas = new Map<string, Map<string, { delta: bigint; decimals: number }>>() // mint -> owner -> delta
  const add = (mint: string, who: string, amount: bigint, decimals: number) => {
    const m = deltas.get(mint) ?? new Map()
    const prev = m.get(who)
    m.set(who, { delta: (prev?.delta ?? 0n) + amount, decimals })
    deltas.set(mint, m)
  }
  for (const b of meta.preTokenBalances ?? []) if (b.owner) add(b.mint, b.owner, -BigInt(b.uiTokenAmount.amount), b.uiTokenAmount.decimals)
  for (const b of meta.postTokenBalances ?? []) if (b.owner) add(b.mint, b.owner, BigInt(b.uiTokenAmount.amount), b.uiTokenAmount.decimals)

  let tokenCounterparty: string | null = null
  for (const [mint, owners] of deltas) {
    const mine = owners.get(owner)
    if (!mine || mine.delta === 0n) continue
    const known = tokenByMint(cluster, mint)
    const asset: Asset = known ? { symbol: known.symbol, mint, decimals: known.decimals } : { symbol: shortMint(mint), mint, decimals: mine.decimals }
    movements.push({ asset, amount: fromBaseUnits(mine.delta, mine.decimals) })
    // the other side: the owner whose change was opposite and largest
    let best: [string, bigint] | null = null
    for (const [who, d] of owners) {
      if (who === owner || d.delta === 0n || d.delta > 0n === mine.delta > 0n) continue
      const abs = d.delta < 0n ? -d.delta : d.delta
      if (!best || abs > best[1]) best = [who, abs]
    }
    if (best && !tokenCounterparty) tokenCounterparty = best[0]
  }

  if (idx >= 0) {
    const lamports = meta.postBalances[idx] - meta.preBalances[idx] + feeLamports
    // ignore tiny rent shuffles from token account creation
    if (Math.abs(lamports) > 10_000) movements.push({ asset: { symbol: 'SOL', mint: null, decimals: 9 }, amount: lamports / LAMPORTS_PER_SOL })
  }

  let solCounterparty: string | null = null
  for (const ix of instructionsOf(tx)) {
    if (!('parsed' in ix) || ix.program !== 'system') continue
    const p = ix.parsed as { type?: string; info?: { source?: string; destination?: string } }
    if (p?.type !== 'transfer' && p?.type !== 'transferWithSeed') continue
    if (p.info?.source === owner && p.info.destination) solCounterparty = p.info.destination
    else if (p.info?.destination === owner && p.info.source) solCounterparty = p.info.source
    if (solCounterparty) break
  }

  base.movements = movements
  // stablecoins first, then SOL, then anything else
  const rank = (m: Movement) => (m.asset.symbol === 'USDC' || m.asset.symbol === 'USDT' ? 0 : m.asset.symbol === 'SOL' ? 1 : 2)
  base.primary = movements.toSorted((a, b) => rank(a) - rank(b))[0] ?? null
  const hasIn = movements.some((m) => m.amount > 0)
  const hasOut = movements.some((m) => m.amount < 0)
  base.kind = hasIn && hasOut ? 'swap' : hasOut ? 'sent' : hasIn ? 'received' : 'other'
  base.counterparty = base.primary?.asset.mint ? tokenCounterparty : solCounterparty ?? tokenCounterparty
  return base
}

async function parsedInChunks(conn: Connection, signatures: string[]) {
  const out: (ParsedTransactionWithMeta | null)[] = []
  for (let i = 0; i < signatures.length; i += 20) {
    const chunk = signatures.slice(i, i + 20)
    try {
      out.push(...(await conn.getParsedTransactions(chunk, { maxSupportedTransactionVersion: MAX_TX_VERSION, commitment: 'confirmed' })))
    } catch {
      // some RPCs refuse batch requests: fetch singly, four at a time, keeping order
      const single = (s: string) => conn.getParsedTransaction(s, { maxSupportedTransactionVersion: MAX_TX_VERSION, commitment: 'confirmed' }).catch(() => null)
      for (let j = 0; j < chunk.length; j += 4) out.push(...(await Promise.all(chunk.slice(j, j + 4).map(single))))
    }
  }
  return out
}

export async function fetchActivity(cluster: Cluster, owner: string, opts: { limit: number; before?: string }) {
  const conn = getConnection(cluster)
  const sigs = await conn.getSignaturesForAddress(new PublicKey(owner), { limit: opts.limit, before: opts.before })
  const txs = await parsedInChunks(
    conn,
    sigs.map((s) => s.signature),
  )
  const items = sigs.map((s, i) => parseActivity(cluster, owner, s, txs[i]))
  return { items, nextBefore: sigs.length === opts.limit ? sigs[sigs.length - 1].signature : undefined }
}

/* ─────────── Recipients ─────────── */

// Solana Name Service, read straight from the registry account (no third-party API).
const NAME_PROGRAM = new PublicKey('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX')
const SOL_TLD = new PublicKey('58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx')

export async function resolveSolName(cluster: Cluster, name: string) {
  const label = name.toLowerCase().replace(/\.sol$/, '')
  if (!label || label.includes('.')) throw new Error('Only names like maya.sol are supported')
  const hashed = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('SPL Name Service' + label)))
  const [key] = PublicKey.findProgramAddressSync([hashed, new Uint8Array(32), SOL_TLD.toBytes()], NAME_PROGRAM)
  const info = await getConnection(cluster).getAccountInfo(key)
  if (!info) throw new Error(`${label}.sol is not registered`)
  // registry header: parent (0..32), owner (32..64), class (64..96)
  return new PublicKey(info.data.subarray(32, 64)).toBase58()
}

// Plain addresses, or .sol names on mainnet.
export async function resolveRecipient(cluster: Cluster, input: string): Promise<{ address: string; name: string | null }> {
  const value = input.trim()
  if (/\.sol$/i.test(value)) {
    if (cluster !== 'mainnet') throw new Error('.sol names only resolve on Mainnet')
    return { address: await resolveSolName(cluster, value), name: value.toLowerCase() }
  }
  let key: PublicKey
  try {
    key = new PublicKey(value)
  } catch {
    throw new Error('That is not a Solana address or .sol name')
  }
  if (!PublicKey.isOnCurve(key.toBytes())) throw new Error('This address is a program account, not a wallet. Send to a wallet address instead.')
  return { address: key.toBase58(), name: null }
}

/* ─────────── Transfers ─────────── */

export type TransferPlan = {
  transaction: Transaction
  blockhash: string
  lastValidBlockHeight: number
  createsRecipientAccount: boolean
  feeLamports: number
  rentLamports: number
}

export async function buildTransfer(args: {
  cluster: Cluster
  from: string
  to: string
  token: Token
  units: bigint
  reference?: string
  memo?: string
}): Promise<TransferPlan> {
  const conn = getConnection(args.cluster)
  const from = new PublicKey(args.from)
  const to = new PublicKey(args.to)
  const ixs: TransactionInstruction[] = []
  let createsRecipientAccount = false
  let rentLamports = 0

  if (args.memo) ixs.push(new TransactionInstruction({ programId: MEMO_PROGRAM, keys: [], data: new TextEncoder().encode(args.memo) as Buffer }))

  let transferIx: TransactionInstruction
  if (!args.token.mint) {
    transferIx = SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: args.units })
  } else {
    const mint = new PublicKey(args.token.mint)
    const source = getAssociatedTokenAddressSync(mint, from)
    const dest = getAssociatedTokenAddressSync(mint, to)
    const [destInfo, sourceInfo] = await Promise.all([conn.getAccountInfo(dest), conn.getAccountInfo(source)])
    if (!sourceInfo) throw new Error(`This wallet has no ${args.token.symbol} account`)
    if (!destInfo) {
      createsRecipientAccount = true
      rentLamports = await conn.getMinimumBalanceForRentExemption(165)
      ixs.push(createAssociatedTokenAccountIdempotentInstruction(from, dest, to, mint))
    }
    transferIx = createTransferCheckedInstruction(source, mint, dest, from, args.units, args.token.decimals)
  }
  // Solana Pay: the reference key rides along read-only so the payment can be found later
  if (args.reference) transferIx.keys.push({ pubkey: new PublicKey(args.reference), isSigner: false, isWritable: false })
  ixs.push(transferIx)

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('confirmed')
  const transaction = new Transaction({ feePayer: from, blockhash, lastValidBlockHeight }).add(...ixs)
  const fee = await conn.getFeeForMessage(transaction.compileMessage(), 'confirmed').catch(() => ({ value: 5000 }))
  return { transaction, blockhash, lastValidBlockHeight, createsRecipientAccount, feeLamports: fee.value ?? 5000, rentLamports }
}

export async function confirmSignature(cluster: Cluster, signature: string, plan: { blockhash: string; lastValidBlockHeight: number }) {
  const res = await getConnection(cluster).confirmTransaction({ signature, ...plan }, 'confirmed')
  if (res.value.err) throw new Error('The transaction failed on-chain')
}

export { SOL }
