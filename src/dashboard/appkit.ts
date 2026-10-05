import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solana } from '@reown/appkit/networks'
import { IS_CONFIGURED, PROJECT_ID } from './config'

// Created once per page load. Without a project id there is no modal; the UI shows a setup notice instead.
export const appKit = IS_CONFIGURED
  ? createAppKit({
      adapters: [new SolanaAdapter()],
      // Mainnet only
      networks: [solana],
      defaultNetwork: solana,
      projectId: PROJECT_ID,
      metadata: {
        name: 'Mottle',
        description: 'Private stablecoin payments on Solana',
        url: window.location.origin,
        icons: [`${window.location.origin}/brand/logo-500.png`],
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#c9f26a',
        '--w3m-color-mix': '#0a0b0a',
        '--w3m-color-mix-strength': 30,
        '--w3m-font-family': 'Lexend, system-ui, sans-serif',
        '--w3m-border-radius-master': '2px',
        '--w3m-z-index': 3000,
      },
      features: { analytics: false },
    })
  : null
