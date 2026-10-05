# Mottle

Landing page for Mottle, a privacy layer for Solana stablecoin payments (demo only, test balances).
Vite + React 19 + TypeScript, React Router. Website: Three.js (globe), GSAP + Draggable, react-slick.
Dashboard (`/app`): Reown AppKit (Solana adapter), @solana/web3.js + spl-token, TanStack Query.

```
cp .env.example .env   # then set VITE_REOWN_PROJECT_ID (free at dashboard.reown.com)
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
```

## Dashboard

| Route | What it does |
|---|---|
| `/app` | Balances (SOL, USDC, USDT), blend score, recent activity, open payment links |
| `/app/send` | Real transfer with a privacy check against your history, then a two-step public-send confirmation |
| `/app/receive` | Address QR and Solana Pay payment links with a reference key; marks itself paid when the payment lands |
| `/app/activity` | Parsed on-chain history with filters, paging and CSV export |
| `/app/disclosure` | Pick transactions, sign a report with the wallet, download it; verify any report (signature + chain) |
| `/app/exposure` | Linkability analysis of the connected wallet or any address (read-only) |
| `/pay?...` | Public pay page for a payment link: connect any Solana wallet, or scan the Solana Pay QR |

RPC: with a project ID the dashboard uses Reown RPC. Optional overrides: `VITE_SOLANA_RPC_MAINNET`, `VITE_SOLANA_RPC_DEVNET`.
Without either, mainnet falls back to PublicNode (the official endpoint blocks browsers) and devnet to the public devnet RPC.

Not built: shielded pools, private balances and pool routing. Every send in the dashboard is a normal public Solana transfer, and the UI says so.

Hosting: SPA routes need a rewrite to `index.html` (`vercel.json` is included).

## Where things live

- `src/data/site.ts`: every line of copy, nav, footer links, social placeholders
- `src/styles/tokens.css`: palette (ink, paper, fog, line, lichen) and fonts (Tektur, Lexend)
- `src/lib/dotArt.ts`: the canvas scenes behind all card, screen and step artwork
- `src/components/sections/`: one component per page section
- `scripts/build-logo.mjs`: regenerates the logo paths, `public/brand/*` and `public/favicon.svg`

## To fill in

- Socials: X only (`https://x.com/Mottle_xyz`), in `SOCIALS` in `src/data/site.ts`.
- Footer, nav and legal links are in-page anchors until the real pages exist.
- Third-party logos are official files, listed with their sources in `src/assets/logos/SOURCES.md`.
