/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID?: string
  readonly VITE_SOLANA_RPC_MAINNET?: string
  readonly VITE_SOLANA_RPC_DEVNET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
