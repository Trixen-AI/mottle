// Mottle's drawing grammar: everything is built from dots of a few standard sizes,
// so "your" dot (lichen) can be shown blending into a crowd of identical ones.
// Each scene is a pure function of time t (seconds) and the canvas size.

export type Scene = (c: CanvasRenderingContext2D, w: number, h: number, t: number) => void

const PAPER = '241,240,235'
const LICHEN = '#c9f26a'
const FOG = '#8a8b84'
const TITLE = "'Tektur', sans-serif"
const TEXT = "'Lexend', sans-serif"

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = a
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const TAU = Math.PI * 2
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function dot(c: CanvasRenderingContext2D, x: number, y: number, r: number, a = 1, color?: string) {
  c.globalAlpha = a
  c.fillStyle = color ?? `rgb(${PAPER})`
  c.beginPath()
  c.arc(x, y, Math.max(0, r), 0, TAU)
  c.fill()
  c.globalAlpha = 1
}

function ring(c: CanvasRenderingContext2D, x: number, y: number, r: number, a = 1, color = LICHEN, lw = 1.5) {
  c.globalAlpha = a
  c.strokeStyle = color
  c.lineWidth = lw
  c.beginPath()
  c.arc(x, y, Math.max(0, r), 0, TAU)
  c.stroke()
  c.globalAlpha = 1
}

// Assigning ctx.font with a web-font family forces a synchronous style/layout pass,
// so only assign it when the value actually changes.
const FONT = new WeakMap<CanvasRenderingContext2D, string>()
// Resizing a canvas resets its context state, so forget the cached font then.
export function resetFont(c: CanvasRenderingContext2D) {
  FONT.delete(c)
}
function setFont(c: CanvasRenderingContext2D, f: string) {
  if (FONT.get(c) === f) return
  c.font = f
  FONT.set(c, f)
}

function label(c: CanvasRenderingContext2D, s: string, x: number, y: number, size = 11, color = FOG, font = TEXT, align: CanvasTextAlign = 'left') {
  c.fillStyle = color
  setFont(c, `300 ${size}px ${font}`)
  c.textAlign = align
  c.textBaseline = 'alphabetic'
  c.fillText(s, x, y)
}

// A cluster of dots in a soft disc, stable per seed
function cluster(seed: number, n: number) {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const a = r() * TAU
    const d = Math.sqrt(r())
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: 0.6 + r() * 0.8, p: r() * TAU }
  })
}

function drawCluster(c: CanvasRenderingContext2D, pts: ReturnType<typeof cluster>, cx: number, cy: number, R: number, t: number, alpha = 0.7, size = 1.6) {
  for (const p of pts) {
    const wob = Math.sin(t * 0.8 + p.p) * 1.2
    dot(c, cx + p.x * R + wob, cy + p.y * R, size * p.s, alpha * (0.45 + 0.55 * Math.abs(Math.sin(p.p + t * 0.3))))
  }
}

function field(seed: number, n: number) {
  const r = rng(seed)
  return Array.from({ length: n }, () => ({ x: r(), y: r(), s: r(), p: r() * TAU, v: 0.2 + r() * 0.8 }))
}

const CACHE = new Map<string, unknown>()
function memo<T>(key: string, make: () => T): T {
  if (!CACHE.has(key)) CACHE.set(key, make())
  return CACHE.get(key) as T
}

/* ─────────── Tool cards ─────────── */

const autopilot: Scene = (c, w, h, t) => {
  const pools = [
    { x: w * 0.25, y: h * 0.44, R: Math.min(w, h) * 0.13, n: 60, name: 'pool a  ·  blend 6/10' },
    { x: w * 0.68, y: h * 0.36, R: Math.min(w, h) * 0.17, n: 110, name: 'pool b  ·  blend 7/10' },
    { x: w * 0.55, y: h * 0.7, R: Math.min(w, h) * 0.08, n: 18, name: 'pool c  ·  beta' },
  ]
  pools.forEach((p, i) => {
    const pts = memo(`ap${i}`, () => cluster(11 + i, p.n))
    drawCluster(c, pts, p.x, p.y, p.R, t, i === 2 ? 0.35 : 0.75)
    label(c, p.name, p.x - p.R, p.y + p.R + 18, 10)
  })
  // your transfer travels to the densest pool, then becomes one of the crowd
  const k = (t % 6) / 6
  const sx = w * 0.12, sy = h * 0.86
  const tx = pools[1].x + pools[1].R * 0.2, ty = pools[1].y + pools[1].R * 0.1
  const m = ease(k / 0.7)
  const x = lerp(sx, tx, m)
  const y = lerp(sy, ty, m) - Math.sin(m * Math.PI) * h * 0.18
  c.setLineDash([2, 5])
  c.strokeStyle = 'rgba(201,242,106,0.35)'
  c.beginPath()
  c.moveTo(sx, sy)
  c.quadraticCurveTo((sx + tx) / 2, (sy + ty) / 2 - h * 0.36, tx, ty)
  c.stroke()
  c.setLineDash([])
  const fade = k > 0.7 ? 1 - ease((k - 0.7) / 0.25) : 1
  dot(c, x, y, 3.2, 1, fade > 0.5 ? LICHEN : `rgb(${PAPER})`)
  ring(c, x, y, 7 + (1 - fade) * 10, fade)
}

const sendScore: Scene = (c, w, h, t) => {
  const cx = w / 2, cy = h * 0.48, R = Math.min(w, h) * 0.3
  const k = (t % 5) / 5
  const filled = Math.round(ease(k / 0.6) * 7)
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * (0.8 + (i / 9) * 1.4)
    const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R
    if (i < filled) dot(c, x, y, 6, 1, i === filled - 1 ? LICHEN : `rgb(${PAPER})`)
    else ring(c, x, y, 6, 0.4, `rgb(${PAPER})`, 1)
  }
  c.fillStyle = `rgb(${PAPER})`
  setFont(c, `400 ${Math.round(R * 0.62)}px ${TITLE}`)
  c.textAlign = 'center'
  c.fillText(`${filled}/10`, cx, cy + R * 0.2)
  label(c, 'blend score before you sign', cx, cy + R * 0.55, 11, FOG, TEXT, 'center')
  // 500 USDT bar
  const by = h * 0.82
  label(c, '500 USDT', w * 0.14, by, 12, `rgb(${PAPER})`)
  for (let i = 0; i < 5; i++) dot(c, w * 0.52 + i * 16, by - 4, 4.5, k > 0.6 ? 1 : 0.25)
}

const links: Scene = (c, w, h, t) => {
  const r = memo('lk', () => field(5, 90))
  // the crowd on the right
  for (const p of r) dot(c, w * (0.6 + p.x * 0.36), h * (0.2 + p.y * 0.6), 1.4 + p.s, 0.25 + 0.4 * p.s)
  // link card
  const url = 'mottleprotocol.xyz/p/4f9a'
  setFont(c, `300 11px ${TEXT}`)
  // the card grows to fit the link so the longer domain never spills over its border
  const x0 = w * 0.08, y0 = h * 0.38, cw = Math.max(w * 0.38, c.measureText(url).width + 28), ch = h * 0.2
  c.strokeStyle = 'rgba(241,240,235,0.35)'
  c.lineWidth = 1
  c.beginPath()
  c.roundRect(x0, y0, cw, ch, 12)
  c.stroke()
  label(c, url, x0 + 14, y0 + 26, 11, `rgb(${PAPER})`)
  label(c, 'pay 80 USDC, no wallet', x0 + 14, y0 + 46, 10)
  // packets travelling from the card into the crowd
  for (let i = 0; i < 6; i++) {
    const k = ((t * 0.25 + i / 6) % 1)
    const x = lerp(x0 + cw, w * 0.78, k)
    const y = y0 + ch / 2 + Math.sin(k * Math.PI) * -h * 0.12
    dot(c, x, y, 2.6, 1 - k * 0.6, i === 0 ? LICHEN : undefined)
  }
}

const disclosure: Scene = (c, w, h, t) => {
  const rows = 9
  const r = memo('ds', () => rng(9))
  const lens = memo('dsl', () => Array.from({ length: rows }, () => 0.45 + r() * 0.45))
  const reveal = Math.floor(t / 2.2) % rows
  const scan = (t % 2.2) / 2.2
  for (let i = 0; i < rows; i++) {
    const y = h * 0.2 + i * h * 0.052
    const len = lens[i] * w * 0.7
    const on = i === reveal || i === (reveal + 4) % rows
    for (let x = 0; x < len; x += 7) {
      const a = on && x / len < ease(scan * 1.4) ? 1 : 0.22
      dot(c, w * 0.12 + x, y, 1.8, a, on && a === 1 ? LICHEN : undefined)
    }
  }
  label(c, '2 of 9 transfers shared', w * 0.12, h * 0.72, 11, `rgb(${PAPER})`)
  label(c, 'read-only proof', w * 0.12, h * 0.72 + 18, 10)
}

/* ─────────── Wallet screens (portrait) ─────────── */

const scrOverview: Scene = (c, w, h, t) => {
  label(c, 'shielded balance', 24, 64, 11)
  c.fillStyle = `rgb(${PAPER})`
  setFont(c, `400 30px ${TITLE}`)
  c.textAlign = 'left'
  c.fillText('4,210.00', 24, 100)
  label(c, 'USDC  ·  test money', 24, 120, 10)
  const pts = memo('ov', () => field(21, 140))
  for (const p of pts) {
    const tw = 0.3 + 0.5 * Math.abs(Math.sin(t * p.v + p.p))
    dot(c, 20 + p.x * (w - 40), h * 0.45 + p.y * h * 0.32, 1.3 + p.s * 0.8, tw * 0.8)
  }
  const n = 48219 + Math.floor(t * 1.7) % 40
  label(c, `hiding among ${n.toLocaleString('en-US')}`, 24, h * 0.86, 11, LICHEN)
}

const scrSend: Scene = (c, w, h, t) => {
  label(c, 'to  maya.sol', 24, 64, 11)
  c.fillStyle = `rgb(${PAPER})`
  setFont(c, `400 30px ${TITLE}`)
  c.textAlign = 'left'
  c.fillText('500 USDT', 24, 100)
  const k = (t % 4) / 4
  for (let i = 0; i < 5; i++) {
    const d = ease((k - i * 0.08) / 0.45)
    const x = 24 + i * ((w - 48) / 5) + 6
    const y = lerp(130, h * 0.62, d)
    c.globalAlpha = 0.25 + 0.75 * d
    c.fillStyle = i === 2 ? LICHEN : `rgb(${PAPER})`
    c.beginPath()
    c.roundRect(x, y, (w - 48) / 5 - 12, 26, 6)
    c.fill()
    c.globalAlpha = 1
  }
  label(c, '5 standard notes  ·  wait 2 to 6 h', 24, h * 0.76, 10)
  label(c, 'blend 7/10', 24, h * 0.86, 11, LICHEN)
}

const scrReceive: Scene = (c, w, h, t) => {
  const n = 13, s = Math.min(w - 60, h * 0.5) / n
  const ox = (w - n * s) / 2, oy = h * 0.16
  const r = memo('qr', () => { const g = rng(31); return Array.from({ length: n * n }, () => g()) })
  for (let i = 0; i < n * n; i++) {
    const x = i % n, y = Math.floor(i / n)
    const corner = (x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4)
    const on = corner || r[i] > 0.52
    const pulse = 0.55 + 0.45 * Math.sin(t * 2 - (x + y) * 0.35)
    if (on) dot(c, ox + x * s + s / 2, oy + y * s + s / 2, s * 0.36, corner ? 1 : pulse)
  }
  label(c, 'private address', 24, h * 0.8, 11)
  label(c, 'or share a payment link', 24, h * 0.8 + 18, 10, `rgb(${PAPER})`)
}

const scrActivity: Scene = (c, w, _h, t) => {
  const rows = [
    ['1,337 USDC', 'maya.sol', 9660],
    ['80 USDC', 'link paid', 0],
    ['500 USDT', 'pool b', 4320],
    ['42 USDC', 'rent split', 0],
  ] as const
  rows.forEach((row, i) => {
    const y = 66 + i * 62
    dot(c, 30, y - 4, 4, 1, row[2] ? LICHEN : `rgb(${PAPER})`)
    label(c, row[0], 46, y, 13, `rgb(${PAPER})`)
    label(c, row[1], 46, y + 17, 10)
    const left = row[2] ? Math.max(0, row[2] - Math.floor(t * 60)) : 0
    const txt = left ? `leaves in ${Math.floor(left / 3600)}h ${String(Math.floor((left % 3600) / 60)).padStart(2, '0')}m` : 'settled'
    label(c, txt, w - 24, y, 10, left ? LICHEN : FOG, TEXT, 'right')
    c.fillStyle = 'rgba(241,240,235,0.08)'
    c.fillRect(24, y + 30, w - 48, 1)
  })
}

const scrDisclosure: Scene = (c, w, h, t) => {
  // key made of dots
  const cx = w / 2, cy = h * 0.32
  for (let a = 0; a < TAU; a += TAU / 18) dot(c, cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 2.4, 0.9)
  for (let i = 0; i < 9; i++) dot(c, cx + 26 + i * 8, cy, 2.4, 0.9)
  dot(c, cx + 82, cy + 9, 2.4, 0.9)
  dot(c, cx + 66, cy + 9, 2.4, 0.9)
  ring(c, cx, cy, 10 + Math.sin(t * 2) * 2)
  ;['Q3 invoices  ·  3', 'payroll  ·  hidden', 'rent  ·  hidden'].forEach((s, i) => {
    const y = h * 0.58 + i * 30
    label(c, s, 24, y, 12, i === 0 ? LICHEN : FOG)
  })
}

const scrAutopilot: Scene = (c, w, h, t) => {
  const src = { x: w / 2, y: h * 0.18 }
  const dst = [w * 0.2, w * 0.5, w * 0.8].map((x, i) => ({ x, y: h * 0.62, n: [40, 90, 14][i] }))
  const pick = 1
  dst.forEach((d, i) => {
    c.strokeStyle = i === pick ? 'rgba(201,242,106,0.6)' : 'rgba(241,240,235,0.18)'
    c.setLineDash(i === pick ? [] : [2, 5])
    c.beginPath()
    c.moveTo(src.x, src.y)
    c.bezierCurveTo(src.x, src.y + 80, d.x, d.y - 80, d.x, d.y)
    c.stroke()
    c.setLineDash([])
    drawCluster(c, memo(`apc${i}`, () => cluster(40 + i, d.n)), d.x, d.y + 4, 16 + d.n * 0.12, t, 0.7, 1.2)
  })
  const k = (t % 3) / 3
  const e = ease(k)
  const p = { x: lerp(src.x, dst[pick].x, e), y: lerp(src.y, dst[pick].y, e) }
  dot(c, src.x, src.y, 5, 1)
  dot(c, p.x, p.y, 3, 1 - k * 0.3, LICHEN)
  label(c, 'routing to deepest pool', 24, h * 0.88, 10, `rgb(${PAPER})`)
}

/* ─────────── Steps (landscape) ─────────── */

const step = (n: number): Scene => (c, w, h, t) => {
  const cx = w / 2, cy = h / 2
  const k = (t % 4) / 4
  const crowd = memo(`st${n}`, () => field(70 + n, 120))
  for (const p of crowd) dot(c, p.x * w, p.y * h, 0.9 + p.s * 0.6, 0.12 + p.s * 0.12)
  switch (n) {
    case 1: {
      dot(c, cx, cy, 10, 1, LICHEN)
      for (let i = 0; i < 3; i++) ring(c, cx, cy, 14 + ((k + i / 3) % 1) * 60, 1 - ((k + i / 3) % 1), `rgb(${PAPER})`, 1)
      break
    }
    case 2: {
      const e = ease(k / 0.6)
      for (let i = 0; i < 5; i++) {
        const tx = cx + (i - 2) * 34
        dot(c, lerp(cx, tx, e), cy, lerp(14, 8, e), 1, i === 2 ? LICHEN : undefined)
      }
      break
    }
    case 3: {
      const xs = [w * 0.22, w * 0.5, w * 0.78]
      xs.forEach((x, i) => drawCluster(c, memo(`s3${i}`, () => cluster(80 + i, [24, 60, 10][i])), x, cy + 30, [22, 34, 14][i], t, 0.8, 1.5))
      const e = ease(k / 0.8)
      dot(c, lerp(cx, xs[1], e), lerp(cy - 70, cy + 24, e), 4, 1, LICHEN)
      break
    }
    case 4: {
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU - Math.PI / 2
        dot(c, cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, 2.4, 0.6)
      }
      const a = k * TAU - Math.PI / 2
      for (let r = 6; r < 54; r += 6) dot(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 1, LICHEN)
      label(c, '2 to 6 h', cx, cy + 90, 11, FOG, TEXT, 'center')
      break
    }
    case 5: {
      const x = lerp(w * 0.15, w * 0.85, ease(k))
      dot(c, x, cy, 9, 1)
      dot(c, x, cy - 20, 3.5, 1, LICHEN)
      label(c, 'fee', x, cy - 32, 10, LICHEN, TEXT, 'center')
      break
    }
    case 6: {
      drawCluster(c, memo('s6', () => cluster(96, 70)), w * 0.3, cy, 40, t, 0.8, 1.5)
      for (let i = 0; i < 5; i++) {
        const kk = (k + i * 0.12) % 1
        dot(c, lerp(w * 0.34, w * 0.78, kk), cy + Math.sin(kk * Math.PI) * -26, 3.4, 1 - kk * 0.4)
      }
      ring(c, w * 0.8, cy, 12, 1, `rgb(${PAPER})`, 1.2)
      break
    }
    default: {
      const pts = [[-30, 0], [-15, 15], [0, 30], [20, 10], [40, -10], [60, -30]]
      const e = ease(k / 0.7)
      pts.forEach(([x, y], i) => dot(c, cx - 15 + x, cy + y - 5, 5, i / pts.length < e ? 1 : 0.18, LICHEN))
      label(c, 'proof kept, nothing shared', cx, cy + 70, 11, FOG, TEXT, 'center')
    }
  }
}

/* ─────────── Large backdrops ─────────── */

const GLYPHS = '█▓▒░=+*#&@ac0123456789bdef'
const cipher: Scene = (c, w, h, t) => {
  const cell = 22
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell)
  const seeds = memo(`ci${cols}x${rows}`, () => { const r = rng(3); return Array.from({ length: cols * rows }, () => [r(), r()]) })
  setFont(c, `400 14px ${TITLE}`)
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const [a, b] = seeds[y * cols + x]
      // fade toward the left and the bottom so it melts into the ink
      const fx = x / cols, fy = y / rows
      const vis = ease((fx - 0.05) / 0.6) * ease((1 - fy) / 0.55)
      if (vis < 0.03) continue
      const tick = Math.floor(t * (0.6 + b * 2.4) + a * 50)
      const ch = GLYPHS[(tick * 7 + Math.floor(a * 97)) % GLYPHS.length]
      const glow = 0.25 + 0.75 * Math.pow(Math.abs(Math.sin(t * 0.4 + a * 9 + y * 0.15)), 6)
      c.globalAlpha = vis * glow * 0.85
      c.fillStyle = a > 0.985 ? LICHEN : `rgb(${PAPER})`
      c.fillText(ch, x * cell + cell / 2, y * cell + cell / 2)
    }
  }
  c.globalAlpha = 1
}

const crowd: Scene = (c, w, h, t) => {
  const pts = memo('crowd', () => field(8, 900))
  for (const p of pts) {
    const x = ((p.x + t * 0.006 * p.v) % 1) * w
    const y = p.y * h + Math.sin(t * 0.5 + p.p) * 6
    dot(c, x, y, 1 + p.s * 1.4, 0.15 + 0.45 * p.s)
  }
  // your note arrives, then becomes indistinguishable from the crowd
  const k = (t % 9) / 9
  const x = lerp(w * 0.12, w * 0.46, ease(k / 0.4))
  const y = lerp(h * 0.18, h * 0.38, ease(k / 0.4))
  const fade = k < 0.45 ? 1 : 1 - ease((k - 0.45) / 0.35)
  c.globalAlpha = 1
  dot(c, x, y, 2.6, 1, fade > 0.4 ? LICHEN : `rgb(${PAPER})`)
  ring(c, x, y, 9, fade)
  label(c, fade > 0.05 ? 'your transfer' : 'found: 0', x + 14, y + 4, 11, fade > 0.05 ? LICHEN : FOG)
}

const stack: Scene = (c, w, h, t) => {
  const n = 6
  for (let i = 0; i < n; i++) {
    const k = (t * 0.18 + i / n) % 1
    const y = lerp(h * 1.05, h * 0.05, k)
    const x = w * 0.62 - (y - h / 2) * 0.35
    const a = Math.sin(k * Math.PI)
    c.save()
    c.translate(x, y)
    c.transform(1, -0.32, 0.7, 0.55, 0, 0)
    c.globalAlpha = a * 0.9
    c.fillStyle = '#1c1e1b'
    c.strokeStyle = `rgba(${PAPER},0.55)`
    c.lineWidth = 1.2
    c.beginPath()
    c.roundRect(-55, -55, 110, 110, 18)
    c.fill()
    c.stroke()
    // the mark on each tile
    const g = [[-22, -22], [0, -22], [22, -22], [-22, 0], [22, 0], [-22, 22], [0, 22], [22, 22]]
    g.forEach(([gx, gy]) => dot(c, gx, gy, 6, a * 0.9))
    ring(c, 0, 0, 5.5, a, LICHEN, 2.4)
    c.restore()
  }
}

export const SCENES: Record<string, Scene> = {
  autopilot,
  send: sendScore,
  links,
  disclosure,
  'scr-overview': scrOverview,
  'scr-send': scrSend,
  'scr-receive': scrReceive,
  'scr-activity': scrActivity,
  'scr-disclosure': scrDisclosure,
  'scr-autopilot': scrAutopilot,
  'step-1': step(1),
  'step-2': step(2),
  'step-3': step(3),
  'step-4': step(4),
  'step-5': step(5),
  'step-6': step(6),
  'step-7': step(7),
  cipher,
  crowd,
  stack,
}
