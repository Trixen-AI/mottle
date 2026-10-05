// Load order matters: Buffer polyfill, then AppKit (which pulls in Solana code).
import './polyfills'
import './appkit'
import '@/styles/dashboard.css'
import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WalletProvider } from './wallet'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: true } },
      }),
  )
  return (
    <QueryClientProvider client={client}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  )
}
