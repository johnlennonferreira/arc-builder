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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

  try {
    const client = createPublicClient({
      chain: arcTestnet,
      transport: http('https://rpc.testnet.arc.network'),
    })

    const logs = await client.getLogs({
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
      fromBlock: 'earliest',
      toBlock: 'latest',
    })

    const total = logs.length
    const paginated = logs.slice(page * pageSize, (page + 1) * pageSize)

    const agents = await Promise.allSettled(
      paginated.map(async (log) => {
        const tokenId = log.args.tokenId ?? 0n
        const to = (log.args.to ?? '0x0000000000000000000000000000000000000000') as string

        let metadataURI = ''
        let owner = to

        try {
          const [uri, ownerAddr] = await Promise.all([
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
        }
      })
    )

    const result = agents
      .filter((r): r is PromiseFulfilledResult<{
        id: string; owner: string; metadataURI: string; blockNumber: string; reputationScore: number
      }> => r.status === 'fulfilled')
      .map((r) => r.value)

    return NextResponse.json({ agents: result, total }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ agents: [], total: 0, error: 'Failed to fetch from Arc Testnet' }, { status: 500 })
  }
}
