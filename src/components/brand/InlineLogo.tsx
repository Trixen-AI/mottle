// Official third-party logos, inlined byte-for-byte from src/assets/logos (sources in SOURCES.md).
// Only the XML prologue / DOCTYPE wrapper is dropped so the markup can live inside HTML.
import solana from '@/assets/logos/solana.svg?raw'
import usdc from '@/assets/logos/usdc.svg?raw'
import usdt from '@/assets/logos/usdt.svg?raw'
import tor from '@/assets/logos/tor.svg?raw'
import x from '@/assets/logos/x.svg?raw'

const RAW = { solana, usdc, usdt, tor, x }
export type BrandKey = keyof typeof RAW

const NAMES: Record<BrandKey, string> = {
  solana: 'Solana',
  usdc: 'USDC',
  usdt: 'Tether USDT',
  tor: 'Tor',
  x: 'X',
}

const strip = (s: string) =>
  s
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .trim()

const CLEAN = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k, strip(v)])) as Record<BrandKey, string>

export function InlineLogo({ brand, decorative = false }: { brand: BrandKey; decorative?: boolean }) {
  return (
    <span
      className="inline-logo"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : NAMES[brand]}
      aria-hidden={decorative || undefined}
      dangerouslySetInnerHTML={{ __html: CLEAN[brand] }}
    />
  )
}
