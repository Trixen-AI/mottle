import { ANSWER_ICONS } from '@/components/ui/iconSets'
import { ANSWERS } from '@/data/site'

// Isometric pile of standard notes: every tile the same size, one lichen tile among them.
function NotesPile() {
  const tiles: { x: number; y: number; z: number; you?: boolean }[] = []
  for (let gx = 0; gx < 4; gx++)
    for (let gy = 0; gy < 4; gy++) {
      const z = (gx * 7 + gy * 3) % 4
      for (let k = 0; k <= z; k++) tiles.push({ x: gx, y: gy, z: k, you: gx === 2 && gy === 1 && k === z })
    }
  tiles.sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z)
  const W = 46
  const H = 26
  const D = 22
  const iso = (x: number, y: number, z: number) => [210 + (x - y) * W, 250 + (x + y) * H - z * D]
  return (
    <svg viewBox="0 0 500 500" aria-hidden>
      <defs>
        <linearGradient id="np-top" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9d8d1" />
        </linearGradient>
        <linearGradient id="np-left" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#bdbcb5" />
          <stop offset="1" stopColor="#8f9089" />
        </linearGradient>
        <linearGradient id="np-right" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6f706a" />
          <stop offset="1" stopColor="#3a3b38" />
        </linearGradient>
      </defs>
      {tiles.map((t, n) => {
        const [cx, cy] = iso(t.x, t.y, t.z)
        const g = 0.86
        const top = `${cx},${cy - H * g} ${cx + W * g},${cy} ${cx},${cy + H * g} ${cx - W * g},${cy}`
        const left = `${cx - W * g},${cy} ${cx},${cy + H * g} ${cx},${cy + H * g + D * 0.8} ${cx - W * g},${cy + D * 0.8}`
        const right = `${cx + W * g},${cy} ${cx},${cy + H * g} ${cx},${cy + H * g + D * 0.8} ${cx + W * g},${cy + D * 0.8}`
        return (
          <g key={n}>
            <polygon points={left} fill="url(#np-left)" />
            <polygon points={right} fill="url(#np-right)" />
            <polygon points={top} fill={t.you ? 'var(--lichen)' : 'url(#np-top)'} stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.8" />
          </g>
        )
      })}
    </svg>
  )
}

export function Answers() {
  return (
    <section className="answers screen">
      <div className="split">
        <div className="col-40">
          <div>
            <h2>{ANSWERS.title}</h2>
            <p className="lede">{ANSWERS.body}</p>
          </div>
        </div>
        <div className="col-60">
          {ANSWERS.items.map((a) => {
            const Icon = ANSWER_ICONS[a.icon]
            return (
              <article key={a.title} className="answer">
                <Icon className="answer-icon" />
                <div>
                  <h5>{a.title}</h5>
                  <p>{a.text}</p>
                  <span className={`answer-state ${a.state}`}>{a.state}</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <div className="answers-art">
        <NotesPile />
      </div>
    </section>
  )
}
