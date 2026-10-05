import { useMemo } from 'react'
import { Link } from 'react-router'
import { explorerTx } from '../config'
import { ConnectGate } from '../components/Shell'
import { ActivityRow } from '../components/ActivityRow'
import { ErrorNote, LevelChip, Loading, Panel, PaperPanel, ScoreMeter } from '../components/ui'
import { useBalances, useRecentActivity, useSolPrice } from '../hooks/queries'
import { analyzeExposure } from '../lib/exposure'
import { formatAmount, formatUsd } from '../lib/format'
import { loadLinks } from '../lib/paylinks'
import { useWallet } from '../walletContext'

function OverviewBody({ address }: { address: string }) {
  const { state } = useWallet()
  const cluster = state.cluster
  const balances = useBalances(cluster, address)
  const recent = useRecentActivity(cluster, address)
  const price = useSolPrice()

  const exposure = useMemo(() => (recent.data ? analyzeExposure(recent.data.items) : null), [recent.data])
  const worst = exposure?.factors.toSorted((a, b) => b.penalty - a.penalty)[0]
  const links = loadLinks(address, cluster)
  const openLinks = links.filter((l) => !l.paid).length

  const total = balances.data
    ? balances.data.holdings.reduce((sum, h) => sum + (h.token.stable ? h.amount : h.token.symbol === 'SOL' && price.data ? h.amount * price.data : 0), 0)
    : 0

  return (
    <div className="dash-grid">
      <PaperPanel className="span-8" title="Wallet balance" meta={<span className="muted">{cluster === 'devnet' ? 'Devnet' : 'Mainnet'} · public</span>}>
        {balances.isPending ? (
          <Loading />
        ) : balances.error ? (
          <ErrorNote error={balances.error} onRetry={() => void balances.refetch()} />
        ) : (
          <>
            <p className="big-number">{formatUsd(total)}</p>
            <p className="muted small">{price.data ? `SOL at ${formatUsd(price.data)}` : 'SOL price unavailable, stablecoins counted at $1'}</p>
            <div className="holdings">
              {balances.data.holdings.map((h) => (
                <div key={h.token.symbol} className="holding">
                  <span className="sym">{h.token.symbol}</span>
                  <span className="amt">{formatAmount(h.amount, h.token.symbol === 'SOL' ? 4 : 2)}</span>
                  <span className="muted small">{h.token.name}</span>
                </div>
              ))}
            </div>
            {balances.data.otherTokens ? <p className="muted small">+ {balances.data.otherTokens} other token{balances.data.otherTokens === 1 ? '' : 's'} not shown</p> : null}
          </>
        )}
      </PaperPanel>

      <Panel className="span-4" title="Exposure" meta={<Link to="/app/exposure">Details</Link>}>
        {recent.isPending ? (
          <Loading label="Reading your history" />
        ) : recent.error ? (
          <ErrorNote error={recent.error} onRetry={() => void recent.refetch()} />
        ) : exposure ? (
          <>
            <ScoreMeter score={exposure.score} />
            {worst && worst.level !== 'ok' ? (
              <p className="small">
                <LevelChip level={worst.level}>{worst.title}</LevelChip> {worst.evidence}
              </p>
            ) : (
              <p className="small muted">Nothing stands out in your last {exposure.sample} transactions.</p>
            )}
          </>
        ) : null}
      </Panel>

      <Panel className="span-8" title="Recent activity" meta={<Link to="/app/activity">All activity</Link>}>
        {recent.isPending ? (
          <Loading />
        ) : recent.error ? (
          <ErrorNote error={recent.error} onRetry={() => void recent.refetch()} />
        ) : recent.data.items.length === 0 ? (
          <p className="muted">No transactions on this network yet.</p>
        ) : (
          <ul className="tx-list">
            {recent.data.items.slice(0, 6).map((a) => (
              <ActivityRow key={a.signature} item={a} href={explorerTx(cluster, a.signature)} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="span-4" title="Do something">
        <div className="quick">
          <Link to="/app/send" className="quick-item">
            <span className="n">02</span>Send with a privacy check
          </Link>
          <Link to="/app/receive" className="quick-item">
            <span className="n">03</span>Request a payment
            {openLinks ? <span className="badge">{openLinks} open</span> : null}
          </Link>
          <Link to="/app/disclosure" className="quick-item">
            <span className="n">05</span>Share a signed report
          </Link>
        </div>
      </Panel>
    </div>
  )
}

export default function Overview() {
  const { state } = useWallet()
  return (
    <ConnectGate title="Your wallet, at a glance" text="Connect a Solana wallet to see your balances, recent activity and how exposed your history is.">
      {state.address ? <OverviewBody address={state.address} /> : null}
    </ConnectGate>
  )
}
