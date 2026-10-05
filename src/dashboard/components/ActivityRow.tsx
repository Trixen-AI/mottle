import type { Activity } from '../lib/chain'
import { formatAmount, shortAddress, timeAgo } from '../lib/format'

const KIND_LABEL: Record<Activity['kind'], string> = { sent: 'Sent', received: 'Received', swap: 'Swap', other: 'Other' }

export function ActivityRow({ item, href }: { item: Activity; href: string }) {
  const p = item.primary
  const sign = p && p.amount > 0 ? '+' : ''
  return (
    <li className={`tx tx-${item.kind}${item.status === 'failed' ? ' tx-failed' : ''}`}>
      <span className="tx-kind" aria-hidden />
      <div className="tx-main">
        <span className="tx-title">
          {KIND_LABEL[item.kind]}
          {item.counterparty ? <span className="muted"> · {item.kind === 'received' ? 'from' : 'to'} {shortAddress(item.counterparty)}</span> : null}
          {item.status === 'failed' ? <span className="chip chip-risk">failed</span> : null}
        </span>
        <span className="muted small">{timeAgo(item.time)}</span>
      </div>
      <div className="tx-amt">
        {p ? (
          <span className={p.amount > 0 ? 'pos' : ''}>
            {sign}
            {formatAmount(p.amount, p.asset.symbol === 'SOL' ? 4 : 2)} {p.asset.symbol}
          </span>
        ) : (
          <span className="muted">fee only</span>
        )}
        <a className="small" href={href} target="_blank" rel="noopener noreferrer">
          View ↗
        </a>
      </div>
    </li>
  )
}
