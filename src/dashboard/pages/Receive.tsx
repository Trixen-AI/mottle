import { useEffect, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cta } from '@/components/ui/Cta'
import { TOKENS, explorerTx, tokenBySymbol, type Cluster } from '../config'
import { ConnectGate } from '../components/Shell'
import { AddressChip, CopyButton, ErrorNote, Panel, PaperPanel, Qr } from '../components/ui'
import { toBaseUnits } from '../lib/chain'
import { formatDate } from '../lib/format'
import { findPayment, loadLinks, newLink, saveLinks, solanaPayUri, webPayUrl, type PayLink } from '../lib/paylinks'
import { useWallet } from '../walletContext'

// Watches one open link: polls for a transaction carrying its reference key
function LinkStatus({ link, onPaid }: { link: PayLink; onPaid: (paid: NonNullable<PayLink['paid']>) => void }) {
  const q = useQuery({
    queryKey: ['paylink', link.cluster, link.reference],
    queryFn: () => findPayment(link),
    enabled: !link.paid,
    refetchInterval: (query) => (query.state.data ? false : 8_000),
  })
  const found = q.data
  useEffect(() => {
    if (found && !link.paid) onPaid({ signature: found.signature, at: found.at })
  }, [found, link.paid, onPaid])

  if (link.paid)
    return (
      <a className="chip chip-ok" href={explorerTx(link.cluster, link.paid.signature)} target="_blank" rel="noopener noreferrer">
        <span aria-hidden>✓</span>Paid ↗
      </a>
    )
  return (
    <span className="chip chip-warn">
      <span className="dot-live" aria-hidden />
      {q.isError ? 'Check failed, retrying' : 'Waiting for payment'}
    </span>
  )
}

function LinkCard({ link, onPaid, onDelete }: { link: PayLink; onPaid: (id: string, paid: NonNullable<PayLink['paid']>) => void; onDelete: (id: string) => void }) {
  const [show, setShow] = useState(false)
  const url = webPayUrl(link)
  return (
    <li className="link-card">
      <div className="link-top">
        <div>
          <p className="link-title">{link.label || 'Payment request'}</p>
          <p className="muted small">
            {link.amount ? `${link.amount} ${link.token}` : `Any amount of ${link.token}`} · {formatDate(link.createdAt / 1000)}
          </p>
        </div>
        <LinkStatus link={link} onPaid={(p) => onPaid(link.id, p)} />
      </div>
      <div className="row-gap">
        <CopyButton text={url} label="Copy link" />
        <CopyButton text={solanaPayUri(link)} label="Copy Solana Pay URI" />
        <button type="button" className="btn" onClick={() => setShow((s) => !s)} aria-expanded={show}>
          {show ? 'Hide QR' : 'QR'}
        </button>
        <a className="btn" href={url} target="_blank" rel="noopener noreferrer">
          Open pay page ↗
        </a>
        <button type="button" className="btn btn-quiet" onClick={() => onDelete(link.id)}>
          Delete
        </button>
      </div>
      {show ? (
        <div className="link-qr">
          <Qr value={solanaPayUri(link)} size={180} label="Solana Pay QR code for this request" />
          <p className="muted small">Scan with any Solana Pay wallet (Phantom, Solflare, Backpack and others).</p>
        </div>
      ) : null}
    </li>
  )
}

function ReceiveBody({ address, cluster }: { address: string; cluster: Cluster }) {
  const tokens = TOKENS[cluster]
  const [links, setLinks] = useState<PayLink[]>(() => loadLinks(address, cluster))
  const [token, setToken] = useState<PayLink['token']>(tokens[0].symbol)
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const update = (fn: (prev: PayLink[]) => PayLink[]) =>
    setLinks((prev) => {
      const next = fn(prev)
      saveLinks(address, cluster, next)
      return next
    })

  const create = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const t = tokenBySymbol(cluster, token)
    if (!t) return
    if (amount.trim()) {
      try {
        if (toBaseUnits(amount, t.decimals) <= 0n) throw new Error('Amount must be more than zero')
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return
      }
    }
    const link = newLink({ cluster, recipient: address, token, amount: amount.trim() || null, label: label.trim(), message: message.trim() })
    update((prev) => [link, ...prev])
    setAmount('')
    setLabel('')
    setMessage('')
  }

  const onPaid = (id: string, paid: NonNullable<PayLink['paid']>) => update((prev) => prev.map((l) => (l.id === id ? { ...l, paid } : l)))
  const onDelete = (id: string) => update((prev) => prev.filter((l) => l.id !== id))

  return (
    <div className="dash-grid">
      <PaperPanel className="span-5" title="Your address" meta={<span className="muted small">{cluster}</span>}>
        <div className="receive-addr">
          <Qr value={address} size={188} label="QR code of your wallet address" />
          <div>
            <AddressChip address={address} chars={6} />
            <p className="small">Anyone can send SOL or any SPL token here. Sharing this address links every payment to it.</p>
            <p className="small muted">For one-off payments, a payment link below is easier to track.</p>
          </div>
        </div>
      </PaperPanel>

      <Panel className="span-7" title="Create a payment link">
        <form className="form" onSubmit={create}>
          <div className="field">
            <label>Asset</label>
            <div className="seg seg-wide" role="radiogroup" aria-label="Asset">
              {tokens.map((t) => (
                <button key={t.symbol} type="button" role="radio" aria-checked={token === t.symbol} className={token === t.symbol ? 'is-on' : ''} onClick={() => setToken(t.symbol)}>
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
          <div className="form-2">
            <div className="field">
              <label htmlFor="req-amt">Amount (leave empty to let the payer choose)</label>
              <input id="req-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.00" />
            </div>
            <div className="field">
              <label htmlFor="req-label">Label</label>
              <input id="req-label" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} placeholder="Invoice 0042" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="req-msg">Message for the payer</label>
            <input id="req-msg" value={message} maxLength={80} onChange={(e) => setMessage(e.target.value)} placeholder="Thanks for the design work" />
          </div>
          {error ? <ErrorNote error={error} /> : null}
          <Cta type="submit" className="cta-wide">
            Create link
          </Cta>
        </form>
      </Panel>

      <Panel className="span-12" title="Payment links" meta={<span className="muted small">{links.filter((l) => !l.paid).length} open · stored in this browser</span>}>
        {links.length === 0 ? (
          <p className="muted">No links yet. Create one above and share it with whoever is paying you.</p>
        ) : (
          <ul className="links">
            {links.map((l) => (
              <LinkCard key={l.id} link={l} onPaid={onPaid} onDelete={onDelete} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

export default function Receive() {
  const { state } = useWallet()
  return (
    <ConnectGate title="Get paid by anyone" text="Connect a wallet to show your address and create payment links that mark themselves paid.">
      {state.address ? <ReceiveBody key={`${state.cluster}:${state.address}`} address={state.address} cluster={state.cluster} /> : null}
    </ConnectGate>
  )
}
