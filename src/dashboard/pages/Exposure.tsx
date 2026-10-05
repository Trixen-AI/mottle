import { useMemo, useState, type FormEvent } from 'react'
import { explorerAccount } from '../config'
import { AddressChip, ErrorNote, HourChart, LevelChip, Loading, Panel, PaperPanel, ScoreMeter } from '../components/ui'
import { useRecentActivity } from '../hooks/queries'
import { isAddress } from '../lib/chain'
import { analyzeExposure } from '../lib/exposure'
import { shortAddress } from '../lib/format'
import { useWallet } from '../walletContext'

function Report({ address }: { address: string }) {
  const { state } = useWallet()
  const q = useRecentActivity(state.cluster, address)
  const exposure = useMemo(() => (q.data ? analyzeExposure(q.data.items) : null), [q.data])

  if (q.isPending) return <Loading label={`Reading up to 100 transactions of ${shortAddress(address)}`} />
  if (q.error) return <ErrorNote error={q.error} onRetry={() => void q.refetch()} />
  if (!exposure) return null
  if (exposure.sample === 0) return <p className="muted">This address has no transactions on {state.cluster}.</p>

  return (
    <div className="dash-grid">
      <PaperPanel className="span-4" title="Blend score" meta={<AddressChip address={address} href={explorerAccount(state.cluster, address)} />}>
        <ScoreMeter score={exposure.score} label={`From the last ${exposure.sample} transactions`} />
        <p className="small">10 means nothing in this history stands out. Lower scores mean the address is easier to link to people, amounts and habits.</p>
      </PaperPanel>

      <Panel className="span-8" title="What gives you away">
        <ul className="factors">
          {exposure.factors.map((f) => (
            <li key={f.id}>
              <div className="factor-head">
                <LevelChip level={f.level}>{f.title}</LevelChip>
              </div>
              <p>{f.evidence}</p>
              {f.level !== 'ok' ? <p className="small muted">{f.advice}</p> : null}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="span-6" title="Activity by hour (UTC)">
        <HourChart hours={exposure.hours} />
      </Panel>

      <Panel className="span-6" title="Most frequent counterparties">
        {exposure.counterparties.length === 0 ? (
          <p className="muted">No direct counterparties found.</p>
        ) : (
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Address</th>
                <th className="num">Sent</th>
                <th className="num">Received</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {exposure.counterparties.slice(0, 8).map((c) => (
                <tr key={c.address}>
                  <td>
                    <AddressChip address={c.address} href={explorerAccount(state.cluster, c.address)} />
                  </td>
                  <td className="num">{c.sent}</td>
                  <td className="num">{c.received}</td>
                  <td className="num">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}

export default function Exposure() {
  const { state, actions } = useWallet()
  const [input, setInput] = useState('')
  const [checked, setChecked] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const target = checked ?? state.address

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = input.trim()
    if (!isAddress(v)) {
      setError('Enter a valid Solana address')
      return
    }
    setError(null)
    setChecked(v)
  }

  return (
    <>
      <form className="lookup" onSubmit={submit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Check any Solana address (read-only)" spellCheck={false} aria-label="Solana address to check" />
        <button type="submit" className="btn">
          Check
        </button>
        {checked && state.address ? (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setChecked(null)
              setInput('')
            }}
          >
            Back to my wallet
          </button>
        ) : null}
      </form>
      {error ? <ErrorNote error={error} /> : null}
      {target ? (
        <Report key={`${state.cluster}:${target}`} address={target} />
      ) : (
        <section className="gate">
          <h2>How linkable is a wallet?</h2>
          <p>Paste any address above, or connect your own wallet. Mottle reads its recent history and shows what makes it easy to link: repeat counterparties, distinctive amounts, daily habits.</p>
          <button type="button" className="btn btn-accent" onClick={actions.connect}>
            Connect wallet
          </button>
        </section>
      )}
    </>
  )
}
