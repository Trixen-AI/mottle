// Mottle's own line icons. Stroke 1.5 on a 24 grid, round caps, with a "dot" accent
// where it helps (the dot is the house motif).
import type { SVGProps } from 'react'
import { base } from './iconBase'

type P = SVGProps<SVGSVGElement>

export const ArrowUpRight = (p: P) => (
  <svg {...base({ viewBox: '0 0 20 20', ...p })}><path d="M5 15L15 5M7 5h8v8" /></svg>
)

export const Chevron = ({ dir, ...p }: P & { dir: 'left' | 'right' }) => (
  <svg {...base(p)}><path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} /></svg>
)

// Thin arrow that draws across the button on hover
export const Trail = (p: P) => (
  <svg viewBox="0 0 93 10" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden {...p}>
    <path d="M0 5h91M86 1l5 4-5 4" />
  </svg>
)

// Hero badge: "demo / test money" stamp built from the dot motif
export const DemoBadge = (p: P) => (
  <svg viewBox="0 0 54 56" fill="currentColor" aria-hidden {...p}>
    <text x="27" y="7" textAnchor="middle" fontSize="6.4" letterSpacing="1.4" fontFamily="Lexend, sans-serif">DEMO</text>
    {Array.from({ length: 20 }, (_, i) => (
      <circle key={i} cx={9 + (i % 5) * 9} cy={16 + Math.floor(i / 5) * 8} r={i === 12 ? 0 : 2.6} opacity={0.35 + ((i * 7) % 5) * 0.15} />
    ))}
    <circle cx="27" cy="32" r="2.6" fill="none" stroke="var(--lichen)" strokeWidth="1.6" />
    <text x="27" y="55" textAnchor="middle" fontSize="6.4" letterSpacing="1.4" fontFamily="Lexend, sans-serif">TEST $</text>
  </svg>
)
