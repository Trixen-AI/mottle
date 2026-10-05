import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Cta } from '@/components/ui/Cta'
import { TOKENS, explorerTx, type Token } from '../config'
import { ConnectGate } from '../components/Shell'
import { ErrorNote, LevelChip, Panel, PaperPanel, ScoreMeter } from '../components/ui'
import { useBalances, useRecentActivity } from '../hooks/queries'
import { buildTransfer, confirmSignature, resolveRecipient, toBaseUnits, type TransferPlan } from '../lib/chain'
import { formatAmount, shortAddress } from '../lib/format'
import { preflight, type Check } from '../lib/preflight'
import { useWallet } from '../walletContext'

type Review = { plan: TransferPlan; to: string; name: string | null; token: Token; amount: string; score: number; checks: Check[] }
type Stage = { step: 'form' } | { step: 'review'; review: Review } | { step: 'sending'; review: Review } | { step: 'done'; review: Review; signature: string }

function SendBody({ address }: { address: string }) {
  const { state, actions } = useWallet()
  const cluster = state.cluster
  const tokens = TOKENS[cluster]
  const balances = useBalances(cluster, address)
  const recent = useRecentActivity(cluster, address)
  const qc = useQueryClient()

  const [symbol, setSymbol] = useState<string>(tokens[0].symbol)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [stage, setStage] = useState<Stage>({ step: 'form' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [askTwice, setAskTwice] = useState(false)

  const token = tokens.find((t) => t.symbol === symbol) ?? tokens[0]
  const holding = balances.data?.holdings.find((h) => h.token.symbol === token.symbol)

  const review = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const units = toBaseUnits(amount, token.decimals)
      if (units <= 0n) throw new Error('Amount must be more than zero')
      const { address: to, name } = await resolveRecipient(cluster, recipient)
      if (to === address) throw new Error('That is your own address')
      const plan = await buildTransfer({ cluster, from: address, to, token, units, memo: memo.trim() || undefined })
      const result = preflight({
        token,
        amount: Number(amount),
        recipient: to,
        history: recent.data?.items ?? [],
        plan,
        solBalance: balances.data?.lamports ?? 0,
        tokenBalance: holding?.amount ?? 0,
      })
      setUnderstood(false)
      setStage({ step: 'review', review: { plan, to, name, token, amount, ...result } })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const send = async (r: Review) => {
    setAskTwice(false)
    setError(null)
    setStage({ step: 'sending', review: r })
    try {
      // blockhashes expire quickly: rebuild right before signing
      const fresh = await buildTransfer({ cluster, from: address, to: r.to, token: r.token, units: toBaseUnits(r.amount, r.token.decimals), memo: memo.trim() || undefined })
      const signature = await actions.signAndSend(fresh.transaction)
      await confirmSignature(cluster, signature, fresh)
      setStage({ step: 'done', review: r, signature })
      void qc.invalidateQueries({ queryKey: ['balances', cluster, address] })
      void qc.invalidateQueries({ queryKey: ['activity', cluster, address] })
      void qc.invalidateQueries({ queryKey: ['activity-pages', cluster, address] })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(/reject|denied|cancel/i.test(msg) ? 'You cancelled the request in your wallet.' : msg)
      setStage({ step: 'review', review: r })
    }
  }

  if (stage.step === 'done') {
    const r = stage.review
    return (
      <PaperPanel title="Sent" className="send-done">
        <p className="big-number">
          {r.amount} {r.token.symbol}
        </p>
        <p>to {r.name ?? shortAddress(r.to, 6)}</p>
        <div className="row-gap">
          <a className="btn" href={explorerTx(cluster, stage.signature)} target="_blank" rel="noopener noreferrer">
            View transaction ↗
          </a>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setStage({ step: 'form' })
              setAmount('')
              setRecipient('')
              setMemo('')
            }}
          >
            New send
          </button>
        </div>
      </PaperPanel>
    )
  }

  const inReview = stage.step === 'review' || stage.step === 'sending'
  const blocking = inReview && stage.review.checks.some((c) => c.blocking)

  return (
    <div className="dash-grid">
      <Panel className="span-7" title="Send">
        <form className="form" onSubmit={review}>
          <div className="field">
            <label>Asset</label>
            <div className="seg seg-wide" role="radiogroup" aria-label="Asset">
              {tokens.map((t) => (
                <button
                  key={t.symbol}
                  type="button"
                  role="radio"
                  aria-checked={symbol === t.symbol}
                  className={symbol === t.symbol ? 'is-on' : ''}
                  onClick={() => {
                    setSymbol(t.symbol)
                    setStage({ step: 'form' })
                  }}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
            <p className="hint">Balance: {holding ? `${formatAmount(holding.amount, token.symbol === 'SOL' ? 6 : 2)} ${token.symbol}` : '...'}</p>
          </div>
          <div className="field">
            <label htmlFor="to">Recipient</label>
            <input
              id="to"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value)
                setStage({ step: 'form' })
              }}
              placeholder={cluster === 'mainnet' ? 'Address or name.sol' : 'Solana address'}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="amt">Amount</label>
            <div className="amount-row">
              <input
                id="amt"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value.replace(',', '.'))
                  setStage({ step: 'form' })
                }}
                placeholder="0.00"
                required
              />
              {holding && token.mint ? (
                <button type="button" className="link-btn" onClick={() => setAmount(String(holding.amount))}>
                  Max
                </button>
              ) : null}
            </div>
          </div>
          <div className="field">
            <label htmlFor="memo">Memo (optional, public)</label>
            <input id="memo" value={memo} maxLength={120} onChange={(e) => setMemo(e.target.value)} placeholder="Visible to everyone on-chain" />
          </div>
          {error ? <ErrorNote error={error} /> : null}
          {!inReview ? (
            <Cta type="submit" className="cta-wide" disabled={busy}>
              {busy ? 'Checking...' : 'Check this send'}
            </Cta>
          ) : null}
        </form>
      </Panel>

      <Panel className="span-5" title="Before you sign" meta={inReview ? <span className="muted small">from your last {recent.data?.items.length ?? 0} tx</span> : null}>
        {!inReview ? (
          <p className="muted">Fill in the send and Mottle checks it against your own history first: who you have paid before, whether the amount stands out, and what it will cost.</p>
        ) : (
          <>
            <ScoreMeter score={stage.review.score} label="Blend score for this send" />
            <ul className="checks">
              {stage.review.checks.map((c) => (
                <li key={c.title}>
                  <LevelChip level={c.level}>{c.title}</LevelChip>
                  <p className="small">{c.detail}</p>
                </li>
              ))}
            </ul>
            <dl className="kv">
              <dt>Network fee</dt>
              <dd>{(stage.review.plan.feeLamports / 1e9).toFixed(6)} SOL</dd>
              {stage.review.plan.createsRecipientAccount ? (
                <>
                  <dt>Account rent</dt>
                  <dd>{(stage.review.plan.rentLamports / 1e9).toFixed(5)} SOL</dd>
                </>
              ) : null}
              <dt>Recipient</dt>
              <dd title={stage.review.to}>{stage.review.name ? `${stage.review.name} · ` : ''}{shortAddress(stage.review.to, 6)}</dd>
            </dl>
            <label className="confirm">
              <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} disabled={blocking} />
              <span>I understand this send is public: the recipient and amount will be visible on-chain.</span>
            </label>
            <Cta className="cta-wide" disabled={!understood || blocking || stage.step === 'sending'} onClick={() => setAskTwice(true)}>
              {stage.step === 'sending' ? 'Waiting for wallet...' : `Send ${stage.review.amount} ${stage.review.token.symbol}`}
            </Cta>
          </>
        )}
      </Panel>

      {askTwice && stage.step === 'review' ? (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="twice-title" onClick={() => setAskTwice(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="twice-title">Send publicly?</h2>
            <p>
              {stage.review.amount} {stage.review.token.symbol} to {stage.review.name ?? shortAddress(stage.review.to, 6)}. This link between your address and theirs will be permanent and public.
            </p>
            <div className="row-gap">
              <button type="button" className="btn" onClick={() => setAskTwice(false)}>
                Go back
              </button>
              <button type="button" className="btn btn-accent" onClick={() => void send(stage.review)}>
                Yes, sign in wallet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Send() {
  const { state } = useWallet()
  return (
    <ConnectGate title="Score before you sign" text="Connect a wallet to send SOL, USDC or USDT with a privacy check against your own history first.">
      {state.address ? <SendBody key={`${state.cluster}:${state.address}`} address={state.address} /> : null}
    </ConnectGate>
  )
}
