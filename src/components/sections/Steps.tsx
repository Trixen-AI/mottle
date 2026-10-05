import { useRef, useState } from 'react'
import { Slider } from '@/lib/slick'
import { DotCanvas } from '@/components/ui/DotCanvas'
import { Pager } from '@/components/ui/Pager'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { STEPS } from '@/data/site'

export function Steps() {
  const slider = useRef<Slider>(null)
  const [index, setIndex] = useState(0)
  const total = STEPS.items.length
  const phone = useMediaQuery('(max-width: 642px)')
  const tablet = useMediaQuery('(max-width: 980px)')

  return (
    <section className="steps screen tall-auto" style={{ height: 'auto', minHeight: 0 }}>
      <div className="split">
        <div className="col-30">
          <div>
            <h2>{STEPS.title}</h2>
            <p className="lede">{STEPS.body}</p>
          </div>
          <Pager index={index} total={total} onPrev={() => slider.current?.slickPrev()} onNext={() => slider.current?.slickNext()} />
        </div>
        <div className="col-70">
          <div className="steps-slider">
            <Slider
              ref={slider}
              slidesToShow={phone ? 1 : tablet ? 2 : 3}
              autoplay
              autoplaySpeed={3000}
              speed={500}
              arrows={false}
              dots={false}
              infinite
              pauseOnHover
              beforeChange={(_, next) => setIndex(next)}
            >
              {STEPS.items.map((title, i) => (
                <div key={title}>
                  <article className="step-card">
                    <p className="chip">Step {String(i + 1).padStart(2, '0')}</p>
                    <div className="step-art">
                      <DotCanvas scene={`step-${i + 1}`} />
                    </div>
                    <h5>{title}</h5>
                  </article>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </section>
  )
}
