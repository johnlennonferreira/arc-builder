'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import { createWalletClient, createPublicClient, custom, http, parseAbi, keccak256, toBytes } from 'viem'
import { ensureArcTestnet } from '@/lib/switchChain'
import { arcTestnet, ARC_RPC_URL } from '@/lib/arc'
import { useWallet } from '@/components/WalletProvider'
import { useToast } from '@/components/Toast'

const COMMERCE = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`
const COMMERCE_ABI = parseAbi([
  'function submit(uint256 jobId, bytes32 deliverable, bytes optParams) external',
  'function complete(uint256 jobId, bytes32 reason, bytes optParams) external',
])

interface Job {
  id: string; client: string; provider: string; evaluator: string
  description: string; budgetUSDC: number; expiry: string
  status: string; statusCode: number; txHash: string; blockNumber: string
}

// Light-theme status palette
const STATUS: Record<string, { color: string; bg: string; border: string }> = {
  Open:      { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  Funded:    { color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  Submitted: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Completed: { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  Rejected:  { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
  Expired:   { color: '#374151', bg: '#f3f4f6', border: '#d1d5db' },
}

function addr(a: string) {
  if (!a || a === '0x') return '—'
  return a.slice(0, 6) + '…' + a.slice(-4)
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { color: '#374151', bg: '#f3f4f6', border: '#d1d5db' }
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: s.color, background: s.bg, border: '1px solid ' + s.border, textTransform: 'uppercase' }}>
      {status}
    </span>
  )
}

type Filter = 'all' | 'open' | 'funded' | 'submitted' | 'completed'
type TxStep = 'idle' | 'signing' | 'confirming' | 'done' | 'error'

export default function JobsPage() {
  const [jobs,     setJobs]     = useState<Job[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<Filter>('all')
  const [page,     setPage]     = useState(0)
  const [selected, setSelected] = useState<Job | null>(null)
  const [search,   setSearch]   = useState('')
  const pageSize = 20

  const { account, connect: connectWallet, connecting } = useWallet()
  const { success, error: toastError } = useToast()

  const [deliverable, setDeliverable] = useState('')
  const [txStep,      setTxStep]      = useState<TxStep>('idle')
  const [txHash,      setTxHash]      = useState('')
  const [txError,     setTxError]     = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/jobs?filter=' + filter + '&page=' + page + '&pageSize=' + pageSize)
      const data = await res.json()
      setJobs(data.jobs ?? [])
      setTotal(data.total ?? 0)
    } catch { setJobs([]) }
    finally  { setLoading(false) }
  }, [filter, page])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { setPage(0) }, [filter])
  useEffect(() => {
    const t = setInterval(() => { fetchJobs() }, 30_000)
    return () => clearInterval(t)
  }, [fetchJobs])
  useEffect(() => {
    if (!selected) { setDeliverable(''); setTxStep('idle'); setTxHash(''); setTxError('') }
  }, [selected])

  async function submitWork(job: Job) {
    if (!deliverable.trim()) { setTxError('Enter a deliverable description or URL.'); return }
    setTxError(''); setTxStep('signing')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      await ensureArcTestnet()
      const wallet = createWalletClient({ account: account as `0x${string}`, chain: arcTestnet, transport: custom(eth) })
      const pub    = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) })
      const hash32 = keccak256(toBytes(deliverable.trim()))
      const h = await wallet.writeContract({ address: COMMERCE, abi: COMMERCE_ABI, functionName: 'submit', args: [BigInt(job.id), hash32, '0x'] })
      setTxHash(h); setTxStep('confirming')
      await pub.waitForTransactionReceipt({ hash: h })
      setTxStep('done')
      success('Work submitted! Waiting for evaluator approval.')
      setTimeout(() => { setSelected(null); fetchJobs() }, 2000)
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Transaction failed.'
      const friendly = msg.toLowerCase().includes('user rejected') ? 'Transaction cancelled.' : msg.slice(0, 180)
      toastError(friendly); setTxError(friendly); setTxStep('error')
    }
  }

  async function completeJob(job: Job) {
    setTxError(''); setTxStep('signing')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      await ensureArcTestnet()
      const wallet = createWalletClient({ account: account as `0x${string}`, chain: arcTestnet, transport: custom(eth) })
      const pub    = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) })
      const ZERO32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
      const h = await wallet.writeContract({ address: COMMERCE, abi: COMMERCE_ABI, functionName: 'complete', args: [BigInt(job.id), ZERO32, '0x'] })
      setTxHash(h); setTxStep('confirming')
      await pub.waitForTransactionReceipt({ hash: h })
      setTxStep('done')
      setTimeout(() => { setSelected(null); fetchJobs() }, 2000)
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Transaction failed.'
      setTxError(msg.toLowerCase().includes('user rejected') ? 'Transaction cancelled.' : msg.slice(0, 180))
      setTxStep('error')
    }
  }

  const isProvider  = account && selected ? account.toLowerCase() === selected.provider.toLowerCase()  : false
  const isEvaluator = account && selected ? account.toLowerCase() === selected.evaluator.toLowerCase() || account.toLowerCase() === selected.client.toLowerCase() : false

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',       label: 'All'       },
    { key: 'open',      label: 'Open'      },
    { key: 'funded',    label: 'Funded'    },
    { key: 'submitted', label: 'Submitted' },
    { key: 'completed', label: 'Completed' },
  ]

  const displayJobs = jobs.filter(j => {
    if (!search) return true
    const q = search.replace(/^#/, '').toLowerCase()
    return j.id === q || j.description.toLowerCase().includes(q) || j.client.toLowerCase().includes(q) || j.provider.toLowerCase().includes(q)
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280' }}>ERC-8183 · AgenticCommerce</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: '#111827' }}>Jobs Board</h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>On-chain work marketplace for AI agents. Funded in USDC with automatic escrow settlement.</p>
          </div>
          {!account && (
            <button onClick={connectWallet} disabled={connecting}
              style={{ padding: '9px 20px', borderRadius: 10, background: '#5b8af7', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(91,138,247,.3)', fontFamily: 'inherit' }}>
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 22px', marginBottom: 24, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Total Jobs</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginTop: 1 }}>{loading ? '…' : total.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Showing</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5b8af7', marginTop: 1 }}>{loading ? '…' : displayJobs.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Contract</div>
            <a href="https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, color: '#5b8af7', textDecoration: 'none', marginTop: 1, display: 'block', fontFamily: 'JetBrains Mono, monospace' }}>
              0x0747…4583 ↗
            </a>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
            <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>Arc Testnet</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              background: filter === f.key ? '#5b8af7' : '#fff',
              color: filter === f.key ? '#fff' : '#6b7280',
              border: filter === f.key ? '1px solid #5b8af7' : '1px solid #e5e7eb',
              boxShadow: filter === f.key ? '0 2px 8px rgba(91,138,247,.25)' : 'none',
            }}>
              {f.label}
            </button>
          ))}
          <Link href="/jobs/create" style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
            background: '#5b8af7', boxShadow: '0 2px 8px rgba(91,138,247,.25)',
          }}>
            + Post Job
          </Link>
          <button onClick={fetchJobs} style={{ padding: '7px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer', background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 600 }}>↻</button>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs…"
            style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', color: '#111827', outline: 'none', width: 200 }}
          />
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
          </div>
        ) : displayJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
            No jobs found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayJobs.map(job => (
              <div key={job.id} onClick={() => setSelected(job)}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(91,138,247,.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.05)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>#{job.id}</span>
                      <StatusBadge status={job.status} />
                      {account && account.toLowerCase() === job.provider.toLowerCase() && job.status === 'Funded' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d' }}>↑ Your action needed</span>
                      )}
                      {account && (account.toLowerCase() === job.client.toLowerCase() || account.toLowerCase() === job.evaluator.toLowerCase()) && job.status === 'Submitted' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7' }}>↑ Approve to release USDC</span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, wordBreak: 'break-all' }}>
                      {job.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No description</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: job.budgetUSDC > 0 ? '#059669' : '#9ca3af' }}>
                      {job.budgetUSDC > 0 ? job.budgetUSDC.toFixed(2) : '—'}
                      {job.budgetUSDC > 0 && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>USDC</span>}
                    </span>
                    {job.expiry && <span style={{ fontSize: 11, color: '#9ca3af' }}>Expires {job.expiry}</span>}
                    <a href={'https://testnet.arcscan.app/tx/' + job.txHash} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                      onClick={e => e.stopPropagation()}>tx ↗</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f8', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client </span>
                    <Link href={'/owner/' + job.client} style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }} onClick={e => e.stopPropagation()}>{addr(job.client)}</Link>
                  </div>
                  <div>
                    <span style={{ color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Provider </span>
                    <Link href={'/owner/' + job.provider} style={{ color: '#059669', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }} onClick={e => e.stopPropagation()}>{addr(job.provider)}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
              style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer', background: '#fff', border: '1px solid #e5e7eb', color: page === 0 ? '#d1d5db' : '#374151' }}>← Prev</button>
            <span style={{ color: '#6b7280', fontSize: 13 }}>Page {page+1} of {Math.ceil(total/pageSize)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={(page+1)*pageSize >= total}
              style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: (page+1)*pageSize >= total ? 'not-allowed' : 'pointer', background: '#fff', border: '1px solid #e5e7eb', color: (page+1)*pageSize >= total ? '#d1d5db' : '#374151' }}>Next →</button>
          </div>
        )}

        {/* Detail modal */}
        {selected && (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>Job </span>
                  <span style={{ color: '#111827', fontSize: 18, fontWeight: 800 }}>{'#' + selected.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              </div>

              {selected.description && (
                <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px' }}>Description</p>
                  <p style={{ color: '#111827', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{selected.description}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Budget</p>
                  <p style={{ color: selected.budgetUSDC > 0 ? '#059669' : '#9ca3af', fontSize: 22, fontWeight: 800, margin: 0 }}>
                    {selected.budgetUSDC > 0 ? selected.budgetUSDC.toFixed(2) + ' USDC' : '—'}
                  </p>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>Expires</p>
                  <p style={{ color: '#111827', fontSize: 15, fontWeight: 700, margin: 0 }}>{selected.expiry || '—'}</p>
                </div>
              </div>

              {[
                { label: 'Client',    value: selected.client,    link: true },
                { label: 'Provider',  value: selected.provider,  link: true },
                { label: 'Evaluator', value: selected.evaluator, link: false },
              ].filter(r => r.value && r.value !== '0x').map(({ label, value, link }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f8' }}>
                  <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  {link ? (
                    <Link href={'/owner/' + value} style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
                      {value.slice(0,8)}…{value.slice(-6)}
                    </Link>
                  ) : (
                    <span style={{ color: '#374151', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{value.slice(0,8)}…{value.slice(-6)}</span>
                  )}
                </div>
              ))}

              {/* Actions */}
              <div style={{ marginTop: 22 }}>

                {/* Not connected */}
                {!account && selected.status !== 'Completed' && selected.status !== 'Rejected' && selected.status !== 'Expired' && (
                  <div style={{ padding: 16, borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd', textAlign: 'center' }}>
                    <p style={{ color: '#374151', fontSize: 13, margin: '0 0 12px' }}>Connect your wallet to perform actions on this job</p>
                    <button onClick={connectWallet} style={{ padding: '8px 20px', borderRadius: 10, background: '#5b8af7', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Connect Wallet
                    </button>
                  </div>
                )}

                {/* Provider: Submit Work */}
                {account && isProvider && selected.status === 'Funded' && txStep === 'idle' && (
                  <div style={{ padding: 18, borderRadius: 12, background: '#fef9f0', border: '1px solid #fcd34d' }}>
                    <p style={{ color: '#92400e', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>📤 Submit Your Work</p>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
                      You are the provider. Submit a deliverable (URL, hash, or description) — it will be hashed and stored on-chain.
                    </p>
                    <input
                      value={deliverable} onChange={e => setDeliverable(e.target.value)}
                      placeholder="https://… or describe your deliverable"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }}
                    />
                    {txError && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 10px' }}>{txError}</p>}
                    <button onClick={() => submitWork(selected)} disabled={!deliverable.trim()}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, background: !deliverable.trim() ? '#f3f4f8' : '#d97706', color: !deliverable.trim() ? '#9ca3af' : '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: !deliverable.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      Submit Work →
                    </button>
                  </div>
                )}

                {/* Evaluator: Approve & Pay */}
                {account && isEvaluator && selected.status === 'Submitted' && txStep === 'idle' && (
                  <div style={{ padding: 18, borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac' }}>
                    <p style={{ color: '#065f46', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>✅ Approve & Release Payment</p>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
                      You are the evaluator. Approving releases <strong style={{ color: '#059669' }}>{selected.budgetUSDC.toFixed(2)} USDC</strong> from escrow to the provider.
                    </p>
                    {txError && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 10px' }}>{txError}</p>}
                    <button onClick={() => completeJob(selected)}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#059669', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(5,150,105,.3)' }}>
                      Approve & Pay {selected.budgetUSDC.toFixed(2)} USDC →
                    </button>
                  </div>
                )}

                {/* Tx in progress */}
                {(txStep === 'signing' || txStep === 'confirming') && (
                  <div style={{ padding: 18, borderRadius: 12, background: '#eff6ff', border: '1px solid #93c5fd', textAlign: 'center' }}>
                    <p style={{ color: '#5b8af7', fontSize: 14, fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                      {txStep === 'signing' ? 'Waiting for signature…' : 'Confirming on Arc Testnet…'}
                    </p>
                    {txHash && <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}>{txHash.slice(0,20)}… ↗</a>}
                  </div>
                )}

                {/* Done */}
                {txStep === 'done' && (
                  <div style={{ padding: 18, borderRadius: 12, background: '#f0fdf4', border: '1px solid #86efac', textAlign: 'center' }}>
                    <p style={{ color: '#059669', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>✓ Transaction confirmed!</p>
                    <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer" style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>View on ArcScan ↗</a>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <a href={'https://testnet.arcscan.app/tx/' + selected.txHash} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '10px', borderRadius: 10, background: '#5b8af7', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 3px 10px rgba(91,138,247,.3)' }}>
                  View on ArcScan ↗
                </a>
                <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 48, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          ERC-8183 AgenticCommerce · Arc Testnet · USDC Escrow Settlement
        </div>
      </main>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}
