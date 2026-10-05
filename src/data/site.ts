// All visible copy for the Mottle site lives here.
// House rule: no em dashes in any string.

export const BRAND = {
  name: 'Mottle',
  domain: 'mottleprotocol.xyz',
  securityEmail: 'security@mottleprotocol.xyz',
  // The dashboard (React Router route)
  appUrl: '/app',
  tagline: 'Private payments on Solana',
} as const

export type NavItem = { label: string; href: string; glyph: GlyphName; mega?: boolean }
export type GlyphName = 'home' | 'shield' | 'wallet' | 'route' | 'code' | 'launch'

export const NAV: NavItem[] = [
  { label: 'Home', href: '#top', glyph: 'home' },
  { label: 'Privacy', href: '#privacy', glyph: 'shield' },
  { label: 'Wallet', href: '#wallet', glyph: 'wallet', mega: true },
  { label: 'Autopilot', href: '#tools', glyph: 'route' },
  { label: 'Developers', href: '#build', glyph: 'code' },
  { label: 'Launch App', href: BRAND.appUrl, glyph: 'launch' },
]

export const MEGA = [
  { label: 'Send', art: 'send', href: '#wallet' },
  { label: 'Receive', art: 'receive', href: '#wallet' },
  { label: 'Disclosure', art: 'disclosure', href: '#wallet' },
] as const

export const HERO = {
  title: ['Pay anyone.', 'Leave no line', 'back to you.'],
  rotating: [
    'Hiding among 48,219 notes',
    'USDC, privately',
    'USDT, privately',
    'Fees paid by a relayer',
    'Private by default',
  ],
  cta: 'Create wallet',
}

// Logos are only of networks and assets Mottle works with (see footer disclaimer).
export const MARQUEE = ['solana', 'usdc', 'usdt', 'tor'] as const

export const INTRO = {
  kicker: 'The privacy layer for Solana',
  title: 'Thin layer. Strong shield.',
  body:
    'Mottle sits between your wallet and the chain. Send 1,337 USDC and it leaves as five standard notes, after a random delay of two to six hours, with the network fee paid by a relayer. Anyone watching sees ordinary pool traffic. Nothing on-chain points back to you.',
  observer: {
    rows: [
      { k: 'sender', v: '&94b9&a+' },
      { k: 'recipient', v: 'ee▓12c=█' },
      { k: 'amount', v: '@@a6=5' },
    ],
    links: '0 found',
    youSend: '1,337 USDC → maya.sol',
    chainSees: '█=▓c#dd+b 3c▓0▒=*74',
  },
}

export type ToolArt = 'autopilot' | 'send' | 'links' | 'disclosure'
export const TOOLS = {
  title: 'Built into every send',
  note: 'Four tools share one job: keep you blended in, so privacy is the default rather than a setting you have to remember.',
  cards: [
    { label: 'Privacy Autopilot', tag: 'Runs on every transfer', art: 'autopilot' },
    { label: 'Private Send', tag: 'Score before you sign', art: 'send' },
    { label: 'Payment Links', tag: 'For people without a wallet', art: 'links' },
    { label: 'Selective Disclosure', tag: 'Reports and proofs', art: 'disclosure' },
  ] as { label: string; tag: string; art: ToolArt }[],
}

export type AnswerIcon = 'person' | 'coins' | 'globe' | 'clock' | 'wallet' | 'warning'
export type AnswerState = 'hidden' | 'blended' | 'visible'
export const ANSWERS = {
  title: 'Strong privacy. Not magic.',
  body:
    'What Mottle hides, what it blends into the crowd, and what stays in plain view. Better you know the limits before you send.',
  items: [
    { icon: 'person', title: 'Who you pay', text: 'The recipient is never linked to your address on-chain.', state: 'hidden' },
    { icon: 'coins', title: 'How much', text: 'Amounts split into standard note sizes that match everyone else in the pool.', state: 'blended' },
    { icon: 'globe', title: 'Your IP address', text: 'Requests go through a no-log proxy. Tor is one switch away.', state: 'hidden' },
    { icon: 'clock', title: 'When you sent', text: 'A random wait of two to six hours sits between deposit and payout.', state: 'blended' },
    { icon: 'wallet', title: 'Public deposits', text: 'Topping up from a public wallet is visible, already split into standard amounts.', state: 'visible' },
    { icon: 'warning', title: 'Sends outside Mottle', text: 'Paying a regular address shows recipient and amount. Mottle warns you and asks twice.', state: 'visible' },
  ] as { icon: AnswerIcon; title: string; text: string; state: AnswerState }[],
}

export type ScreenArt = 'overview' | 'send' | 'receive' | 'activity' | 'disclosure' | 'autopilot'
export const SCREENS = {
  title: 'The wallet',
  items: [
    { no: '01', name: 'Overview', art: 'overview', text: 'Shielded balance, public balance and the size of the crowd you are hiding in, on one screen.' },
    { no: '02', name: 'Send', art: 'send', text: 'Choose who and how much. Mottle scores how well the transfer will blend before you sign it.' },
    { no: '03', name: 'Receive', art: 'receive', text: 'Share a private address or a payment link. Anyone can pay you, with or without a wallet.' },
    { no: '04', name: 'Activity', art: 'activity', text: 'Each transfer with its notes, delay and relayer. A history only you can read.' },
    { no: '05', name: 'Disclosure', art: 'disclosure', text: 'Give an accountant or auditor a report or a proof covering only the transfers you pick.' },
    { no: '06', name: 'Autopilot', art: 'autopilot', text: 'Sends each transfer to the pool where it blends best and picks when it leaves.' },
  ] as { no: string; name: string; art: ScreenArt; text: string }[],
}

export type FeedIcon = 'send' | 'link' | 'route' | 'warning' | 'proof' | 'receive'
export const ACTIVITY = {
  title: 'Privacy that holds up without thinking about it',
  body:
    'Autopilot picks the pool, the note sizes and the timing for every transfer. The feed on the right comes from the demo wallet: test money, delays sped up, nothing real moving.',
  items: [
    { icon: 'send', text: '1,337 USDC to maya.sol left as 5 standard notes after a 3h 12m wait. A relayer covered the fee.', who: 'Private send', meta: 'Simulated · blend 7/10' },
    { icon: 'link', text: 'A payment link was paid by card from someone with no wallet. 80 USDC arrived in your shielded balance.', who: 'Payment link', meta: 'Simulated · 1 note' },
    { icon: 'route', text: '500 USDT went to the pool with the most USDT traffic, where your notes sit among the most deposits.', who: 'Autopilot routing', meta: 'Simulated · blend 7/10' },
    { icon: 'warning', text: 'You tried to pay a regular address. Recipient and amount would be public, so Mottle asked twice. You cancelled.', who: 'Safety check', meta: 'Simulated · nothing sent' },
    { icon: 'proof', text: 'A proof of three invoices went to your accountant. The rest of your history stayed private.', who: 'Selective disclosure', meta: 'Simulated · read-only proof' },
    { icon: 'receive', text: 'Two payments reached your private address. The observer view found 0 links back to you.', who: 'Private receive', meta: 'Simulated · 2 notes' },
  ] as { icon: FeedIcon; text: string; who: string; meta: string }[],
}

export const STEPS = {
  title: 'Inside a transfer',
  body: 'Seven things happen between pressing send and your recipient getting paid. You do the first one.',
  items: [
    'You press send from your shielded balance',
    'The amount splits into standard note sizes',
    'Autopilot picks the pool where you blend best',
    'A random wait of two to six hours begins',
    'A relayer pays the network fee for you',
    'Your recipient is paid out of the pool',
    'You keep a proof, shared only if you choose',
  ],
}

export const FOOTER = {
  build: { title: 'Build on Mottle', link: 'Read the SDK docs' },
  cols: [
    { title: 'Product', links: [{ label: 'Private Send', href: '/app/send' }, { label: 'Payment Links', href: '/app/receive' }, { label: 'Autopilot' }] },
    { title: 'Developers', links: [{ label: 'Documentation' }, { label: 'SDK', beta: true }, { label: 'GitHub' }] },
    { title: 'Resources', links: [{ label: 'How it works' }, { label: 'Security' }, { label: 'Bug bounty' }] },
    { title: 'Company', links: [{ label: 'About' }, { label: 'Careers' }, { label: 'Contact' }] },
  ] as { title: string; links: { label: string; beta?: boolean; href?: string }[] }[],
  signup: {
    title: 'Be first in the dark.',
    note: 'We let people in a few at a time and write once, when your spot is ready.',
    placeholder: 'you@example.com',
    button: 'Join the list',
    done: 'You are on the list. One email, when your spot opens.',
  },
  legal: ['Terms', 'Privacy', 'Compliance', 'Sanctions screening', 'Cookies'],
}

export const SOCIALS = [{ key: 'x', label: 'Mottle on X', href: 'https://x.com/Mottle_xyz' }] as const
