import { NextResponse } from 'next/server'
import { createPublicClient, http, type Chain } from 'viem'

const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] }, public: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
}

const client = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') })
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`

const TRANSFER_EVENT = {
  type: 'event' as const,
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
}

export async function GET() {
  try {
    const latestBlock = await client.getBlockNumber()
    const WINDOW = 9999n
    const NUM_WINDOWS = 5

    const windows = await Promise.all(
      Array.from({ length: NUM_WINDOWS }, (_, i) => {
        const to = latestBlock - BigInt(i) * WINDOW
        const from = to > WINDOW ? to - WINDOW + 1n : 0n
        return client.getLogs({
          address: IDENTITY_REGISTRY,
          event: TRANSFER_EVENT,
          args: { from: '0x0000000000000000000000000000000000000000' },
          fromBlock: from,
          toBlock: to,
        }).catch(() => [])
      })
    )

    // Group by day
    const dayMap: Record<string, number> = {}
    const blockTimes: bigint[] = []

    // Sample blocks to estimate timestamps (get 10 evenly spaced)
    const allLogs = windows.flat()
    const sampleLogs = allLogs.filter((_, i) => i % Math.max(1, Math.floor(allLogs.length / 10)) === 0).slice(0, 10)

    const blockDates = new Map<string, string>()
    await Promise.all(
      sampleLogs.map(async log => {
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber ?? 0n })
          const day = new Date(Number(block.timestamp) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          blockDates.set((log.blockNumber ?? 0n).toString(), day)
          blockTimes.push(log.blockNumber ?? 0n)
        } catch { /* ok */ }
      })
    )

    // Estimate day for all logs using sampled block dates
    for (const log of allLogs) {
      const bn = log.blockNumber ?? 0n
      // Find closest sampled block
      let closestDay = 'Unknown'
      let minDiff = BigInt(Number.MAX_SAFE_INTEGER)
      for (const [sbn, day] of blockDates.entries()) {
        const diff = bn > BigInt(sbn) ? bn - BigInt(sbn) : BigInt(sbn) - bn
        if (diff < minDiff) { minDiff = diff; closestDay = day }
      }
      dayMap[closestDay] = (dayMap[closestDay] ?? 0) + 1
    }

    const chart = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({ chart, total: allLogs.length }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' }
    })
  } catch {
    return NextResponse.json({ chart: [], total: 0 })
  }
}
