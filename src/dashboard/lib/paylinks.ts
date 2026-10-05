// Payment links built on the Solana Pay transfer-request standard.
// Each link carries a fresh reference key; finding a transaction that includes it proves payment.
import { Keypair, PublicKey } from '@solana/web3.js'
import { tokenBySymbol, type Cluster } from '../config'
import { fromBaseUnits, getConnection, toBaseUnits, MAX_TX_VERSION } from './chain'

export type PayLink = {
  id: string
  cluster: Cluster
  recipient: string
  token: 'SOL' | 'USDC' | 'USDT'
  amount: string | null // decimal string; null lets the payer choose
  label: string
  message: string
  reference: string
  createdAt: number
  paid?: { signature: string; at: number }
}

/* ─────────── Storage (per wallet, per cluster, versioned) ─────────── */

const KEY = (owner: string, cluster: Cluster) => `mottle:paylinks:v1:${cluster}:${owner}`

export function loadLinks(owner: string, cluster: Cluster): PayLink[] {
  try {
    const raw = localStorage.getItem(KEY(owner, cluster))
    return raw ? (JSON.parse(raw) as PayLink[]) : []
  } catch {
    return []
  }
}

export function saveLinks(owner: string, cluster: Cluster, links: PayLink[]) {
  try {
    localStorage.setItem(KEY(owner, cluster), JSON.stringify(links))
  } catch {
    /* storage full or blocked: links still work for this session */
  }
}

export function newLink(input: Omit<PayLink, 'id' | 'reference' | 'createdAt'>): PayLink {
  const reference = Keypair.generate().publicKey.toBase58()
  return { ...input, id: reference.slice(0, 10), reference, createdAt: Date.now() }
}

/* ─────────── URLs ─────────── */

// solana: URI that any Solana Pay wallet can scan
export function solanaPayUri(link: PayLink) {
  const token = tokenBySymbol(link.cluster, link.token)
  const q = new URLSearchParams()
  if (link.amount) q.set('amount', link.amount)
  if (token?.mint) q.set('spl-token', token.mint)
  q.set('reference', link.reference)
  if (link.label) q.set('label', link.label)
  if (link.message) q.set('message', link.message)
  return `solana:${link.recipient}?${q.toString()}`
}

// Web link to the Mottle pay page (works in any browser, payer connects any Solana wallet)
export function webPayUrl(link: PayLink) {
  const q = new URLSearchParams({ to: link.recipient, token: link.token, ref: link.reference, net: link.cluster })
  if (link.amount) q.set('amount', link.amount)
  if (link.label) q.set('label', link.label)
  if (link.message) q.set('msg', link.message)
  return `${window.location.origin}/pay?${q.toString()}`
}

export function parsePayParams(params: URLSearchParams): { link: Omit<PayLink, 'id' | 'createdAt'> | null; error: string | null } {
  const recipient = params.get('to') ?? ''
  const reference = params.get('ref') ?? ''
  if (params.get('net') === 'devnet') return { link: null, error: 'This link is for Devnet, which Mottle no longer supports. Ask for a Mainnet link.' }
  const cluster: Cluster = 'mainnet'
  const token = (params.get('token') ?? 'USDC').toUpperCase() as PayLink['token']
  const amount = params.get('amount')
  try {
    new PublicKey(recipient)
    new PublicKey(reference)
  } catch {
    return { link: null, error: 'This payment link is incomplete or damaged. Ask for a new one.' }
  }
  const t = tokenBySymbol(cluster, token)
  if (!t) return { link: null, error: `${token} is not available on ${cluster}.` }
  if (amount) {
    try {
      if (toBaseUnits(amount, t.decimals) <= 0n) throw new Error()
    } catch {
      return { link: null, error: 'The amount in this link is not valid.' }
    }
  }
  return { link: { cluster, recipient, token, amount, label: params.get('label') ?? '', message: params.get('msg') ?? '', reference }, error: null }
}

/* ─────────── Payment detection ─────────── */

// Looks for a confirmed transaction that includes the reference key and pays the recipient enough.
export async function findPayment(link: Pick<PayLink, 'cluster' | 'recipient' | 'token' | 'amount' | 'reference'>) {
  const conn = getConnection(link.cluster)
  const sigs = await conn.getSignaturesForAddress(new PublicKey(link.reference), { limit: 5 }, 'confirmed')
  const token = tokenBySymbol(link.cluster, link.token)
  if (!token) return null
  for (const s of sigs) {
    if (s.err) continue
    const tx = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: MAX_TX_VERSION, commitment: 'confirmed' })
    if (!tx?.meta) continue
    let received = 0
    if (token.mint) {
      const sum = (list: typeof tx.meta.postTokenBalances) =>
        (list ?? []).filter((b) => b.mint === token.mint && b.owner === link.recipient).reduce((n, b) => n + BigInt(b.uiTokenAmount.amount), 0n)
      received = fromBaseUnits(sum(tx.meta.postTokenBalances) - sum(tx.meta.preTokenBalances), token.decimals)
    } else {
      const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58())
      const i = keys.indexOf(link.recipient)
      if (i >= 0) received = (tx.meta.postBalances[i] - tx.meta.preBalances[i]) / 1e9
    }
    const needed = link.amount ? Number(link.amount) : 0
    if (received > 0 && received + 1e-9 >= needed) return { signature: s.signature, at: (s.blockTime ?? Date.now() / 1000) * 1000, received }
  }
  return null
}
