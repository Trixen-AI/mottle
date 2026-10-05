// "Score before you sign": checks a send against the sender's real history before the wallet prompt.
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { STANDARD_SIZES, type Token } from '../config'
import type { Activity, TransferPlan } from './chain'
import type { Level } from './exposure'

export type Check = { level: Level; title: string; detail: string; blocking?: boolean }

export function preflight(args: {
  token: Token
  amount: number
  recipient: string
  history: Activity[]
  plan: TransferPlan
  solBalance: number // lamports
  tokenBalance: number
}): { score: number; checks: Check[] } {
  const { token, amount, recipient, history, plan } = args
  const checks: Check[] = []

  checks.push({
    level: 'risk',
    title: 'Public transfer',
    detail: `This send goes wallet to wallet. Anyone can see that ${recipient.slice(0, 4)}… received ${amount} ${token.symbol} from you.`,
  })

  const past = history.filter((a) => a.counterparty === recipient && a.status === 'success').length
  checks.push(
    past > 0
      ? { level: 'warn', title: 'Known recipient', detail: `You have ${past} earlier transaction${past === 1 ? '' : 's'} with this address in your recent history. Another one strengthens that link.` }
      : { level: 'ok', title: 'New recipient', detail: 'No earlier transactions with this address in your recent history.' },
  )

  const standard = STANDARD_SIZES.includes(amount)
  checks.push(
    standard
      ? { level: 'ok', title: 'Standard amount', detail: `${amount} is a common size, so the amount alone does not single you out.` }
      : { level: 'warn', title: 'Distinctive amount', detail: `${amount} ${token.symbol} is unusual and easy to match. A standard size (10, 50, 100, 500, 1,000) blends in better.` },
  )

  const costs = plan.feeLamports + plan.rentLamports + (token.mint ? 0 : Number(amount) * LAMPORTS_PER_SOL)
  if (plan.createsRecipientAccount)
    checks.push({ level: 'warn', title: 'Recipient has no account yet', detail: `You will pay about ${(plan.rentLamports / LAMPORTS_PER_SOL).toFixed(5)} SOL to open their ${token.symbol} account.` })
  if (args.solBalance < costs)
    checks.push({ level: 'risk', title: 'Not enough SOL', detail: `This needs about ${(costs / LAMPORTS_PER_SOL).toFixed(5)} SOL including fees.`, blocking: true })
  if (token.mint && args.tokenBalance < amount)
    checks.push({ level: 'risk', title: `Not enough ${token.symbol}`, detail: `You hold ${args.tokenBalance} ${token.symbol}.`, blocking: true })

  const score = Math.max(0, 10 - (past > 0 ? 2 : 0) - (standard ? 0 : 2) - 3) // public send caps it at 7
  return { score, checks }
}
