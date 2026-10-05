import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/Logo'
import { BRAND } from '@/data/site'

// Counts to 100 while fonts and the first paint settle, then fades out (0.5s).
export function Loader() {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    document.body.classList.add('is-locked')
    let raf = 0
    let ready = false
    const start = performance.now()
    Promise.all([document.fonts?.ready, new Promise((r) => (document.readyState === 'complete' ? r(0) : window.addEventListener('load', r, { once: true })))]).then(() => {
      ready = true
    })
    const step = (now: number) => {
      const t = now - start
      // ease toward 90% on time, finish once assets are ready (min 1.2s so it reads)
      const target = ready && t > 1200 ? 100 : Math.min(90, (t / 1800) * 90)
      setPct((p) => {
        const next = Math.min(100, p + Math.max(1, (target - p) * 0.12))
        return target >= p ? Math.round(next) : p
      })
      if (!(ready && t > 1200)) raf = requestAnimationFrame(step)
      else
        setTimeout(() => {
          setPct(100)
          setDone(true)
          document.body.classList.remove('is-locked')
          setTimeout(() => setGone(true), 500)
        }, 250)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      document.body.classList.remove('is-locked')
    }
  }, [])

  if (gone) return null
  return (
    <div className={`loader${done ? ' is-done' : ''}`} role="status" aria-live="polite">
      <span className="loader-count">{pct}%</span>
      <Logo />
      <span className="loader-tag">{BRAND.tagline}</span>
    </div>
  )
}
