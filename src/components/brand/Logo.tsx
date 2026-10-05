import { LOGO_HEIGHT, LOGO_WIDTH, MARK_DOTS, MARK_RING, WORD_D, WORD_TRANSFORM } from './logoPaths'

type Props = { className?: string; markOnly?: boolean; title?: string }

// Mottle logo: dappled 3x3 mark with "your note" as the hollow ring, plus the outlined wordmark.
export function Logo({ className, markOnly = false, title = 'Mottle' }: Props) {
  const width = markOnly ? 40 : LOGO_WIDTH
  return (
    <svg className={className} viewBox={`0 0 ${width} ${LOGO_HEIGHT}`} width={width} height={LOGO_HEIGHT} role="img" aria-label={title}>
      <g className="mark-dots" fill="currentColor">
        {MARK_DOTS.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <circle className="mark-ring" cx={MARK_RING.cx} cy={MARK_RING.cy} r={MARK_RING.r} fill="none" stroke="var(--lichen)" strokeWidth={MARK_RING.w} />
      {!markOnly && <path transform={WORD_TRANSFORM} d={WORD_D} fill="currentColor" />}
    </svg>
  )
}
