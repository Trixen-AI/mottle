// Builds the share image (1200x630), apple-touch-icon (180x180) and PWA icons from the logo source.
// Text is outlined with opentype.js so the images render the same without web fonts.
// Run: node scripts/build-social.mjs   (after scripts/build-logo.mjs)
import fs from 'node:fs'
import path from 'node:path'
import opentype from 'opentype.js'
import { Resvg } from '@resvg/resvg-js'

const root = path.resolve(import.meta.dirname, '..')
const INK = '#0a0b0a'
const PAPER = '#f1f0eb'
const FOG = '#8a8b84'
const LICHEN = '#c9f26a'

const loadFont = (file) => {
  const buf = fs.readFileSync(path.join(root, 'node_modules', file))
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}
const title = loadFont('@fontsource/tektur/files/tektur-latin-400-normal.woff')
const text = loadFont('@fontsource/lexend/files/lexend-latin-300-normal.woff')

// logo geometry comes from the generated module (single source of truth)
const src = fs.readFileSync(path.join(root, 'src/components/brand/logoPaths.ts'), 'utf8')
const pick = (name) => src.match(new RegExp(`export const ${name}[^=]*= (.+)`))[1].trim()
const WORD_D = JSON.parse(pick('WORD_D').replace(/^'|'$/g, '"'))
const WORD_TRANSFORM = JSON.parse(pick('WORD_TRANSFORM').replace(/^'|'$/g, '"'))
const DOTS = JSON.parse(pick('MARK_DOTS'))
const RING = JSON.parse(pick('MARK_RING'))

const mark = (dot, ring) =>
  DOTS.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dot}"/>`).join('') +
  `<circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.r}" fill="none" stroke="${ring}" stroke-width="${RING.w}"/>`

// Glyph-by-glyph layout (like build-logo.mjs). font.getPath() on whole strings emitted NaN
// coordinates for some runs, which made the renderer stop drawing mid-word.
// Path data is written by hand: opentype.js 2.x toPathData() expects an options object and its
// optimiser produced NaN for some glyphs.
const n = (v) => (Math.round(v * 100) / 100).toString()
const toD = (cmds) =>
  cmds
    .map((c) =>
      c.type === 'M' || c.type === 'L'
        ? `${c.type}${n(c.x)} ${n(c.y)}`
        : c.type === 'Q'
          ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
          : c.type === 'C'
            ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
            : 'Z',
    )
    .join('')

const outline = (font, str, x, y, size, fill) => {
  let cursor = x
  const parts = []
  for (const ch of str) {
    const glyph = font.charToGlyph(ch)
    parts.push(toD(glyph.getPath(cursor, y, size).commands))
    cursor += (glyph.advanceWidth / font.unitsPerEm) * size
  }
  const d = parts.join(' ')
  if (d.includes('NaN')) throw new Error(`Bad outline for "${str}"`)
  return `<path d="${d}" fill="${fill}"/>`
}

function render(svg, file, width) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()
  fs.writeFileSync(path.join(root, 'public', file), png)
}

/* ─────────── Share image ─────────── */
// a dappled field of identical dots on the right, one lichen ring among them
let field = ''
let seed = 11
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
for (let gx = 0; gx < 14; gx++)
  for (let gy = 0; gy < 11; gy++) {
    const x = 690 + gx * 38 + (gy % 2) * 19
    const y = 60 + gy * 52
    if (x > 1180) continue
    const fade = Math.min(1, (x - 690) / 260)
    const o = (0.12 + rand() * 0.5) * fade
    if (gx === 7 && gy === 5) field += `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${LICHEN}" stroke-width="3"/>`
    else field += `<circle cx="${x}" cy="${y}" r="${4 + rand() * 4}" fill="${PAPER}" opacity="${o.toFixed(2)}"/>`
  }

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${INK}"/>
${field}
<g transform="translate(80 78) scale(1.5)">${mark(PAPER, LICHEN)}<path transform="${WORD_TRANSFORM}" d="${WORD_D}" fill="${PAPER}"/></g>
${outline(title, 'PAY ANYONE.', 80, 300, 76, PAPER)}
${outline(title, 'LEAVE NO LINE', 80, 384, 76, PAPER)}
${outline(title, 'BACK TO YOU.', 80, 468, 76, PAPER)}
${outline(text, 'Private stablecoin payments on Solana', 82, 540, 28, FOG)}
${outline(text, 'mottleprotocol.xyz', 82, 582, 24, LICHEN)}
</svg>`
render(og, 'og-image.png', 1200)

/* ─────────── App icons: the mark on an ink tile ─────────── */
const icon = (size, pad) => {
  const inner = size - pad * 2
  const s = inner / 40
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${INK}"/><g transform="translate(${pad} ${pad}) scale(${s})">${mark(PAPER, LICHEN)}</g></svg>`
}
render(icon(180, 30), 'apple-touch-icon.png', 180)
render(icon(192, 32), 'icon-192.png', 192)
render(icon(512, 86), 'icon-512.png', 512)
console.log('social assets built')
