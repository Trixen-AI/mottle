// Selective disclosure: the wallet signs a report covering only the transactions you pick.
// Anyone can verify the signature against the address, and re-check each transaction on-chain.
import bs58 from 'bs58'
import nacl from 'tweetnacl'
import type { Cluster } from '../config'
import { getConnection, parseActivity, type Activity, MAX_TX_VERSION } from './chain'

export type DisclosedTx = {
  signature: string
  time: number | null
  kind: Activity['kind']
  asset: string | null
  amount: number | null
  counterparty: string | null
}

export type DisclosureReport = {
  type: 'mottle-disclosure'
  version: 1
  network: Cluster
  address: string
  createdAt: string
  purpose: string
  transactions: DisclosedTx[]
}

export type SignedDisclosure = { report: DisclosureReport; message: string; signature: string }

export function buildReport(args: { cluster: Cluster; address: string; purpose: string; items: Activity[] }): DisclosureReport {
  return {
    type: 'mottle-disclosure',
    version: 1,
    network: args.cluster,
    address: args.address,
    createdAt: new Date().toISOString(),
    purpose: args.purpose.trim(),
    transactions: args.items.map((a) => ({
      signature: a.signature,
      time: a.time,
      kind: a.kind,
      asset: a.primary?.asset.symbol ?? null,
      amount: a.primary?.amount ?? null,
      counterparty: a.counterparty,
    })),
  }
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function disclosureMessage(report: DisclosureReport) {
  const hash = await sha256Hex(JSON.stringify(report))
  return [
    'Mottle selective disclosure',
    `Address: ${report.address}`,
    `Network: ${report.network}`,
    `Transactions: ${report.transactions.length}`,
    `Report SHA-256: ${hash}`,
    `Created: ${report.createdAt}`,
  ].join('\n')
}

export async function signReport(report: DisclosureReport, signMessage: (bytes: Uint8Array) => Promise<Uint8Array>): Promise<SignedDisclosure> {
  const message = await disclosureMessage(report)
  const sig = await signMessage(new TextEncoder().encode(message))
  return { report, message, signature: bs58.encode(sig) }
}

export type VerifyStep = { label: string; ok: boolean; detail: string }

export async function verifyDisclosure(file: unknown, opts: { onChain: boolean }): Promise<VerifyStep[]> {
  const steps: VerifyStep[] = []
  const f = file as Partial<SignedDisclosure>
  if (!f?.report || f.report.type !== 'mottle-disclosure' || typeof f.message !== 'string' || typeof f.signature !== 'string') {
    return [{ label: 'File format', ok: false, detail: 'This is not a Mottle disclosure file.' }]
  }
  steps.push({ label: 'File format', ok: true, detail: `Version ${f.report.version}, ${f.report.transactions.length} transactions on ${f.report.network}.` })

  const expected = await disclosureMessage(f.report)
  const intact = expected === f.message
  steps.push({ label: 'Report unchanged', ok: intact, detail: intact ? 'The report matches the hash that was signed.' : 'The report was edited after signing.' })

  let sigOk = false
  try {
    sigOk = nacl.sign.detached.verify(new TextEncoder().encode(f.message), bs58.decode(f.signature), bs58.decode(f.report.address))
  } catch {
    sigOk = false
  }
  steps.push({
    label: 'Signed by the address',
    ok: sigOk,
    detail: sigOk ? `The signature was made by the key of ${f.report.address}.` : 'The signature does not match this address.',
  })

  if (opts.onChain && intact && sigOk) {
    const conn = getConnection(f.report.network)
    let matched = 0
    const problems: string[] = []
    for (const t of f.report.transactions) {
      const tx = await conn.getParsedTransaction(t.signature, { maxSupportedTransactionVersion: MAX_TX_VERSION, commitment: 'confirmed' }).catch(() => null)
      if (!tx) {
        problems.push(`${t.signature.slice(0, 8)}… not found`)
        continue
      }
      const parsed = parseActivity(f.report.network, f.report.address, { signature: t.signature, blockTime: tx.blockTime ?? null, err: tx.meta?.err ?? null, memo: null, slot: tx.slot }, tx)
      const same = parsed.primary?.asset.symbol === t.asset && Math.abs((parsed.primary?.amount ?? 0) - (t.amount ?? 0)) < 1e-9
      if (same) matched++
      else problems.push(`${t.signature.slice(0, 8)}… differs from the chain`)
    }
    steps.push({
      label: 'Matches the chain',
      ok: problems.length === 0,
      detail: problems.length ? `${matched} matched. ${problems.slice(0, 3).join('; ')}` : `All ${matched} transactions exist and match what the report says.`,
    })
  }
  return steps
}

export function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
