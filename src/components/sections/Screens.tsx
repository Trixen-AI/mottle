import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { useGSAP } from '@gsap/react'
import { DotCanvas } from '@/components/ui/DotCanvas'
import { ArrowUpRight } from '@/components/ui/Icons'
import { SCREENS } from '@/data/site'

gsap.registerPlugin(Draggable, useGSAP)

const DRIFT = 3.4 // px per second, a slow continuous drift
const ADVANCE_MS = 4000
const GAP = 40 // 20px margin on each side of a card

export function Screens() {
  const track = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const hovering = useRef(false)
  const items = [...SCREENS.items, ...SCREENS.items]

  useGSAP(
    () => {
      const el = track.current
      if (!el) return
      const cards = gsap.utils.toArray<HTMLElement>('.screen-card', el)
      let span = 0
      let total = 0
      let offset = 0
      const measure = () => {
        span = cards[0].offsetWidth + GAP
        total = span * cards.length
      }
      measure()
      // cards sit in a row from x=0; each is moved by the shared offset and wrapped
      const setters = cards.map((c) => gsap.quickSetter(c, 'x', 'px'))
      const place = () => {
        const wrap = gsap.utils.wrap(-span, total - span)
        cards.forEach((_, i) => setters[i](wrap(i * span + offset) - i * span))
      }
      place()

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let dragging = false
      const tick = (_t: number, dt: number) => {
        if (!dragging && !reduced) offset -= (DRIFT * dt) / 1000
        place()
      }
      gsap.ticker.add(tick)

      const proxy = document.createElement('div')
      let last = 0
      const [drag] = Draggable.create(proxy, {
        type: 'x',
        trigger: el,
        onPress() {
          dragging = true
          last = this.x
        },
        onDrag() {
          offset += this.x - last
          last = this.x
        },
        onRelease() {
          dragging = false
        },
      })

      const onResize = () => {
        measure()
        place()
      }
      window.addEventListener('resize', onResize)
      return () => {
        gsap.ticker.remove(tick)
        drag.kill()
        window.removeEventListener('resize', onResize)
      }
    },
    { scope: track },
  )

  useEffect(() => {
    const id = setInterval(() => {
      if (!hovering.current) setCurrent((c) => (c + 1) % SCREENS.items.length)
    }, ADVANCE_MS)
    return () => clearInterval(id)
  }, [])

  const active = SCREENS.items[current]

  return (
    <section id="wallet" className="screens screen">
      <div className="screens-inner">
        <div className="screens-top">
          <div>
            <h2>{SCREENS.title}</h2>
          </div>
          <div className="screens-desc" aria-live="polite">
            <h3 key={`h${current}`}>{active.name}</h3>
            <p key={`p${current}`}>{active.text}</p>
          </div>
        </div>
        <div className="screens-track" ref={track} role="region" aria-label="Wallet screens, drag to browse">
          {items.map((s, i) => (
            <div
              key={i}
              className={`screen-card${i % SCREENS.items.length === current ? ' is-current' : ''}`}
              aria-hidden={i >= SCREENS.items.length || undefined}
              onMouseEnter={() => {
                hovering.current = true
                setCurrent(i % SCREENS.items.length)
              }}
              onMouseLeave={() => (hovering.current = false)}
            >
              <DotCanvas scene={`scr-${s.art}`} offset={i * 0.7} />
              <span className="peek" aria-hidden>
                <ArrowUpRight />
              </span>
              <p className="no">{s.no}</p>
              <p className="name">{s.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
