import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { InlineLogo } from '@/components/brand/InlineLogo'
import { Logo } from '@/components/brand/Logo'
import { Cta } from '@/components/ui/Cta'
import { DotCanvas } from '@/components/ui/DotCanvas'
import { ArrowUpRight } from '@/components/ui/Icons'
import { BRAND, FOOTER, SOCIALS } from '@/data/site'

export function Footer() {
  const [joined, setJoined] = useState(false)
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (e.currentTarget.checkValidity()) setJoined(true)
  }

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="build" id="build">
          <a href="#build" aria-label={`${FOOTER.build.title}: ${FOOTER.build.link}`} />
          <h5>{FOOTER.build.title}</h5>
          <div className="build-art">
            <DotCanvas scene="stack" />
          </div>
          <div className="arrow" aria-hidden>
            <ArrowUpRight />
          </div>
          <p>{FOOTER.build.link}</p>
        </div>

        <div className="footer-cols">
          {FOOTER.cols.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <Link to={l.href}>{l.label}</Link>
                    ) : (
                      <a href="#top">
                        {l.label}
                        {l.beta && <span className="beta">beta</span>}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4>Social</h4>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <InlineLogo brand={s.key} decorative />
                </a>
              ))}
            </div>
          </div>
          <div className="signup" id="early-access">
            <h4>
              {FOOTER.signup.title}
              <small>{FOOTER.signup.note}</small>
            </h4>
            {joined ? (
              <p className="signup-done" role="status">
                {FOOTER.signup.done}
              </p>
            ) : (
              <form onSubmit={onSubmit} noValidate={false}>
                <label className="sr-only" htmlFor="signup-email">
                  Email address
                </label>
                <input id="signup-email" type="email" required placeholder={FOOTER.signup.placeholder} autoComplete="email" />
                <Cta type="submit" className="cta-dark">
                  {FOOTER.signup.button}
                </Cta>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="copyright">
        <div className="copyright-main">
          <Logo />
          <p>© 2026 {BRAND.name}. All rights reserved.</p>
          <span className="status">All systems normal</span>
        </div>
        <ul className="legal">
          {FOOTER.legal.map((l) => (
            <li key={l}>
              <a href="#top">{l}</a>
            </li>
          ))}
          <li>
            <a href={`mailto:${BRAND.securityEmail}`}>{BRAND.securityEmail}</a>
          </li>
        </ul>
      </div>
    </footer>
  )
}
