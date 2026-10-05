// Networks and assets the dashboard works with.

export type Cluster = 'mainnet' | 'devnet'

export const PROJECT_ID = (import.meta.env.VITE_REOWN_PROJECT_ID ?? '').trim()
export const IS_CONFIGURED = PROJECT_ID.length > 0

// CAIP-2 chain ids AppKit uses for Solana
export const CAIP: Record<Cluster, string> = {
  mainnet: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  devnet: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
}

// api.mainnet-beta.solana.com answers browser requests with 403, so the keyless mainnet fallback is PublicNode.
const PUBLIC_RPC: Record<Cluster, string> = {
  mainnet: 'https://solana-rpc.publicnode.com',
  devnet: 'https://api.devnet.solana.com',
}

// RPC order: explicit override, then Reown's RPC (needs the project id), then the public cluster endpoint.
export function rpcUrl(cluster: Cluster) {
  const override = cluster === 'mainnet' ? import.meta.env.VITE_SOLANA_RPC_MAINNET : import.meta.env.VITE_SOLANA_RPC_DEVNET
  if (override?.trim()) return override.trim()
  if (IS_CONFIGURED) return `https://rpc.walletconnect.org/v1/?chainId=${CAIP[cluster]}&projectId=${PROJECT_ID}`
  return PUBLIC_RPC[cluster]
}

export type Token = {
  symbol: 'SOL' | 'USDC' | 'USDT'
  name: string
  decimals: number
  mint: string | null // null = native SOL
  stable: boolean
}

export const SOL: Token = { symbol: 'SOL', name: 'Solana', decimals: 9, mint: null, stable: false }

export const TOKENS: Record<Cluster, Token[]> = {
  mainnet: [
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', stable: true },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', stable: true },
    SOL,
  ],
  // Circle's devnet USDC (faucet.circle.com). There is no official devnet USDT.
  devnet: [{ symbol: 'USDC', name: 'USD Coin (devnet)', decimals: 6, mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', stable: true }, SOL],
}

export function tokenBySymbol(cluster: Cluster, symbol: string) {
  return TOKENS[cluster].find((t) => t.symbol === symbol)
}

export function tokenByMint(cluster: Cluster, mint: string) {
  return TOKENS[cluster].find((t) => t.mint === mint)
}

export const CLUSTER_LABEL: Record<Cluster, string> = { mainnet: 'Mainnet', devnet: 'Devnet' }

export function explorerTx(cluster: Cluster, signature: string) {
  return `https://solscan.io/tx/${signature}${cluster === 'devnet' ? '?cluster=devnet' : ''}`
}

export function explorerAccount(cluster: Cluster, address: string) {
  return `https://solscan.io/account/${address}${cluster === 'devnet' ? '?cluster=devnet' : ''}`
}

// Amounts that many people send: a transfer of one of these sizes is harder to single out.
export const STANDARD_SIZES = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000]
