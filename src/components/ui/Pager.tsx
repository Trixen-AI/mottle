import { Chevron } from './Icons'

type Props = { index: number; total: number; onPrev: () => void; onNext: () => void }

export function Pager({ index, total, onPrev, onNext }: Props) {
  return (
    <div className="pager">
      <div className="pager-count" aria-live="polite">
        <span className="now">{index + 1}</span>
        <span className="all">/ {total}</span>
      </div>
      <div className="pager-bar" aria-hidden>
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <div className="pager-arrows">
        <button className="pager-arrow" type="button" aria-label="Previous" onClick={onPrev}>
          <Chevron dir="left" />
        </button>
        <button className="pager-arrow" type="button" aria-label="Next" onClick={onNext}>
          <Chevron dir="right" />
        </button>
      </div>
    </div>
  )
}
