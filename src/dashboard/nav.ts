// Dashboard sections, in the order the concept numbers them
export const DASH_NAV = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/send', label: 'Send' },
  { to: '/app/receive', label: 'Receive' },
  { to: '/app/activity', label: 'Activity' },
  { to: '/app/disclosure', label: 'Disclosure' },
  { to: '/app/exposure', label: 'Exposure' },
] as const
