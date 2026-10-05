export const shortAddress = (a: string, n = 4) => (a.length > n * 2 + 1 ? `${a.slice(0, n)}…${a.slice(-n)}` : a)

const nf = new Map<number, Intl.NumberFormat>()
export function formatAmount(value: number, max = 6) {
  let f = nf.get(max)
  if (!f) {
    f = new Intl.NumberFormat('en-US', { maximumFractionDigits: max })
    nf.set(max, f)
  }
  return f.format(value)
}

export const formatUsd = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
export function timeAgo(unixSeconds: number | null) {
  if (!unixSeconds) return 'pending'
  const diff = unixSeconds - Date.now() / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return rtf.format(Math.round(diff), 'second')
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDate = (unixSeconds: number | null) =>
  unixSeconds ? new Date(unixSeconds * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'pending'
