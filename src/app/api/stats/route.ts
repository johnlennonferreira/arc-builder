import { NextResponse } from 'next/server'
import { makeRpcClient, IDENTITY_REGISTRY } from '@/lib/arcRpc'

const client = makeRpcClient()

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

    // Fetch 5 windows
    const windows = await Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const to = latestBlock - BigInt(i) * WINDOW
        const from = to > WINDOW ? to - WINDOW + 1n : 0n
        return client.getLogs({ address: IDENTITY_REGISTRY, event: TRANSFER_EVENT, args: { from: '0x0000000000000000000000000000000000000000' }, fromBlock: from, toBlock: to }).catch(() => [])
      })
    )

    const allLogs = windows.flat()

    // Sample timestamps — pick one block per window to estimate hourly distribution
    const windowBlocks = windows.map(w => w[Math.floor(w.length / 2)]?.blockNumber).filter(Boolean) as bigint[]
    const blockTimestamps = new Map<bigint, number>()

    await Promise.all(
      windowBlocks.map(async bn => {
        try {
          const block = await client.getBlock({ blockNumber: bn })
          blockTimestamps.set(bn, Number(block.timestamp))
        } catch { /* ok */ }
      })
    )

    // Build hourly map by estimating timestamp from nearest sampled block
    // Arc ~2s block time
    const AVG_BLOCK_TIME = 2 // seconds

    const hourMap: Record<string, number> = {}

    for (const log of allLogs) {
      const bn = log.blockNumber ?? 0n
      // Find nearest sampled block
      let nearestTs: number | null = null
      let minDiff = BigInt(Number.MAX_SAFE_INTEGER)
      for (const [sbn, ts] of blockTimestamps.entries()) {
        const diff = bn > sbn ? bn - sbn : sbn - bn
        if (diff < minDiff) { minDiff = diff; nearestTs = ts }
      }
      if (nearestTs === null) continue
      // Estimate timestamp
      const nearestBn = Array.from(blockTimestamps.keys()).find(k => blockTimestamps.get(k) === nearestTs)!
      const diff = Number(bn) - Number(nearestBn)
      const estimatedTs = nearestTs + diff * AVG_BLOCK_TIME
      const d = new Date(estimatedTs * 1000)
      const hour = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.getHours()}h`
      hourMap[hour] = (hourMap[hour] ?? 0) + 1
    }

    const chart = Object.entries(hourMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-24) // last 24 hours of data

    return NextResponse.json({ chart, total: allLogs.length }, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' }
    })
  } catch {
    return NextResponse.json({ chart: [], total: 0 })
  }
}
