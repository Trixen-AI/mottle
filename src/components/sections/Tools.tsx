import { DotCanvas } from '@/components/ui/DotCanvas'
import { ArrowUpRight } from '@/components/ui/Icons'
import { TOOLS } from '@/data/site'

export function Tools() {
  return (
    <section id="tools" className="tools screen">
      <div className="wrap">
        <div className="tools-grid">
          <div className="tools-head">
            <h2>{TOOLS.title}</h2>
          </div>
          <div className="tools-note">
            <p>{TOOLS.note}</p>
          </div>
          {TOOLS.cards.map((card, i) => (
            <a key={card.label} className="tool-card" href="#wallet">
              <DotCanvas scene={card.art} offset={i * 1.3} />
              <span className="peek" aria-hidden>
                <ArrowUpRight />
              </span>
              <span className="tool-tag">{card.tag}</span>
              <p className="tool-label">{card.label}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
