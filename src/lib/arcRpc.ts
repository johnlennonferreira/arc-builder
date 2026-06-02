/**
 * Shared helpers for server-side API routes.
 * Each route creates its own client instance (correct for server-side),
 * but all share the same chain config and contract addresses.
 */
import { createPublicClient, http } from 'viem'
import { arcTestnet, ARC_RPC_URL } from '@/lib/arc'

export { arcTestnet, ARC_RPC_URL }

// Contract addresses
export const IDENTITY_REGISTRY   = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
export const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`
export const VALIDATION_REGISTRY = '0x8004Cb1BF31DAf7788923b405b754f57acEB4272' as `0x${string}`
export const AGENTIC_COMMERCE    = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`
export const USDC                = '0x3600000000000000000000000000000000000000' as `0x${string}`

/** Create a new public client for use inside a single API route handler. */
export function makeRpcClient() {
  return createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) })
}
