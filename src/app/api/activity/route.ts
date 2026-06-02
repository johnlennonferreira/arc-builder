import { NextResponse } from 'next/server'
import { makeRpcClient, AGENTIC_COMMERCE as COMMERCE, IDENTITY_REGISTRY as IDENTITY } from '@/lib/arcRpc'

const pub = makeRpcClient()

const JOB_CREATED   = { type: 'event' as const, name: 'JobCreated',      inputs: [{ indexed: true, name: 'jobId', type: 'uint256' }, { indexed: true, name: 'client', type: 'address' }, { indexed: true, name: 'provider', type: 'address' }, { indexed: false, name: 'evaluator', type: 'address' }, { indexed: false, name: 'expiredAt', type: 'uint256' }, { indexed: false, name: 'hook', type: 'address' }] }
const PAY_RELEASED  = { type: 'event' as const, name: 'PaymentReleased', inputs: [{ indexed: true, name: 'jobId', type: 'uint256' }, { indexed: true, name: 'recipient', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }] }
const AGENT_CREATED = { type: 'event' as const, name: 'Transfer',        inputs: [{ indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: true, name: 'tokenId', type: 'uint256' }] }

function addr(a: string) { return a.slice(0, 6) + '…' + a.slice(-4) }

export async function GET() {
  try {
    const latest = await pub.getBlockNumber()
    const from   = latest > 2000n ? latest - 2000n : 0n

    const [jobLogs, payLogs, agentLogs] = await Promise.all([
      pub.getLogs({ address: COMMERCE, event: JOB_CREATED,   fromBlock: from, toBlock: latest }).catch(() => []),
      pub.getLogs({ address: COMMERCE, event: PAY_RELEASED,  fromBlock: from, toBlock: latest }).catch(() => []),
      pub.getLogs({ address: IDENTITY, event: AGENT_CREATED, fromBlock: from, toBlock: latest,
        args: { from: '0x0000000000000000000000000000000000000000' } }).catch(() => []),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = []

    for (const log of jobLogs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      events.push({
        type:    'job_created',
        icon:    '📋',
        label:   `Job #${l.args?.jobId?.toString() ?? '?'} created`,
        sub:     `Client ${addr(l.args?.client ?? '0x')} → Provider ${addr(l.args?.provider ?? '0x')}`,
        block:   (log.blockNumber ?? 0n).toString(),
        txHash:  log.transactionHash ?? '',
        ts:      Number(log.blockNumber ?? 0n),
      })
    }

    for (const log of payLogs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      const usdc = (Number(l.args?.amount ?? 0n) / 1_000_000).toFixed(2)
      events.push({
        type:   'payment_released',
        icon:   '💰',
        label:  `Job #${l.args?.jobId?.toString() ?? '?'} paid — ${usdc} USDC`,
        sub:    `→ ${addr(l.args?.recipient ?? '0x')}`,
        block:  (log.blockNumber ?? 0n).toString(),
        txHash: log.transactionHash ?? '',
        ts:     Number(log.blockNumber ?? 0n),
      })
    }

    for (const log of agentLogs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = log as any
      events.push({
        type:   'agent_registered',
        icon:   '🤖',
        label:  `Agent #${l.args?.tokenId?.toString() ?? '?'} registered`,
        sub:    `Owner ${addr(l.args?.to ?? '0x')}`,
        block:  (log.blockNumber ?? 0n).toString(),
        txHash: log.transactionHash ?? '',
        ts:     Number(log.blockNumber ?? 0n),
      })
    }

    events.sort((a, b) => b.ts - a.ts)

    return NextResponse.json(
      { events: events.slice(0, 50), latestBlock: latest.toString() },
      { headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=20' } }
    )
  } catch (err) {
    console.error('Activity error:', err)
    return NextResponse.json({ events: [], latestBlock: '0' }, { status: 500 })
  }
}
