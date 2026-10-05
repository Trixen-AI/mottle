import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider, useWalletInfo } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana/react'
import type { Transaction } from '@solana/web3.js'
import { appKit } from './appkit'
import { IS_CONFIGURED, type Cluster } from './config'
import { WalletContext, type WalletContextValue } from './walletContext'

const notConnected = () => Promise.reject(new Error('Connect a wallet first'))

// Real wallet through Reown AppKit
function AppKitWalletProvider({ children }: { children: ReactNode }) {
  const { open } = useAppKit()
  const account = useAppKitAccount({ namespace: 'solana' })
  const { walletProvider } = useAppKitProvider<Provider>('solana')
  const { walletInfo } = useWalletInfo()

  // The dashboard runs on Mainnet only
  const cluster: Cluster = 'mainnet'
  const address = account.isConnected && account.address ? account.address : null

  const signAndSend = useCallback(
    async (tx: Transaction) => {
      if (!walletProvider || !address) return notConnected()
      return walletProvider.signAndSendTransaction(tx)
    },
    [walletProvider, address],
  )
  const signMessage = useCallback(
    async (bytes: Uint8Array) => {
      if (!walletProvider || !address) return notConnected()
      return walletProvider.signMessage(bytes)
    },
    [walletProvider, address],
  )

  const value = useMemo<WalletContextValue>(
    () => ({
      state: { address, isConnected: !!address, cluster, walletName: walletInfo?.name ?? null, walletIcon: walletInfo?.icon ?? null },
      actions: {
        connect: () => void open({ view: 'Connect', namespace: 'solana' }),
        disconnect: async () => {
          await appKit?.disconnect('solana')
        },
        signAndSend,
        signMessage,
      },
      meta: { configured: true, setupRequested: false, dismissSetup: () => {} },
    }),
    [address, cluster, walletInfo?.name, walletInfo?.icon, open, signAndSend, signMessage],
  )
  return <WalletContext value={value}>{children}</WalletContext>
}

// No Reown project id yet: read-only tools still work, connecting explains the missing setup
function ReadOnlyWalletProvider({ children }: { children: ReactNode }) {
  const cluster: Cluster = 'mainnet'
  const [setupRequested, setSetupRequested] = useState(false)
  const value = useMemo<WalletContextValue>(
    () => ({
      state: { address: null, isConnected: false, cluster, walletName: null, walletIcon: null },
      actions: {
        connect: () => setSetupRequested(true),
        disconnect: async () => {},
        signAndSend: notConnected,
        signMessage: notConnected,
      },
      meta: { configured: false, setupRequested, dismissSetup: () => setSetupRequested(false) },
    }),
    [cluster, setupRequested],
  )
  return <WalletContext value={value}>{children}</WalletContext>
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return IS_CONFIGURED ? <AppKitWalletProvider>{children}</AppKitWalletProvider> : <ReadOnlyWalletProvider>{children}</ReadOnlyWalletProvider>
}
