import { useMemo, useState } from 'react'
import { explorerTx } from '../config'
import { ConnectGate } from '../components/Shell'
import { ErrorNote, Loading, Panel } from '../components/ui'
import { useActivityPages } from '../hooks/queries'
import type { Activity as Tx } from '../lib/chain'
import { formatAmount, formatDate, shortAddress } from '../lib/format'
import { useWallet } from '../walletContext'

type Filter = 'all' | 'sent' | 'received' | 'swap'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
  { id: 'swap', label: 'Swaps' },
]

function exportCsv(items: Tx[]) {
  const rows = [['date', 'type', 'amount', 'asset', 'counterparty', 'fee_sol', 'status', 'signature']]
  for (const a of items)
    rows.push([
      a.time ? new Date(a.time * 1000).toISOString() : '',
      a.kind,
      a.primary ? String(a.primary.amount) : '',
      a.primary?.asset.symbol ?? '',
      a.counterparty ?? '',
      String(a.fee),
      a.status,
      a.signature,
    ])
  const blob = new Blob([rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const el = document.createElement('a')
  el.href = url
  el.download = 'mottle-activity.csv'
  el.click()
  URL.revokeObjectURL(url)
}

function ActivityBody({ address }: { address: string }) {
  const { state } = useWallet()
  const q = useActivityPages(state.cluster, address)
  const [filter, setFilter] = useState<Filter>('all')
  const [asset, setAsset] = useState('all')

  const all = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data])
  const assets = useMemo(() => [...new Set(all.flatMap((a) => (a.primary ? [a.primary.asset.symbol] : [])))], [all])
  const shown = all.filter((a) => (filter === 'all' || a.kind === filter) && (asset === 'all' || a.primary?.asset.symbol === asset))

  return (
    <Panel
      title="Transactions"
      meta={
        <div className="row-gap">
          <span className="muted small">{all.length} loaded</span>
          <button type="button" className="btn" disabled={!shown.length} onClick={() => exportCsv(shown)}>
            Export CSV
          </button>
        </div>
      }
    >
      <div className="filters">
        <div className="seg" role="group" aria-label="Type">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={filter === f.id ? 'is-on' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={asset} onChange={(e) => setAsset(e.target.value)} aria-label="Asset">
          <option value="all">All assets</option>
          {assets.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorNote error={q.error} onRetry={() => void q.refetch()} />
      ) : shown.length === 0 ? (
        <p className="muted">{all.length ? 'Nothing matches these filters.' : 'No transactions on this network yet.'}</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th className="num">Amount</th>
                <th>Counterparty</th>
                <th className="num">Fee</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.signature} className={a.status === 'failed' ? 'is-failed' : ''}>
                  <td>{formatDate(a.time)}</td>
                  <td>
                    <span className={`kind kind-${a.kind}`}>{a.kind}</span>
                    {a.status === 'failed' ? <span className="chip chip-risk">failed</span> : null}
                  </td>
                  <td className={`num ${a.primary && a.primary.amount > 0 ? 'pos' : ''}`}>
                    {a.primary ? `${a.primary.amount > 0 ? '+' : ''}${formatAmount(a.primary.amount, a.primary.asset.symbol === 'SOL' ? 6 : 2)} ${a.primary.asset.symbol}` : '-'}
                  </td>
                  <td title={a.counterparty ?? ''}>{a.counterparty ? shortAddress(a.counterparty) : '-'}</td>
                  <td className="num muted">{a.fee ? a.fee.toFixed(6) : '-'}</td>
                  <td>
                    <a href={explorerTx(state.cluster, a.signature)} target="_blank" rel="noopener noreferrer">
                      {shortAddress(a.signature, 5)} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {q.hasNextPage ? (
        <button type="button" className="btn load-more" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>
          {q.isFetchingNextPage ? 'Loading...' : 'Load older'}
        </button>
      ) : null}
    </Panel>
  )
}

export default function Activity() {
  const { state } = useWallet()
  return (
    <ConnectGate title="A history only you read here" text="Connect a wallet to see every transfer with its counterparty, fee and status, straight from the chain.">
      {state.address ? <ActivityBody key={`${state.cluster}:${state.address}`} address={state.address} /> : null}
    </ConnectGate>
  )
}
