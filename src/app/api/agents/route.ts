import { NextResponse } from 'next/server'
import { createPublicClient, http, type Chain } from 'viem'

const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
}

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`

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
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const REPUTATION_ABI = [
  {
    type: 'function',
    name: 'getReputation',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'int128' }],
  },
] as const

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network'),
})

async function getReputation(agentId: bigint): Promise<number> {
  try {
    const score = await Promise.race([
      client.readContract({
        address: REPUTATION_REGISTRY,
        abi: REPUTATION_ABI,
        functionName: 'getReputation',
        args: [agentId],
      }),
      new Promise<null>((_, reject) => setTimeout(() => reject('timeout'), 3000))
    ])
    return score ? Number(score) : 0
  } catch {
    return 0
  }
}

async function getTotalFromLogs(latestBlock: bigint): Promise<number> {
  // Get the very first mint events to find lowest tokenId
  // and last events to find highest — estimate total from last tokenId
  try {
    const recentLogs = await client.getLogs({
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
      args: { from: '0x0000000000000000000000000000000000000000' },
      fromBlock: latestBlock - 9999n,
      toBlock: latestBlock,
    })
    if (recentLogs.length > 0) {
      // Get the max tokenId seen — that's approximately total registered
      const maxId = recentLogs.reduce((max, log) => {
        const id = log.args.tokenId ?? 0n
        return id > max ? id : max
      }, 0n)
      return Number(maxId)
    }
    return 0
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

  try {
    const latestBlock = await client.getBlockNumber()
    const fromBlock = latestBlock > 9999n ? latestBlock - 9999n : 0n

    const [logs, totalAgents] = await Promise.all([
      client.getLogs({
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
        args: { from: '0x0000000000000000000000000000000000000000' },
        fromBlock,
        toBlock: latestBlock,
      }),
      getTotalFromLogs(latestBlock),
    ])

    const total = logs.length
    const paginated = logs.slice(page * pageSize, (page + 1) * pageSize)

    const agents = await Promise.allSettled(
      paginated.map(async (log) => {
        const tokenId = log.args.tokenId ?? 0n
        const to = (log.args.to ?? '0x0000000000000000000000000000000000000000') as string

        let metadataURI = ''
        let owner = to
        let reputationScore = 0

        // Get block for timestamp
        let registeredAt = ''
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber ?? 0n })
          const date = new Date(Number(block.timestamp) * 1000)
          registeredAt = date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })
        } catch { /* keep empty */ }

        try {
          const [uri, ownerAddr, rep] = await Promise.all([
            client.readContract({
              address: IDENTITY_REGISTRY,
              abi: IDENTITY_ABI,
              functionName: 'tokenURI',
              args: [tokenId],
            }),
            client.readContract({
              address: IDENTITY_REGISTRY,
              abi: IDENTITY_ABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }),
            getReputation(tokenId),
          ])
          metadataURI = uri as string
          owner = ownerAddr as string
          reputationScore = rep
        } catch { /* keep defaults */ }

        return {
          id: tokenId.toString(),
          owner,
          metadataURI,
          blockNumber: (log.blockNumber ?? 0n).toString(),
          registeredAt,
          reputationScore,
          txHash: (log.transactionHash ?? '') as string,
        }
      })
    )

    const result = agents
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never>).value)

    return NextResponse.json(
      { agents: result, total, totalAgents },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { agents: [], total: 0, totalAgents: 0, error: 'Failed to fetch from Arc Testnet' },
      { status: 500 }
    )
  }
}
