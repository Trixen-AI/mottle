import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Logo } from '@/components/brand/Logo'
import { Cta } from '@/components/ui/Cta'
import { CLUSTER_LABEL, explorerTx, tokenBySymbol } from '../config'
import { AddressChip, ErrorNote, Qr } from '../components/ui'
import { buildTransfer, confirmSignature, toBaseUnits } from '../lib/chain'
import { shortAddress } from '../lib/format'
import { findPayment, parsePayParams, solanaPayUri, type PayLink } from '../lib/paylinks'
import { useWallet } from '../walletContext'

export default function Pay() {
  const [params] = useSearchParams()
  const { link, error: linkError } = useMemo(() => parsePayParams(params), [params])
  const { state, actions, meta } = useWallet()
  const [amount, setAmount] = useState(link?.amount ?? '')
  const [stage, setStage] = useState<'idle' | 'signing' | 'done'>('idle')
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // already paid? (a link can only be used once in practice: its reference finds the first payment)
  const existing = useQuery({
    queryKey: ['paylink', link?.cluster, link?.reference],
    queryFn: () => findPayment(link!),
    enabled: !!link,
    refetchInterval: (q) => (q.state.data ? false : 10_000),
  })

  if (!link)
    return (
      <PayFrame>
        <h1>Link not valid</h1>
        <p>{linkError}</p>
      </PayFrame>
    )

  const token = tokenBySymbol(link.cluster, link.token)!
  const paid = signature ?? existing.data?.signature ?? null

  const pay = async () => {
    if (!state.address) return
    setError(null)
    setStage('signing')
    try {
      const units = toBaseUnits(amount, token.decimals)
      if (units <= 0n) throw new Error('Enter an amount')
      const plan = await buildTransfer({
        cluster: link.cluster,
        from: state.address,
        to: link.recipient,
        token,
        units,
        reference: link.reference,
        memo: link.message || undefined,
      })
      const sig = await actions.signAndSend(plan.transaction)
      await confirmSignature(link.cluster, sig, plan)
      setSignature(sig)
      setStage('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(/reject|denied|cancel/i.test(msg) ? 'You cancelled the payment in your wallet.' : msg)
      setStage('idle')
    }
  }

  const uri = solanaPayUri({ ...(link as Omit<PayLink, 'id' | 'createdAt'>), id: '', createdAt: 0, amount: link.amount ?? (amount || null) })

  return (
    <PayFrame>
      <p className="kicker-sm">Payment request · {CLUSTER_LABEL[link.cluster]}</p>
      <h1>{link.label || 'Pay with Solana'}</h1>
      {link.message ? <p className="pay-msg">“{link.message}”</p> : null}

      {paid ? (
        <div className="pay-done">
          <p className="big-number">Paid</p>
          <a className="btn" href={explorerTx(link.cluster, paid)} target="_blank" rel="noopener noreferrer">
            View transaction ↗
          </a>
        </div>
      ) : (
        <>
          <div className="pay-amount">
            {link.amount ? (
              <p className="big-number">
                {link.amount} <span>{token.symbol}</span>
              </p>
            ) : (
              <div className="field">
                <label htmlFor="pay-amt">Amount in {token.symbol}</label>
                <input id="pay-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} placeholder="0.00" />
              </div>
            )}
            <p className="small">
              to <AddressChip address={link.recipient} chars={6} />
            </p>
          </div>

          <div className="pay-ways">
            <div className="pay-way">
              <h2>Pay in this browser</h2>
              {!state.isConnected ? (
                <Cta className="cta-wide" onClick={actions.connect}>
                  Connect wallet
                </Cta>
              ) : (
                <Cta className="cta-wide" disabled={stage === 'signing' || !amount} onClick={() => void pay()}>
                  {stage === 'signing' ? 'Waiting for wallet...' : `Pay ${amount || ''} ${token.symbol}`}
                </Cta>
              )}
              {state.address ? <p className="small muted">Paying from {shortAddress(state.address)}</p> : null}
              {!meta.configured ? <p className="small muted">Wallet connection is not configured on this site yet. Use the QR code instead.</p> : null}
              {error ? <ErrorNote error={error} /> : null}
            </div>
            <div className="pay-way">
              <h2>Or scan with your phone</h2>
              {link.amount || amount ? <Qr value={uri} size={168} label="Solana Pay QR code" /> : <p className="small muted">Enter an amount to show the QR code.</p>}
              <p className="small muted">Any Solana Pay wallet: Phantom, Solflare, Backpack and others.</p>
            </div>
          </div>
        </>
      )}
    </PayFrame>
  )
}

function PayFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pay-page">
      <header>
        <Link to="/" aria-label="Mottle">
          <Logo />
        </Link>
      </header>
      <main className="pay-card">{children}</main>
    </div>
  )
}
