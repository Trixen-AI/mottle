// Icon sets keyed by name, used by data-driven lists.
import type { SVGProps } from 'react'
import { base } from './iconBase'

type P = SVGProps<SVGSVGElement>

export const GLYPHS = {
  home: (p: P) => (
    <svg {...base(p)}><path d="M4 11l8-6 8 6v8H4z" /><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" /></svg>
  ),
  shield: (p: P) => (
    <svg {...base(p)}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><circle cx="12" cy="11.5" r="1.6" fill="currentColor" stroke="none" /></svg>
  ),
  wallet: (p: P) => (
    <svg {...base(p)}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M16 12.5h2" /><path d="M6 6l9-3 1 3" /></svg>
  ),
  route: (p: P) => (
    <svg {...base(p)}><circle cx="5" cy="18" r="2" /><circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" /><path d="M7 17c6-1 3-9 10-10" strokeDasharray="2 3" /></svg>
  ),
  code: (p: P) => (
    <svg {...base(p)}><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>
  ),
  launch: (p: P) => (
    <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M10 14l5-5M11 9h4v4" /></svg>
  ),
}

export const ANSWER_ICONS = {
  person: (p: P) => (
    <svg {...base({ viewBox: '0 0 72 72', strokeWidth: 2.4, ...p })}>
      <circle cx="36" cy="26" r="9" /><path d="M20 54c2-9 8-14 16-14s14 5 16 14" />
      <path d="M12 12l48 48" strokeDasharray="3 5" />
    </svg>
  ),
  coins: (p: P) => (
    <svg {...base({ viewBox: '0 0 72 72', strokeWidth: 2.4, ...p })}>
      {[14, 26, 38, 50].map((y) => <rect key={y} x="18" y={y} width="36" height="8" rx="4" />)}
      <circle cx="58" cy="54" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  globe: (p: P) => (
    <svg {...base({ viewBox: '0 0 72 72', strokeWidth: 2.4, ...p })}>
      <circle cx="36" cy="36" r="20" /><path d="M16 36h40M36 16c-8 10-8 30 0 40M36 16c8 10 8 30 0 40" />
      <path d="M50 50l10 10" />
    </svg>
  ),
  clock: (p: P) => (
    <svg {...base({ viewBox: '0 0 72 72', strokeWidth: 2.4, ...p })}>
      <circle cx="36" cy="38" r="20" strokeDasharray="4 4" /><path d="M36 26v12l8 6" /><path d="M30 12h12" />
    </svg>
  ),
  wallet: (p: P) => (
    <svg {...base({ viewBox: '0 0 72 72', strokeWidth: 2.4, ...p })}>
      <rect x="12" y="22" width="44" height="30" rx="6" /><circle cx="46" cy="37" r="3" fill="currentColor" stroke="none" />
      <path d="M58 30l6-4M58 44l6 4M58 37h7" />
    </svg>
  ),
  warning: (p: P) => (
    <svg {...base({ viewBox: '0 0 72 72', strokeWidth: 2.4, ...p })}>
      <path d="M36 14l24 42H12z" /><path d="M36 30v12" /><circle cx="36" cy="48" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  ),
}

export const FEED_ICONS = {
  send: (p: P) => (
    <svg {...base({ viewBox: '0 0 60 60', strokeWidth: 2, ...p })}>
      <circle cx="14" cy="30" r="5" fill="currentColor" stroke="none" />
      {[30, 38, 46].map((x) => <circle key={x} cx={x} cy="30" r="3" />)}
      <path d="M50 22l6 8-6 8" />
    </svg>
  ),
  link: (p: P) => (
    <svg {...base({ viewBox: '0 0 60 60', strokeWidth: 2, ...p })}>
      <path d="M26 34l8-8" /><path d="M22 28l-5 5a7 7 0 0010 10l5-5" /><path d="M38 32l5-5a7 7 0 00-10-10l-5 5" />
    </svg>
  ),
  route: (p: P) => (
    <svg {...base({ viewBox: '0 0 60 60', strokeWidth: 2, ...p })}>
      <circle cx="30" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M30 16c0 12-16 12-16 26M30 16c0 12 16 12 16 26M30 16v26" strokeDasharray="3 4" />
      <circle cx="46" cy="46" r="5" />
    </svg>
  ),
  warning: (p: P) => (
    <svg {...base({ viewBox: '0 0 60 60', strokeWidth: 2, ...p })}>
      <path d="M30 10l20 36H10z" /><path d="M30 24v10" /><circle cx="30" cy="40" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  proof: (p: P) => (
    <svg {...base({ viewBox: '0 0 60 60', strokeWidth: 2, ...p })}>
      <rect x="14" y="8" width="32" height="44" rx="4" /><path d="M21 20h18M21 28h12" /><path d="M22 40l5 5 10-10" />
    </svg>
  ),
  receive: (p: P) => (
    <svg {...base({ viewBox: '0 0 60 60', strokeWidth: 2, ...p })}>
      {[16, 24, 32].map((x) => <circle key={x} cx={x} cy="30" r="3" />)}
      <circle cx="46" cy="30" r="6" fill="currentColor" stroke="none" />
      <path d="M36 22l-6 8 6 8" />
    </svg>
  ),
}

