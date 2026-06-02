import { NextResponse } from 'next/server'
import { makeRpcClient, AGENTIC_COMMERCE } from '@/lib/arcRpc'

const JOB_CREATED_EVENT = {
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

const GET_JOB_ABI = [
  {
    type: 'function' as const,
    name: 'getJob',
    stateMutability: 'view' as const,
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id',          type: 'uint256' },
          { name: 'client',      type: 'address' },
          { name: 'provider',    type: 'address' },
          { name: 'evaluator',   type: 'address' },
          { name: 'description', type: 'string'  },
          { name: 'budget',      type: 'uint256' },
          { name: 'expiredAt',   type: 'uint256' },
          { name: 'status',      type: 'uint8'   },
          { name: 'hook',        type: 'address' },
        ],
      },
    ],
  },
] as const

const STATUS_LABELS = ['Open', 'Funded', 'Submitted', 'Completed', 'Rejected', 'Expired']

const rpcClient = makeRpcClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLog = any

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter     = searchParams.get('filter') ?? 'all'
  const clientFilter   = searchParams.get('client')?.toLowerCase() ?? null
  const providerFilter = searchParams.get('provider')?.toLowerCase() ?? null
  const page     = parseInt(searchParams.get('page') ?? '0')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

  try {
    const latestBlock = await rpcClient.getBlockNumber()
    const WINDOW = 9999n
    const NUM_WINDOWS = 5

    const windowResults = await Promise.all(
      Array.from({ length: NUM_WINDOWS }, (_, i) => {
        const to   = latestBlock - BigInt(i) * WINDOW
        const from = to > WINDOW ? to - WINDOW + 1n : 0n
        return rpcClient
          .getLogs({ address: AGENTIC_COMMERCE, event: JOB_CREATED_EVENT, fromBlock: from, toBlock: to })
          .catch(() => [])
      })
    )

    const seen = new Set<string>()
    const allLogs: AnyLog[] = windowResults.flat().filter((log: AnyLog) => {
      const id = (log.args?.jobId ?? 0n).toString()
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    allLogs.sort((a: AnyLog, b: AnyLog) => {
      const ai = a.args?.jobId ?? 0n
      const bi = b.args?.jobId ?? 0n
      return bi > ai ? 1 : -1
    })

    // Filter by client or provider if requested
    let filteredLogs = allLogs
    if (clientFilter)   filteredLogs = filteredLogs.filter((l: AnyLog) => (l.args?.client ?? '').toLowerCase() === clientFilter)
    if (providerFilter) filteredLogs = filteredLogs.filter((l: AnyLog) => (l.args?.provider ?? '').toLowerCase() === providerFilter)

    const paginated = filteredLogs.slice(page * pageSize, (page + 1) * pageSize)

    const enriched = await Promise.allSettled(
      paginated.map(async (log: AnyLog) => {
        const jobId    = log.args?.jobId    ?? 0n
        const clientAddr = log.args?.client ?? '0x'
        const provider = log.args?.provider ?? '0x'

        let description = ''
        let budget      = 0n
        let expiredAt   = 0n
        let statusCode  = 0
        let evaluator   = String(log.args?.evaluator ?? '0x')

        try {
          const job = await rpcClient.readContract({
            address: AGENTIC_COMMERCE,
            abi: GET_JOB_ABI,
            functionName: 'getJob',
            args: [jobId],
          }) as {
            id: bigint; client: string; provider: string; evaluator: string;
            description: string; budget: bigint; expiredAt: bigint; status: number; hook: string
          }
          description = job.description ?? ''
          budget      = job.budget
          expiredAt   = job.expiredAt
          statusCode  = Number(job.status)
          evaluator   = String(job.evaluator)
        } catch { /* use event defaults */ }

        const budgetUSDC = Number(budget) / 1_000_000
        const expiry = expiredAt > 0n
          ? new Date(Number(expiredAt) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : ''

        return {
          id:          jobId.toString(),
          client:      String(clientAddr),
          provider:    String(provider),
          evaluator,
          description,
          budgetUSDC,
          expiry,
          status:      STATUS_LABELS[statusCode] ?? 'Unknown',
          statusCode,
          txHash:      String(log.transactionHash ?? ''),
          blockNumber: (log.blockNumber ?? 0n).toString(),
        }
      })
    )

    let result = enriched
      .filter(r => r.status === 'fulfilled')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(r => (r as any).value)

    if (filter !== 'all') {
      result = result.filter((j: { status: string }) =>
        j.status.toLowerCase() === filter.toLowerCase()
      )
    }

    return NextResponse.json(
      { jobs: result, total: filteredLogs.length, page, pageSize },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('Jobs API error:', err)
    return NextResponse.json({ jobs: [], total: 0, page: 0, pageSize: 20 }, { status: 500 })
  }
}
