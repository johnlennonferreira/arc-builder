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

const TRANSFER_EVENT = {
  type: 'event' as const,
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
}

const IDENTITY_ABI = [
  TRANSFER_EVENT,
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

const WINDOW = 9999n
const NUM_WINDOWS = 5 // fetch last ~50k blocks

async function fetchWindow(fromBlock: bigint, toBlock: bigint) {
  try {
    return await client.getLogs({
      address: IDENTITY_REGISTRY,
      event: TRANSFER_EVENT,
      args: { from: '0x0000000000000000000000000000000000000000' },
      fromBlock,
      toBlock,
    })
  } catch {
    return []
  }
}

async function getReputation(agentId: bigint): Promise<number> {
  try {
    const score = await Promise.race([
      client.readContract({
        address: REPUTATION_REGISTRY,
        abi: REPUTATION_ABI,
        functionName: 'getReputation',
        args: [agentId],
      }),
      new Promise<null>((_, r) => setTimeout(() => r('timeout'), 2500)),
    ])
    return score ? Number(score) : 0
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')
  const filter = searchParams.get('filter') ?? 'all' // all | ipfs | url | reputed

  try {
    const latestBlock = await client.getBlockNumber()

    // Fetch multiple windows in parallel
    const windows = await Promise.all(
      Array.from({ length: NUM_WINDOWS }, (_, i) => {
        const to = latestBlock - BigInt(i) * WINDOW
        const from = to - WINDOW + 1n
        return fetchWindow(from > 0n ? from : 0n, to)
      })
    )

    // Flatten, deduplicate by tokenId, sort descending
    type LogEntry = (typeof windows)[0][0]
    const seen = new Set<string>()
    const allLogs: LogEntry[] = windows
      .flat()
      .filter((log: LogEntry) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = ((log.args as any).tokenId ?? 0n).toString()
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
      .sort((a: LogEntry, b: LogEntry) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ai = (a.args as any).tokenId ?? 0n
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bi = (b.args as any).tokenId ?? 0n
        return bi > ai ? 1 : -1
      })

    // Get max tokenId for total count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maxId = allLogs.length > 0
      ? Math.max(...allLogs.map((l: LogEntry) => Number((l.args as any).tokenId ?? 0n)))
      : 0

    // Apply metadata filter (pre-filter on URI prefix — done after enrichment)
    const total = allLogs.length
    const paginated = allLogs.slice(page * pageSize, (page + 1) * pageSize)

    const enriched = await Promise.allSettled(
      paginated.map(async (log: LogEntry) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = log.args as any
        const tokenId = args.tokenId ?? 0n
        const to = (args.to ?? '0x0000000000000000000000000000000000000000') as string

        let metadataURI = ''
        let owner = to
        let reputationScore = 0
        let registeredAt = ''

        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber ?? 0n })
          const d = new Date(Number(block.timestamp) * 1000)
          registeredAt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch { /* ok */ }

        try {
          const [uri, ownerAddr, rep] = await Promise.all([
            client.readContract({ address: IDENTITY_REGISTRY, abi: IDENTITY_ABI, functionName: 'tokenURI', args: [tokenId] }),
            client.readContract({ address: IDENTITY_REGISTRY, abi: IDENTITY_ABI, functionName: 'ownerOf', args: [tokenId] }),
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

    let result = enriched
      .filter(r => r.status === 'fulfilled')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(r => (r as any).value)

    // Apply filter
    if (filter === 'ipfs') result = result.filter((a: { metadataURI: string }) => a.metadataURI.startsWith('ipfs://'))
    if (filter === 'url') result = result.filter((a: { metadataURI: string }) => a.metadataURI.startsWith('http'))
    if (filter === 'reputed') result = result.filter((a: { reputationScore: number }) => a.reputationScore > 0)

    return NextResponse.json(
      { agents: result, total, totalAgents: maxId },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ agents: [], total: 0, totalAgents: 0 }, { status: 500 })
  }
}
