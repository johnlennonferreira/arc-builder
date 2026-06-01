import { createPublicClient, http, type Chain } from 'viem'

export const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.arc.io'] },
    public: { http: ['https://rpc-testnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
}

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc-testnet.arc.io'),
})

export const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
export const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`
export const AGENTIC_COMMERCE = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`

const IDENTITY_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export interface Agent {
  id: string
  owner: string
  metadataURI: string
  blockNumber: string
  reputationScore: number
}

export async function fetchAgents(
  page = 0,
  pageSize = 20
): Promise<{ agents: Agent[]; total: number }> {
  try {
    const logs = await publicClient.getLogs({
      address: IDENTITY_REGISTRY,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'tokenId', type: 'uint256' },
        ],
      },
      args: {
        from: '0x0000000000000000000000000000000000000000',
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    })

    const total = logs.length
    const paginated = logs.slice(page * pageSize, (page + 1) * pageSize)

    const agents = await Promise.allSettled(
      paginated.map(async (log) => {
        const tokenId = log.args.tokenId ?? 0n
        const to = log.args.to ?? '0x0000000000000000000000000000000000000000'

        let metadataURI = 'ipfs://unknown'
        let owner = to as string

        try {
          const [uri, ownerAddr] = await Promise.all([
            publicClient.readContract({
              address: IDENTITY_REGISTRY,
              abi: IDENTITY_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            }),
            publicClient.readContract({
              address: IDENTITY_REGISTRY,
              abi: IDENTITY_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }),
          ])
          metadataURI = uri as string
          owner = ownerAddr as string
        } catch {
          // keep defaults
        }

        return {
          id: tokenId.toString(),
          owner,
          metadataURI,
          blockNumber: (log.blockNumber ?? 0n).toString(),
          reputationScore: 0,
        } satisfies Agent
      })
    )

    return {
      agents: agents
        .filter(
          (r): r is PromiseFulfilledResult<Agent> => r.status === 'fulfilled'
        )
        .map((r) => r.value),
      total,
    }
  } catch (err) {
    console.error('fetchAgents error:', err)
    return { agents: [], total: 0 }
  }
}
