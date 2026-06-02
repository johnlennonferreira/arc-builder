import { NextResponse } from 'next/server'
import { createPublicClient, http, type Chain } from 'viem'

const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public:  { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
}

const IDENTITY_REGISTRY   = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`
const AGENTIC_COMMERCE    = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`
const USDC_CONTRACT       = '0x3600000000000000000000000000000000000000' as `0x${string}`

const TRANSFER_EVENT = {
  type: 'event' as const, name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from',    type: 'address' },
    { indexed: true, name: 'to',      type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
}

const FEEDBACK_EVENT = {
  type: 'event' as const, name: 'FeedbackGiven',
  inputs: [
    { indexed: true,  name: 'agentId',   type: 'uint256' },
    { indexed: true,  name: 'validator', type: 'address' },
    { indexed: false, name: 'score',     type: 'int128'  },
    { indexed: false, name: 'tag',       type: 'string'  },
  ],
}

const JOB_CREATED_EVENT = {
  type: 'event' as const, name: 'JobCreated',
  inputs: [
    { indexed: true,  name: 'jobId',     type: 'uint256' },
    { indexed: true,  name: 'client',    type: 'address' },
    { indexed: true,  name: 'provider',  type: 'address' },
    { indexed: false, name: 'evaluator', type: 'address' },
    { indexed: false, name: 'expiredAt', type: 'uint256' },
    { indexed: false, name: 'hook',      type: 'address' },
  ],
}

const PAYMENT_RELEASED_EVENT = {
  type: 'event' as const, name: 'PaymentReleased',
  inputs: [
    { indexed: true,  name: 'jobId',     type: 'uint256' },
    { indexed: true,  name: 'recipient', type: 'address' },
    { indexed: false, name: 'amount',    type: 'uint256' },
  ],
}

const USDC_ABI = [{
  type: 'function' as const, name: 'totalSupply',
  stateMutability: 'view' as const, inputs: [], outputs: [{ name: '', type: 'uint256' }],
}] as const

const rpcClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network'),
})

const WINDOW = 9999n
const NUM_WINDOWS = 5

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLogs(address: `0x${string}`, event: unknown, from: bigint, to: bigint): Promise<any[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rpcClient as any).getLogs({ address, event, fromBlock: from, toBlock: to }).catch(() => [])
}

export async function GET() {
  try {
    const latestBlock = await rpcClient.getBlockNumber()
    const fromBlock = latestBlock > BigInt(NUM_WINDOWS) * WINDOW
      ? latestBlock - BigInt(NUM_WINDOWS) * WINDOW
      : 0n

    const windows = Array.from({ length: NUM_WINDOWS }, (_, i) => {
      const to   = latestBlock - BigInt(i) * WINDOW
      const from = to > WINDOW ? to - WINDOW + 1n : 0n
      return { from, to }
    })

    const [agentWindows, reputationLogs, jobWindows, paymentWindows] = await Promise.all([
      Promise.all(windows.map(w =>
        getLogs(IDENTITY_REGISTRY, TRANSFER_EVENT, w.from, w.to)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((logs: any[]) => logs.filter((l: any) => l.args?.from === '0x0000000000000000000000000000000000000000'))
      )),
      getLogs(REPUTATION_REGISTRY, FEEDBACK_EVENT, fromBlock, latestBlock),
      Promise.all(windows.map(w => getLogs(AGENTIC_COMMERCE, JOB_CREATED_EVENT, w.from, w.to))),
      Promise.all(windows.map(w => getLogs(AGENTIC_COMMERCE, PAYMENT_RELEASED_EVENT, w.from, w.to))),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allAgentLogs: any[] = agentWindows.flat()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allJobLogs: any[]   = jobWindows.flat()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPayments: any[]  = paymentWindows.flat()

    const totalAgents = allAgentLogs.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenIds    = allAgentLogs.map((l: any) => Number(l.args?.tokenId ?? 0n))
    const maxAgentId  = tokenIds.length > 0 ? Math.max(...tokenIds) : 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueOwners = new Set(allAgentLogs.map((l: any) => (l.args?.to ?? '').toLowerCase())).size
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reputedAgents  = new Set(reputationLogs.map((l: any) => (l.args?.agentId ?? 0n).toString()))
    const totalFeedbacks = reputationLogs.length

    const agentsPerWindow = agentWindows.map((w, i) => ({ window: `W${NUM_WINDOWS - i}`, count: w.length })).reverse()

    const seenJobs = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalJobs = allJobLogs.filter((l: any) => {
      const id = (l.args?.jobId ?? 0n).toString()
      if (seenJobs.has(id)) return false
      seenJobs.add(id); return true
    }).length

    const jobsPerWindow = jobWindows.map((w, i) => ({ window: `W${NUM_WINDOWS - i}`, count: w.length })).reverse()

    const totalPayments = allPayments.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalUSDCPaid = allPayments.reduce((sum: number, l: any) => sum + Number(l.args?.amount ?? 0n) / 1_000_000, 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paidWorkers = new Set(allPayments.map((l: any) => (l.args?.recipient ?? '').toLowerCase())).size

    let usdcSupply = 0
    try {
      const supply = await rpcClient.readContract({ address: USDC_CONTRACT, abi: USDC_ABI, functionName: 'totalSupply' })
      usdcSupply = Number(supply) / 1_000_000
    } catch { /* ok */ }

    const ownerCount: Record<string, number> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const l of allAgentLogs) { const o = (l.args?.to ?? '').toLowerCase(); if (o) ownerCount[o] = (ownerCount[o] ?? 0) + 1 }
    const topOwners = Object.entries(ownerCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([address, count]) => ({ address, count }))

    return NextResponse.json({
      latestBlock: latestBlock.toString(),
      windowBlocks: NUM_WINDOWS * Number(WINDOW),
      agents: { total: totalAgents, maxId: maxAgentId, uniqueOwners, reputedCount: reputedAgents.size, totalFeedbacks, perWindow: agentsPerWindow },
      jobs: { total: totalJobs, totalPayments, totalUSDCPaid: Math.round(totalUSDCPaid * 100) / 100, paidWorkers, perWindow: jobsPerWindow },
      usdc: { totalSupply: Math.round(usdcSupply) },
      topOwners,
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } })
  } catch (err) {
    console.error('Network API error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
