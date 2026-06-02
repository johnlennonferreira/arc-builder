import { NextResponse } from 'next/server'
import { makeRpcClient, AGENTIC_COMMERCE as COMMERCE, IDENTITY_REGISTRY as IDENTITY } from '@/lib/arcRpc'

const PAYMENT_RELEASED = {
  type: 'event' as const,
  name: 'PaymentReleased',
  inputs: [
    { indexed: true,  name: 'jobId',     type: 'uint256' },
    { indexed: true,  name: 'recipient', type: 'address' },
    { indexed: false, name: 'amount',    type: 'uint256' },
  ],
}

const JOB_CREATED = {
  type: 'event' as const,
  name: 'JobCreated',
  inputs: [
    { indexed: true,  name: 'jobId',     type: 'uint256' },
    { indexed: true,  name: 'client',    type: 'address' },
    { indexed: true,  name: 'provider',  type: 'address' },
    { indexed: false, name: 'evaluator', type: 'address' },
    { indexed: false, name: 'expiredAt', type: 'uint256' },
    { indexed: false, name: 'hook',      type: 'address' },
  ],
}

const TRANSFER = {
  type: 'event' as const,
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from',    type: 'address' },
    { indexed: true, name: 'to',      type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
}

const pub = makeRpcClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllLogs(event: any, address: `0x${string}`, args?: Record<string, unknown>) {
  const latest = await pub.getBlockNumber()
  const WINDOW = 9999n
  const NUM_WINDOWS = 6
  const results = await Promise.all(
    Array.from({ length: NUM_WINDOWS }, (_, i) => {
      const to   = latest - BigInt(i) * WINDOW
      const from = to > WINDOW ? to - WINDOW + 1n : 0n
      return pub.getLogs({ address, event, fromBlock: from, toBlock: to, args }).catch(() => [])
    })
  )
  return results.flat()
}

export async function GET() {
  try {
    const [payments, jobsCreated, agentTransfers] = await Promise.all([
      fetchAllLogs(PAYMENT_RELEASED, COMMERCE),
      fetchAllLogs(JOB_CREATED, COMMERCE),
      fetchAllLogs(TRANSFER, IDENTITY, { from: '0x0000000000000000000000000000000000000000' }),
    ])

    // --- Providers leaderboard (by USDC earned) ---
    const providerMap = new Map<string, { earned: number; jobs: number }>()
    for (const log of payments) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      const addr    = (l.args?.recipient ?? '').toLowerCase()
      const amount  = Number(l.args?.amount ?? 0n) / 1_000_000
      const cur     = providerMap.get(addr) ?? { earned: 0, jobs: 0 }
      providerMap.set(addr, { earned: cur.earned + amount, jobs: cur.jobs + 1 })
    }
    const providers = [...providerMap.entries()]
      .map(([address, s]) => ({ address, earned: s.earned, jobs: s.jobs }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 20)

    // --- Clients leaderboard (by jobs posted) ---
    const clientMap = new Map<string, { posted: number; spent: number }>()
    for (const log of jobsCreated) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      const addr = (l.args?.client ?? '').toLowerCase()
      const cur  = clientMap.get(addr) ?? { posted: 0, spent: 0 }
      clientMap.set(addr, { posted: cur.posted + 1, spent: cur.spent })
    }
    // add spending from payments
    for (const log of payments) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      const jobId = (l.args?.jobId ?? 0n).toString()
      const amount = Number(l.args?.amount ?? 0n) / 1_000_000
      // find client from jobsCreated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jobLog = jobsCreated.find((j: any) => (j.args?.jobId ?? 0n).toString() === jobId) as any
      if (jobLog) {
        const client = (jobLog.args?.client ?? '').toLowerCase()
        const cur    = clientMap.get(client) ?? { posted: 0, spent: 0 }
        clientMap.set(client, { posted: cur.posted, spent: cur.spent + amount })
      }
    }
    const clients = [...clientMap.entries()]
      .map(([address, s]) => ({ address, posted: s.posted, spent: s.spent }))
      .sort((a, b) => b.posted - a.posted)
      .slice(0, 20)

    // --- Agent builders (by agents registered) ---
    const builderMap = new Map<string, number>()
    for (const log of agentTransfers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      const addr = (l.args?.to ?? '').toLowerCase()
      builderMap.set(addr, (builderMap.get(addr) ?? 0) + 1)
    }
    const builders = [...builderMap.entries()]
      .map(([address, agents]) => ({ address, agents }))
      .sort((a, b) => b.agents - a.agents)
      .slice(0, 20)

    // --- Summary stats ---
    const totalUSDCPaid = payments.reduce((s, l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return s + Number((l as any).args?.amount ?? 0n) / 1_000_000
    }, 0)

    return NextResponse.json({
      providers,
      clients,
      builders,
      stats: {
        totalPayments: payments.length,
        totalUSDCPaid: Math.round(totalUSDCPaid * 100) / 100,
        totalJobsCreated: jobsCreated.length,
        totalAgents: agentTransfers.length,
      },
    }, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return NextResponse.json({ providers: [], clients: [], builders: [], stats: {} }, { status: 500 })
  }
}
