// @solana/web3.js and spl-token expect Node's Buffer (and sometimes `global`) in the browser.
// This module must be imported before anything that pulls in Solana code.
import { Buffer } from 'buffer'

const g = globalThis as typeof globalThis & { Buffer?: typeof Buffer; global?: typeof globalThis }
if (!g.Buffer) g.Buffer = Buffer
if (!g.global) g.global = globalThis
