import { useState } from 'react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { DotCanvas } from '@/components/ui/DotCanvas'
import { GLYPHS } from '@/components/ui/iconSets'
import { MEGA, NAV } from '@/data/site'

export function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className={`site-header${open ? ' is-open' : ''}`}>
      <div className="wrap">
        <a className="brand-link" href="#top" aria-label="Mottle home" onClick={close}>
          <Logo />
        </a>
        <nav aria-label="Main">
          <ul className="nav" id="main-nav">
            {NAV.map((item) => {
              const Glyph = GLYPHS[item.glyph]
              return (
                <li key={item.label}>
                  {item.href.startsWith('/') ? (
                    <Link to={item.href} onClick={close}>
                      {item.label}
                      <Glyph className="nav-glyph" />
                    </Link>
                  ) : (
                    <a href={item.href} onClick={close}>
                      {item.label}
                      <Glyph className="nav-glyph" />
                    </a>
                  )}
                  {item.mega && (
                    <div className="mega">
                      <ul>
                        {MEGA.map((m) => (
                          <li key={m.label}>
                            <a href={m.href} onClick={close}>
                              <DotCanvas scene={`scr-${m.art}`} />
                              <span>{m.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
        <button className="burger" aria-label="Menu" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
