import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Cta } from '@/components/ui/Cta'
import { explorerAccount } from '../config'
import { shortAddress } from '../lib/format'
import { DASH_NAV } from '../nav'
import { useWallet } from '../walletContext'

function AccountButton() {
  const { state, actions } = useWallet()
  const [open, setOpen] = useState(false)
  if (!state.address)
    return (
      <button type="button" className="btn btn-accent" onClick={actions.connect}>
        Connect wallet
      </button>
    )
  return (
    <div className="account">
      <button type="button" className="btn account-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {state.walletIcon ? <img src={state.walletIcon} alt="" width={16} height={16} /> : <span className="dot-live" aria-hidden />}
        {shortAddress(state.address)}
      </button>
      {open ? (
        <div className="account-menu" role="menu">
          <p className="account-name">{state.walletName ?? 'Connected wallet'}</p>
          <a role="menuitem" href={explorerAccount(state.cluster, state.address)} target="_blank" rel="noopener noreferrer">
            View on explorer
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(state.address!)
              setOpen(false)
            }}
          >
            Copy address
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false)
              void actions.disconnect()
            }}
          >
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  )
}

function SetupNotice() {
  const { meta } = useWallet()
  if (!meta.setupRequested) return null
  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="setup-title" onClick={meta.dismissSetup}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="setup-title">Wallet connection is not set up</h2>
        <p>
          This build has no Reown project ID, so the wallet modal cannot open. Add your ID to <code>.env</code> and restart the dev server:
        </p>
        <pre>VITE_REOWN_PROJECT_ID=your-project-id</pre>
        <p className="muted">Get one free at dashboard.reown.com. Exposure checks and payment-link verification still work without it.</p>
        <button type="button" className="btn" onClick={meta.dismissSetup}>
          Close
        </button>
      </div>
    </div>
  )
}

export function DashboardShell() {
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const current = DASH_NAV.find((n) => (n.to === '/app' ? pathname === '/app' || pathname === '/app/' : pathname.startsWith(n.to)))

  return (
    <div className={`dash${menu ? ' menu-open' : ''}`}>
      <aside className="dash-side">
        <Link to="/" className="dash-logo" aria-label="Mottle website">
          <Logo />
        </Link>
        <button type="button" className="dash-burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <span />
          <span />
        </button>
        <nav className="dash-nav" aria-label="Dashboard">
          {DASH_NAV.map((n, i) => (
            <NavLink key={n.to} to={n.to} end={'end' in n} onClick={() => setMenu(false)}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="dash-main">
        <header className="dash-top">
          <div>
            <p className="kicker-sm">Mottle wallet</p>
            <h1>{current?.label ?? 'Dashboard'}</h1>
          </div>
          <AccountButton />
        </header>
        <Outlet />
      </div>
      <SetupNotice />
    </div>
  )
}

// Pages that need a wallet render this until one is connected
export function ConnectGate({ children, title, text }: { children: ReactNode; title: string; text: string }) {
  const { state, actions, meta } = useWallet()
  if (state.isConnected) return <>{children}</>
  return (
    <section className="gate">
      <div className="gate-dots" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={i === 4 ? 'you' : ''} />
        ))}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <Cta onClick={actions.connect}>{meta.configured ? 'Connect wallet' : 'Set up wallet'}</Cta>
      <p className="muted small">Mottle never holds your keys. Every transaction is signed in your own wallet.</p>
    </section>
  )
}
