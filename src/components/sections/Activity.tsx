import { useRef, useState } from 'react'
import { Slider } from '@/lib/slick'
import { FEED_ICONS } from '@/components/ui/iconSets'
import { Pager } from '@/components/ui/Pager'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ACTIVITY } from '@/data/site'

// Mottled backdrop: soft grey blotches under a halftone dot screen
function Mottle() {
  const blobs = [
    [120, 160, 260, 0.55], [520, 120, 300, 0.35], [760, 420, 340, 0.5], [300, 520, 280, 0.3],
    [640, 760, 320, 0.45], [140, 820, 240, 0.4], [420, 330, 180, 0.6], [820, 900, 220, 0.25],
  ]
  return (
    <svg viewBox="0 0 855 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="mt-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
        <pattern id="mt-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="2.2" fill="#0a0b0a" />
        </pattern>
        <mask id="mt-mask">
          <rect width="855" height="900" fill="#fff" />
          <g filter="url(#mt-blur)">
            {blobs.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#000" opacity={o} />)}
          </g>
        </mask>
      </defs>
      <rect width="855" height="900" fill="#2b2d29" />
      <g filter="url(#mt-blur)">
        {blobs.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r * 0.8} fill="#9b9c95" opacity={o} />)}
      </g>
      <rect width="855" height="900" fill="url(#mt-dots)" mask="url(#mt-mask)" opacity="0.55" />
    </svg>
  )
}

export function Activity() {
  const slider = useRef<Slider>(null)
  const [index, setIndex] = useState(0)
  const total = ACTIVITY.items.length
  const phone = useMediaQuery('(max-width: 642px)')

  return (
    <section className="activity screen">
      <div className="split">
        <div className="col-40">
          <div>
            <h3>{ACTIVITY.title}</h3>
            <p className="lede">{ACTIVITY.body}</p>
          </div>
          <Pager index={index} total={total} onPrev={() => slider.current?.slickPrev()} onNext={() => slider.current?.slickNext()} />
        </div>
        <div className="col-60">
          <div className="activity-bg">
            <Mottle />
          </div>
          <div className="feed">
            <Slider
              ref={slider}
              vertical
              verticalSwiping
              centerMode
              centerPadding="0px"
              slidesToShow={phone ? 1 : 3}
              autoplay
              autoplaySpeed={3000}
              speed={500}
              arrows={false}
              dots={false}
              pauseOnHover
              beforeChange={(_, next) => setIndex(next)}
            >
              {ACTIVITY.items.map((item) => {
                const Icon = FEED_ICONS[item.icon]
                return (
                  <div key={item.who}>
                    <article className="feed-card">
                      <Icon className="feed-icon" />
                      <p className="text">{item.text}</p>
                      <p className="who">
                        <strong>{item.who}</strong>
                      </p>
                      <p className="meta">{item.meta}</p>
                    </article>
                  </div>
                )
              })}
            </Slider>
          </div>
        </div>
      </div>
    </section>
  )
}
