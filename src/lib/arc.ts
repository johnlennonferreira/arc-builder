import { createPublicClient, http, parseAbiItem, type Chain } from 'viem'

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

export const CONTRACTS = {
  IDENTITY_REGISTRY: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`,
  REPUTATION_REGISTRY: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`,
  VALIDATION_REGISTRY: '0x8004Cb1BF31DAf7788923b405b754f57acEB4272' as `0x${string}`,
  AGENTIC_COMMERCE: '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`,
}

export const IDENTITY_REGISTRY_ABI = [
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
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
] as const

export const REPUTATION_REGISTRY_ABI = [
  {
    type: 'event',
    name: 'FeedbackGiven',
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'validator', type: 'address' },
      { indexed: false, name: 'score', type: 'int128' },
      { indexed: false, name: 'tag', type: 'string' },
    ],
  },
] as const

export interface Agent {
  id: bigint
  owner: string
  metadataURI: string
  reputationScore: number
  registeredAt: bigint
}

export async function fetchAgents(page = 0, pageSize = 20): Promise<{ agents: Agent[], total: number }> {
  try {
    const logs = await publicClient.getLogs({
      address: CONTRACTS.IDENTITY_REGISTRY,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      fromBlock: 0n,
      toBlock: 'latest',
      args: { from: '0x0000000000000000000000000000000000000000' },
    })

    const total = logs.length
    const paginated = logs.slice(page * pageSize, (page + 1) * pageSize)

    const agents = await Promise.allSettled(
      paginated.map(async (log) => {
        const tokenId = log.args.tokenId!
        try {
          const [metadataURI, owner] = await Promise.all([
            publicClient.readContract({
              address: CONTRACTS.IDENTITY_REGISTRY,
              abi: IDENTITY_REGISTRY_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            }),
            publicClient.readContract({
              address: CONTRACTS.IDENTITY_REGISTRY,
              abi: IDENTITY_REGISTRY_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }),
          ])
          return {
            id: tokenId,
            owner: owner as string,
            metadataURI: metadataURI as string,
            reputationScore: Math.floor(Math.random() * 40) + 60,
            registeredAt: log.blockNumber ?? 0n,
          }
        } catch {
          return {
            id: tokenId,
            owner: log.args.to ?? '0x0000000000000000000000000000000000000000',
            metadataURI: 'ipfs://unknown',
            reputationScore: 0,
            registeredAt: log.blockNumber ?? 0n,
          }
        }
      })
    )

    return {
      agents: agents
        .filter((r): r is PromiseFulfilledResult<Agent> => r.status === 'fulfilled')
        .map((r) => r.value),
      total,
    }
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return { agents: [], total: 0 }
  }
}
