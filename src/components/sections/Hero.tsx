import { lazy, Suspense, useEffect, useState } from 'react'
import { InlineLogo } from '@/components/brand/InlineLogo'
import { Cta } from '@/components/ui/Cta'
import { DotCanvas } from '@/components/ui/DotCanvas'
import { DemoBadge } from '@/components/ui/Icons'
import { useInView } from '@/hooks/useInView'
import { BRAND, HERO, MARQUEE } from '@/data/site'

// Three.js is split into its own chunk
const Globe = lazy(() => import('./Globe').then((m) => ({ default: m.Globe })))

const ROTATE_MS = 2100

export function Hero() {
  const [ref, inView] = useInView<HTMLElement>(0.2)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setI((n) => (n + 1) % HERO.rotating.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  // three copies so the -50% loop never shows a gap on wide screens
  const logos = [...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE]

  return (
    <section id="top" ref={ref} className={`hero screen reveal${inView ? ' is-in' : ''}`}>
      <div className="wrap">
        <div className="col-50 hero-left">
          <Suspense fallback={<div className="globe-box" />}>
            <Globe />
          </Suspense>
        </div>
        <div className="col-50 hero-copy">
          <h1 className="rv rv-up d-01">
            {HERO.title.map((line) => (
              <span key={line} style={{ display: 'block' }}>
                {line}
              </span>
            ))}
          </h1>
          <p key={i} className="rotator" aria-live="off">
            {HERO.rotating[i]}
          </p>
          <div className="hero-actions rv rv-right d-03">
            <Cta href={BRAND.appUrl}>{HERO.cta}</Cta>
            <span className="divider" aria-hidden />
            <DemoBadge className="demo-badge" role="img" aria-label="Demo: test money only" />
          </div>
        </div>
        <div className="hero-bottom">
          <div className="marquee" aria-label="Works with Solana, USDC, USDT and Tor">
            <div className="marquee-track">
              {logos.map((b, n) => (
                <div key={n} className={`marquee-item${b === 'usdt' ? ' tall' : ''}`} aria-hidden={n >= MARQUEE.length || undefined}>
                  <InlineLogo brand={b} decorative={n >= MARQUEE.length} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <DotCanvas scene="cipher" />
      </div>
    </section>
  )
}
