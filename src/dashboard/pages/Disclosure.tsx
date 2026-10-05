import { useState, type ChangeEvent } from 'react'
import { Cta } from '@/components/ui/Cta'
import { ConnectGate } from '../components/Shell'
import { ErrorNote, LevelChip, Loading, Panel, PaperPanel } from '../components/ui'
import { useRecentActivity } from '../hooks/queries'
import { buildReport, downloadJson, signReport, verifyDisclosure, type SignedDisclosure, type VerifyStep } from '../lib/disclosure'
import { formatAmount, formatDate, shortAddress } from '../lib/format'
import { useWallet } from '../walletContext'

function CreateReport({ address }: { address: string }) {
  const { state, actions } = useWallet()
  const recent = useRecentActivity(state.cluster, address)
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  const [purpose, setPurpose] = useState('')
  const [signed, setSigned] = useState<SignedDisclosure | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const items = (recent.data?.items ?? []).filter((a) => a.status === 'success' && a.primary)
  const toggle = (sig: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(sig)) next.delete(sig)
      else next.add(sig)
      return next
    })

  const sign = async () => {
    setError(null)
    setBusy(true)
    try {
      const report = buildReport({ cluster: state.cluster, address, purpose, items: items.filter((a) => picked.has(a.signature)) })
      setSigned(await signReport(report, actions.signMessage))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(/reject|denied|cancel/i.test(msg) ? 'You cancelled the signature in your wallet.' : msg)
    } finally {
      setBusy(false)
    }
  }

  if (signed)
    return (
      <PaperPanel title="Report signed">
        <p>
          {signed.report.transactions.length} transaction{signed.report.transactions.length === 1 ? '' : 's'} from {shortAddress(address, 6)}, signed by your wallet. Nothing else in your history is in this file.
        </p>
        <pre className="sig-preview">{signed.message}</pre>
        <div className="row-gap">
          <button type="button" className="btn btn-accent" onClick={() => downloadJson(`mottle-disclosure-${signed.report.createdAt.slice(0, 10)}.json`, signed)}>
            Download report
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSigned(null)
              setPicked(new Set())
            }}
          >
            New report
          </button>
        </div>
        <p className="small muted">Whoever receives it can check it in the Verify tab, or with any ed25519 tool: the signature covers a SHA-256 hash of the report.</p>
      </PaperPanel>
    )

  return (
    <div className="dash-grid">
      <Panel className="span-8" title="Pick transactions" meta={<span className="muted small">{picked.size} selected</span>}>
        {recent.isPending ? (
          <Loading />
        ) : recent.error ? (
          <ErrorNote error={recent.error} onRetry={() => void recent.refetch()} />
        ) : items.length === 0 ? (
          <p className="muted">No transfers to disclose on this network yet.</p>
        ) : (
          <ul className="pick-list">
            {items.map((a) => (
              <li key={a.signature}>
                <label className={picked.has(a.signature) ? 'is-on' : ''}>
                  <input type="checkbox" checked={picked.has(a.signature)} onChange={() => toggle(a.signature)} />
                  <span className="pick-main">
                    <b>
                      {a.primary!.amount > 0 ? '+' : ''}
                      {formatAmount(a.primary!.amount, 2)} {a.primary!.asset.symbol}
                    </b>
                    <span className="muted small">
                      {a.kind} {a.counterparty ? `· ${shortAddress(a.counterparty)}` : ''}
                    </span>
                  </span>
                  <span className="muted small">{formatDate(a.time)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel className="span-4" title="Report">
        <div className="form">
          <div className="field">
            <label htmlFor="purpose">What is it for?</label>
            <input id="purpose" value={purpose} maxLength={120} onChange={(e) => setPurpose(e.target.value)} placeholder="Q3 invoices for my accountant" />
          </div>
          <p className="small">The report lists only the selected transactions: date, type, amount, asset and counterparty. Your wallet signs a hash of it, which proves the address is yours without moving any funds.</p>
          {error ? <ErrorNote error={error} /> : null}
          <Cta className="cta-wide" disabled={!picked.size || busy} onClick={() => void sign()}>
            {busy ? 'Waiting for wallet...' : `Sign ${picked.size || ''} in wallet`}
          </Cta>
        </div>
      </Panel>
    </div>
  )
}

function VerifyReport() {
  const [steps, setSteps] = useState<VerifyStep[] | null>(null)
  const [file, setFile] = useState<SignedDisclosure | null>(null)
  const [busy, setBusy] = useState(false)
  const [onChain, setOnChain] = useState(true)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    setSteps(null)
    try {
      const parsed = JSON.parse(await f.text()) as SignedDisclosure
      setFile(parsed)
      setSteps(await verifyDisclosure(parsed, { onChain }))
    } catch {
      setFile(null)
      setSteps([{ label: 'File format', ok: false, detail: 'Could not read this file as JSON.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dash-grid">
      <Panel className="span-5" title="Verify a report">
        <div className="form">
          <label className="file-drop">
            <input type="file" accept="application/json,.json" onChange={onFile} />
            <span>Choose a Mottle disclosure file</span>
          </label>
          <label className="confirm">
            <input type="checkbox" checked={onChain} onChange={(e) => setOnChain(e.target.checked)} />
            <span>Also check every transaction against the chain</span>
          </label>
          <p className="small muted">No wallet needed. Verification runs in this browser.</p>
        </div>
      </Panel>
      <Panel className="span-7" title="Result">
        {busy ? (
          <Loading label="Checking signature and chain" />
        ) : steps ? (
          <>
            <ul className="checks">
              {steps.map((s) => (
                <li key={s.label}>
                  <LevelChip level={s.ok ? 'ok' : 'risk'}>{s.label}</LevelChip>
                  <p className="small">{s.detail}</p>
                </li>
              ))}
            </ul>
            {file?.report ? (
              <div className="table-wrap">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th className="num">Amount</th>
                      <th>Counterparty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {file.report.transactions.map((t) => (
                      <tr key={t.signature}>
                        <td>{formatDate(t.time)}</td>
                        <td>{t.kind}</td>
                        <td className="num">
                          {t.amount ?? '-'} {t.asset ?? ''}
                        </td>
                        <td>{t.counterparty ? shortAddress(t.counterparty) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        ) : (
          <p className="muted">Results appear here: whether the file was changed, whether the address really signed it, and whether each transaction matches the chain.</p>
        )}
      </Panel>
    </div>
  )
}

export default function Disclosure() {
  const { state } = useWallet()
  const [tab, setTab] = useState<'create' | 'verify'>('create')
  return (
    <>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'create'} className={tab === 'create' ? 'is-on' : ''} onClick={() => setTab('create')}>
          Create report
        </button>
        <button type="button" role="tab" aria-selected={tab === 'verify'} className={tab === 'verify' ? 'is-on' : ''} onClick={() => setTab('verify')}>
          Verify report
        </button>
      </div>
      {tab === 'verify' ? (
        <VerifyReport />
      ) : (
        <ConnectGate title="Show exactly what you choose" text="Connect a wallet to pick transactions and sign a report you can hand to an accountant or auditor.">
          {state.address ? <CreateReport key={`${state.cluster}:${state.address}`} address={state.address} /> : null}
        </ConnectGate>
      )}
    </>
  )
}
