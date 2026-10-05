// How easy is this wallet to link and profile, judged only from its own on-chain history?
// Heuristics, not certainty: every factor shows the evidence it is based on.
import { STANDARD_SIZES } from '../config'
import type { Activity } from './chain'

export type Level = 'ok' | 'warn' | 'risk'
export type Factor = { id: string; title: string; level: Level; evidence: string; advice: string; penalty: number }
export type Exposure = {
  score: number // 0..10, higher = blends in better
  sample: number
  factors: Factor[]
  counterparties: { address: string; count: number; sent: number; received: number }[]
  hours: number[] // 24 buckets, UTC
}

const isStandard = (amount: number) => STANDARD_SIZES.some((s) => Math.abs(Math.abs(amount) - s) < 1e-9)

export function analyzeExposure(items: Activity[]): Exposure {
  const transfers = items.filter((a) => a.status === 'success' && (a.kind === 'sent' || a.kind === 'received') && a.primary)
  const hours = Array.from({ length: 24 }, () => 0)
  const cp = new Map<string, { count: number; sent: number; received: number }>()
  for (const a of items) {
    if (a.time) hours[new Date(a.time * 1000).getUTCHours()]++
  }
  for (const a of transfers) {
    if (!a.counterparty) continue
    const row = cp.get(a.counterparty) ?? { count: 0, sent: 0, received: 0 }
    row.count++
    if (a.kind === 'sent') row.sent++
    else row.received++
    cp.set(a.counterparty, row)
  }
  const counterparties = [...cp.entries()].map(([address, r]) => ({ address, ...r })).toSorted((a, b) => b.count - a.count)
  const factors: Factor[] = []

  // 1. Repeat counterparties: every repeat strengthens a visible link
  const repeats = counterparties.filter((c) => c.count > 1)
  const linked = transfers.filter((t) => t.counterparty && (cp.get(t.counterparty)?.count ?? 0) > 1).length
  const repeatShare = transfers.length ? linked / transfers.length : 0
  factors.push({
    id: 'repeats',
    title: 'Repeat counterparties',
    level: repeatShare > 0.5 ? 'risk' : repeatShare > 0.2 ? 'warn' : 'ok',
    evidence: transfers.length
      ? `${Math.round(repeatShare * 100)}% of ${transfers.length} transfers involve one of ${repeats.length} address${repeats.length === 1 ? '' : 'es'} you deal with more than once.`
      : 'No transfers in this sample.',
    advice: 'Each repeat payment between the same two addresses confirms the relationship. Rotate receiving addresses for regular payers.',
    penalty: Math.min(3, repeatShare * 4),
  })

  // 2. Amount fingerprint: odd amounts are easy to match across hops
  const stable = transfers.filter((t) => t.primary && (t.primary.asset.symbol === 'USDC' || t.primary.asset.symbol === 'USDT'))
  const odd = stable.filter((t) => !isStandard(t.primary!.amount)).length
  const oddShare = stable.length ? odd / stable.length : 0
  factors.push({
    id: 'amounts',
    title: 'Distinctive amounts',
    level: stable.length === 0 ? 'ok' : oddShare > 0.6 ? 'risk' : oddShare > 0.3 ? 'warn' : 'ok',
    evidence: stable.length ? `${odd} of ${stable.length} stablecoin transfers use a non-standard amount (for example 1,337.42 instead of 1,000).` : 'No stablecoin transfers in this sample.',
    advice: 'An amount like 1,337.42 can be matched from one hop to the next. Standard sizes (10, 50, 100, 500, 1,000) look like everyone else.',
    penalty: Math.min(2.5, oddShare * 3),
  })

  // 3. Timing: a narrow daily window hints at your timezone and routine
  const timed = hours.reduce((s, n) => s + n, 0)
  let entropy = 0
  for (const n of hours) if (n) entropy -= (n / timed) * Math.log2(n / timed)
  const spread = timed ? entropy / Math.log2(Math.min(24, Math.max(2, timed))) : 1
  const busiest = hours.indexOf(Math.max(...hours))
  factors.push({
    id: 'timing',
    title: 'Activity window',
    level: timed < 8 ? 'ok' : spread < 0.55 ? 'risk' : spread < 0.75 ? 'warn' : 'ok',
    evidence: timed < 8 ? 'Too few transactions to see a daily pattern.' : `Activity clusters around ${String(busiest).padStart(2, '0')}:00 UTC (spread ${Math.round(spread * 100)}%).`,
    advice: 'Sending at the same hour every day narrows down where you live. Varying the time, or delaying sends, breaks the pattern.',
    penalty: timed < 8 ? 0 : Math.min(2, (1 - spread) * 3),
  })

  // 4. Footprint: one address carrying all history links all of it
  factors.push({
    id: 'footprint',
    title: 'Single-address footprint',
    level: items.length >= 80 ? 'risk' : items.length >= 25 ? 'warn' : 'ok',
    evidence: `${items.length} transactions in this sample are tied to one public address.`,
    advice: 'Everything this address ever did is linked together. Keep payments and long-term holdings on separate addresses.',
    penalty: items.length >= 80 ? 1.5 : items.length >= 25 ? 0.8 : 0,
  })

  // 5. Round trips: sending to and receiving from the same address
  const roundTrips = counterparties.filter((c) => c.sent > 0 && c.received > 0)
  factors.push({
    id: 'roundtrips',
    title: 'Two-way links',
    level: roundTrips.length > 2 ? 'risk' : roundTrips.length > 0 ? 'warn' : 'ok',
    evidence: roundTrips.length ? `${roundTrips.length} address${roundTrips.length === 1 ? '' : 'es'} both sent to you and received from you.` : 'No address both pays you and gets paid by you.',
    advice: 'Two-way flows between the same addresses are the strongest public link there is.',
    penalty: Math.min(1, roundTrips.length * 0.35),
  })

  const score = Math.max(0, Math.min(10, Math.round((10 - factors.reduce((s, f) => s + f.penalty, 0)) * 10) / 10))
  return { score, sample: items.length, factors, counterparties, hours }
}
