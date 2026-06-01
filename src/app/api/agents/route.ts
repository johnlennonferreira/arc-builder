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
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
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

const FEEDBACK_EVENT = {
  type: 'event' as const,
  name: 'FeedbackGiven',
  inputs: [
    { indexed: true, name: 'agentId', type: 'uint256' },
    { indexed: true, name: 'validator', type: 'address' },
    { indexed: false, name: 'score', type: 'int128' },
    { indexed: false, name: 'tag', type: 'string' },
  ],
}

const IDENTITY_ABI = [
  TRANSFER_EVENT,
  { type: 'function', name: 'tokenURI', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'string' }] },
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ name: '', type: 'address' }] },
] as const

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network'),
})

const WINDOW = 9999n
const NUM_WINDOWS = 5

async function fetchWindow(from: bigint, to: bigint) {
  try {
    return await client.getLogs({ address: IDENTITY_REGISTRY, event: TRANSFER_EVENT, args: { from: '0x0000000000000000000000000000000000000000' }, fromBlock: from, toBlock: to })
  } catch { return [] }
}

async function buildReputationMap(fromBlock: bigint, toBlock: bigint): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const logs = await client.getLogs({ address: REPUTATION_REGISTRY, event: FEEDBACK_EVENT, fromBlock, toBlock })
    for (const log of logs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args = log.args as any
      const id = (args.agentId ?? 0n).toString()
      const score = Number(args.score ?? 0)
      map.set(id, (map.get(id) ?? 0) + score)
    }
  } catch { /* ok */ }
  return map
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLog = any

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')
  const filter = searchParams.get('filter') ?? 'all'
  const sort = searchParams.get('sort') ?? 'newest'
  const ownerFilter = searchParams.get('owner')?.toLowerCase() ?? null

  try {
    const latestBlock = await client.getBlockNumber()
    const fromBlock = latestBlock - BigInt(NUM_WINDOWS) * WINDOW

    const [windowResults, repMap] = await Promise.all([
      Promise.all(
        Array.from({ length: NUM_WINDOWS }, (_, i) => {
          const to = latestBlock - BigInt(i) * WINDOW
          const from = to > WINDOW ? to - WINDOW + 1n : 0n
          return fetchWindow(from, to)
        })
      ),
      buildReputationMap(fromBlock > 0n ? fromBlock : 0n, latestBlock),
    ])

    const seen = new Set<string>()
    let allLogs: AnyLog[] = windowResults
      .flat()
      .filter((log: AnyLog) => {
        const id = (log.args?.tokenId ?? 0n).toString()
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

    if (ownerFilter) {
      allLogs = allLogs.filter((log: AnyLog) =>
        (log.args?.to ?? '').toLowerCase() === ownerFilter
      )
    }

    if (sort === 'oldest') {
      allLogs.sort((a: AnyLog, b: AnyLog) => {
        const ai = a.args?.tokenId ?? 0n
        const bi = b.args?.tokenId ?? 0n
        return ai > bi ? 1 : -1
      })
    } else if (sort === 'reputed') {
      allLogs.sort((a: AnyLog, b: AnyLog) => {
        const scoreA = repMap.get((a.args?.tokenId ?? 0n).toString()) ?? 0
        const scoreB = repMap.get((b.args?.tokenId ?? 0n).toString()) ?? 0
        return scoreB - scoreA
      })
    } else {
      allLogs.sort((a: AnyLog, b: AnyLog) => {
        const ai = a.args?.tokenId ?? 0n
        const bi = b.args?.tokenId ?? 0n
        return bi > ai ? 1 : -1
      })
    }

    const maxId = allLogs.length > 0
      ? Math.max(...allLogs.map((l: AnyLog) => Number(l.args?.tokenId ?? 0n)))
      : 0

    const total = allLogs.length
    const countIPFS = allLogs.filter((l: AnyLog) => String(l._metadataURI ?? '').startsWith('ipfs://')).length
    const countURL = allLogs.filter((l: AnyLog) => String(l._metadataURI ?? '').startsWith('http')).length
    const countReputed = repMap.size

    const paginated = allLogs.slice(page * pageSize, (page + 1) * pageSize)

    const enriched = await Promise.allSettled(
      paginated.map(async (log: AnyLog) => {
        const tokenId = log.args?.tokenId ?? 0n
        const to = log.args?.to ?? '0x0000000000000000000000000000000000000000'
        let metadataURI = ''
        let owner = String(to)
        let registeredAt = ''
        const reputationScore = repMap.get(tokenId.toString()) ?? 0

        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber ?? 0n })
          const d = new Date(Number(block.timestamp) * 1000)
          registeredAt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch { /* ok */ }

        try {
          const [uri, ownerAddr] = await Promise.all([
            client.readContract({ address: IDENTITY_REGISTRY, abi: IDENTITY_ABI, functionName: 'tokenURI', args: [tokenId] }),
            client.readContract({ address: IDENTITY_REGISTRY, abi: IDENTITY_ABI, functionName: 'ownerOf', args: [tokenId] }),
          ])
          metadataURI = String(uri)
          owner = String(ownerAddr)
        } catch { /* keep defaults */ }

        return { id: tokenId.toString(), owner, metadataURI, blockNumber: (log.blockNumber ?? 0n).toString(), registeredAt, reputationScore, txHash: String(log.transactionHash ?? '') }
      })
    )

    let result = enriched
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never>).value)

    if (filter === 'ipfs') result = result.filter((a: { metadataURI: string }) => a.metadataURI.startsWith('ipfs://'))
    if (filter === 'url') result = result.filter((a: { metadataURI: string }) => a.metadataURI.startsWith('http'))
    if (filter === 'reputed') result = result.filter((a: { reputationScore: number }) => a.reputationScore > 0)

    return NextResponse.json(
      { agents: result, total, totalAgents: maxId, latestBlock: latestBlock.toString(), counts: { ipfs: countIPFS, url: countURL, reputed: countReputed } },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ agents: [], total: 0, totalAgents: 0, latestBlock: '0', counts: { ipfs: 0, url: 0, reputed: 0 } }, { status: 500 })
  }
}
