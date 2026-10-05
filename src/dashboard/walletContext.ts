import { createContext, use } from 'react'
import type { Transaction } from '@solana/web3.js'
import type { Cluster } from './config'

// One interface for every page: what the wallet is (state), what it can do (actions), and context (meta).
export type WalletContextValue = {
  state: { address: string | null; isConnected: boolean; cluster: Cluster; walletName: string | null; walletIcon: string | null }
  actions: {
    connect: () => void
    disconnect: () => Promise<void>
    signAndSend: (tx: Transaction) => Promise<string>
    signMessage: (bytes: Uint8Array) => Promise<Uint8Array>
  }
  meta: { configured: boolean; setupRequested: boolean; dismissSetup: () => void }
}

export const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet() {
  const ctx = use(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside a WalletProvider')
  return ctx
}
