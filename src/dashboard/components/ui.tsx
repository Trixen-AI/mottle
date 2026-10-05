import { useEffect, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'
import type { Level } from '../lib/exposure'
import { shortAddress } from '../lib/format'

/* ─────────── Panels: two explicit variants, matching the site's ink and paper sections ─────────── */

type PanelProps = { title?: string; meta?: ReactNode; children: ReactNode; className?: string }

function PanelBody({ title, meta, children }: Omit<PanelProps, 'className'>) {
  return (
    <>
      {title || meta ? (
        <header className="panel-head">
          {title ? <h2>{title}</h2> : <span />}
          {meta ? <div className="panel-meta">{meta}</div> : null}
        </header>
      ) : null}
      {children}
    </>
  )
}

export function Panel({ className = '', ...rest }: PanelProps) {
  return (
    <section className={`panel ${className}`}>
      <PanelBody {...rest} />
    </section>
  )
}

export function PaperPanel({ className = '', ...rest }: PanelProps) {
  return (
    <section className={`panel panel-paper ${className}`}>
      <PanelBody {...rest} />
    </section>
  )
}

/* ─────────── Status chip: colour always paired with an icon and a word ─────────── */

const LEVEL_TEXT: Record<Level, string> = { ok: 'Good', warn: 'Watch', risk: 'Exposed' }
const LEVEL_ICON: Record<Level, string> = { ok: '✓', warn: '!', risk: '×' }

export function LevelChip({ level, children }: { level: Level; children?: ReactNode }) {
  return (
    <span className={`chip chip-${level}`}>
      <span aria-hidden>{LEVEL_ICON[level]}</span>
      {children ?? LEVEL_TEXT[level]}
    </span>
  )
}

/* ─────────── Blend score: hero number + ten-dot meter (a stat, not a chart) ─────────── */

export function ScoreMeter({ score, label = 'Blend score' }: { score: number; label?: string }) {
  const filled = Math.round(score)
  return (
    <div className="score" role="img" aria-label={`${label}: ${score} out of 10`}>
      <div className="score-num">
        {score.toFixed(1)}
        <span>/10</span>
      </div>
      <div className="score-dots" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < filled ? 'on' : ''} />
        ))}
      </div>
      <p className="score-label">{label}</p>
    </div>
  )
}

/* ─────────── Activity by hour: single series, one hue, hover tooltip + table view ─────────── */

export function HourChart({ hours }: { hours: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const max = Math.max(1, ...hours)
  const W = 24 * 18
  const H = 120
  return (
    <figure className="hours">
      <div className="hours-tools">
        <button type="button" className="link-btn" onClick={() => setTable((t) => !t)}>
          {table ? 'Show chart' : 'Show table'}
        </button>
      </div>
      {table ? (
        <table className="data-table compact">
          <thead>
            <tr>
              <th>Hour (UTC)</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((n, h) => (
              <tr key={h}>
                <td>{String(h).padStart(2, '0')}:00</td>
                <td>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="hours-plot">
          <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label="Transactions per hour of day, UTC">
            <line x1="0" x2={W} y1={H} y2={H} className="axis" />
            {hours.map((n, h) => {
              const bh = n ? Math.max(4, (n / max) * (H - 8)) : 0
              const x = h * 18 + 2 // 14px bars, 4px gap
              return (
                <g key={h} onMouseEnter={() => setHover(h)} onMouseLeave={() => setHover(null)}>
                  {/* hit target taller and wider than the bar */}
                  <rect x={h * 18} y="0" width="18" height={H} fill="transparent" />
                  {bh ? <path className={hover === h ? 'bar is-hover' : 'bar'} d={`M${x} ${H}V${H - bh + 4}a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4V${H}z`} /> : null}
                  {h % 6 === 0 ? (
                    <text x={h * 18 + 9} y={H + 16} className="tick">
                      {String(h).padStart(2, '0')}
                    </text>
                  ) : null}
                </g>
              )
            })}
          </svg>
          {hover !== null ? (
            <div className="tip" style={{ left: `${((hover * 18 + 9) / W) * 100}%` }}>
              <b>{hours[hover]}</b> tx at {String(hover).padStart(2, '0')}:00 UTC
            </div>
          ) : null}
        </div>
      )}
    </figure>
  )
}

/* ─────────── Address with copy ─────────── */

export function AddressChip({ address, chars = 4, href }: { address: string; chars?: number; href?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <span className="addr">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" title={address}>
          {shortAddress(address, chars)}
        </a>
      ) : (
        <span title={address}>{shortAddress(address, chars)}</span>
      )}
      <button type="button" className="addr-copy" onClick={copy} aria-label={`Copy ${address}`}>
        {copied ? '✓' : '⧉'}
      </button>
    </span>
  )
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1400)
        } catch {
          /* blocked */
        }
      }}
    >
      {done ? 'Copied' : label}
    </button>
  )
}

/* ─────────── QR code (paper on ink, like the brand) ─────────── */

export function Qr({ value, size = 200, label }: { value: string; size?: number; label: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0a0b0a', light: '#f1f0eb' } })
      .then((s) => live && setSvg(s))
      .catch(() => live && setSvg(''))
    return () => {
      live = false
    }
  }, [value])
  return <div className="qr" style={{ width: size, height: size }} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
}

/* ─────────── Loading + errors ─────────── */

export function Loading({ label = 'Reading the chain' }: { label?: string }) {
  return (
    <div className="loading-row" role="status">
      <span className="loading-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      {label}
    </div>
  )
}

function friendlyError(msg: string) {
  if (/403|forbidden/i.test(msg)) return 'This RPC endpoint blocks requests from browsers. Set VITE_REOWN_PROJECT_ID (uses Reown RPC) or your own endpoint in .env.'
  if (/429|rate limit/i.test(msg)) return 'The RPC is rate limiting requests. Try again in a moment, or set your own endpoint in .env.'
  if (/failed to fetch|network/i.test(msg)) return 'Could not reach the RPC endpoint. Check your connection and try again.'
  return msg
}

export function ErrorNote({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : String(error)
  return (
    <div className="error-note" role="alert">
      <p>{friendlyError(msg)}</p>
      {onRetry ? (
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}
