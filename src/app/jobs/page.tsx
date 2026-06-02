'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import { createWalletClient, createPublicClient, custom, http, parseAbi, keccak256, toBytes } from 'viem'
import { useWallet } from '@/components/WalletProvider'
import { useToast } from '@/components/Toast'

const ARC = {
  id: 5042002, name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
} as const

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

const STATUS_COLOR: Record<string, string> = {
  Open:'#00d4aa', Funded:'#5b8af7', Submitted:'#f7a35b',
  Completed:'#4caf50', Rejected:'#f44336', Expired:'#888',
}
const STATUS_BG: Record<string, string> = {
  Open:'rgba(0,212,170,0.12)', Funded:'rgba(91,138,247,0.12)', Submitted:'rgba(247,163,91,0.12)',
  Completed:'rgba(76,175,80,0.12)', Rejected:'rgba(244,67,54,0.12)', Expired:'rgba(136,136,136,0.12)',
}

function addr(a: string) {
  if (!a || a === '0x') return '—'
  return a.slice(0, 6) + '...' + a.slice(-4)
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: STATUS_COLOR[status] ?? '#888', background: STATUS_BG[status] ?? 'rgba(136,136,136,0.1)', border: '1px solid ' + (STATUS_COLOR[status] ?? '#555') + '33', textTransform: 'uppercase' }}>
      {status}
    </span>
  )
}

type Filter = 'all' | 'open' | 'funded' | 'submitted' | 'completed'
type TxStep = 'idle' | 'signing' | 'confirming' | 'done' | 'error'

export default function JobsPage() {
  const [jobs, setJobs]         = useState<Job[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<Filter>('all')
  const [page, setPage]         = useState(0)
  const [selected, setSelected] = useState<Job | null>(null)
  const [search, setSearch] = useState('')
  const pageSize = 20

  // Wallet from context
  const { account, connect: connectWallet, connecting } = useWallet()
  const { success, error: toastError, info } = useToast()

  // Action state
  const [deliverable, setDeliverable] = useState('')
  const [txStep, setTxStep]     = useState<TxStep>('idle')
  const [txHash, setTxHash]     = useState('')
  const [txError, setTxError]   = useState('')

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

  // Reset action state when modal closes
  useEffect(() => {
    if (!selected) { setDeliverable(''); setTxStep('idle'); setTxHash(''); setTxError('') }
  }, [selected])

  // connectWallet comes from useWallet() context above

  async function submitWork(job: Job) {
    if (!deliverable.trim()) { setTxError('Enter a deliverable description or URL.'); return }
    setTxError(''); setTxStep('signing')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      try { await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] }) } catch { /* ok */ }
      const wallet = createWalletClient({ account: account as `0x${string}`, chain: ARC, transport: custom(eth) })
      const pub    = createPublicClient({ chain: ARC, transport: http('https://rpc.testnet.arc.network') })
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
      const wallet = createWalletClient({ account: account as `0x${string}`, chain: ARC, transport: custom(eth) })
      const pub    = createPublicClient({ chain: ARC, transport: http('https://rpc.testnet.arc.network') })
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
    { key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'funded', label: 'Funded' },
    { key: 'submitted', label: 'Submitted' }, { key: 'completed', label: 'Completed' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

        {/* Hero + wallet */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5b8af7', boxShadow: '0 0 8px #5b8af7' }} />
              <span style={{ color: '#5b8af7', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ERC-8183 · AgenticCommerce</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Jobs Board</h1>
            <p style={{ color: '#888', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>On-chain work marketplace for AI agents. Funded in USDC with automatic escrow settlement.</p>
          </div>
          <div>
            {account ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4aa' }} />
                <span style={{ color: '#00d4aa', fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{addr(account)}</span>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={connecting}
                style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(91,138,247,0.1)', border: '1px solid rgba(91,138,247,0.3)', color: '#5b8af7', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {connecting ? 'Connecting...' : 'Connect Wallet to Act'}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '16px 24px', marginBottom: 28, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Jobs</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e8e8f0', marginTop: 2 }}>{loading ? '…' : total.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Showing</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5b8af7', marginTop: 2 }}>{loading ? '…' : jobs.length}</div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contract</div>
            <a href="https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa', textDecoration: 'none', marginTop: 6, display: 'block', fontFamily: 'JetBrains Mono, monospace' }}>
              0x0747…4583 ↗
            </a>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
            <span style={{ color: '#4caf50', fontSize: 12, fontWeight: 600 }}>Arc Testnet</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: filter === f.key ? '#5b8af7' : 'transparent', color: filter === f.key ? '#fff' : '#888', border: filter === f.key ? '1px solid #5b8af7' : '1px solid #2a2a3a' }}>
              {f.label}
            </button>
          ))}
          <Link href="/jobs/create" style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#000', textDecoration: 'none', background: 'linear-gradient(135deg,#5b8af7,#00d4aa)' }}>
            + Post Job
          </Link>
          <button onClick={fetchJobs} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid #2a2a3a', color: '#555', fontWeight: 600 }}>↻</button>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs..."
            style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, background: 'transparent', border: '1px solid #2a2a3a', color: '#e8e8f0', outline: 'none', width: 180 }}
          />
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⟳</div>Loading jobs from blockchain…
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>No jobs found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.filter(j => !search || j.description.toLowerCase().includes(search.toLowerCase()) || j.id.includes(search)).map(job => (
              <div key={job.id} onClick={() => setSelected(job)}
                style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '18px 22px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a4a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a28')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#555' }}>{'#' + job.id}</span>
                      <StatusBadge status={job.status} />
                      {account && (account.toLowerCase() === job.provider.toLowerCase()) && job.status === 'Funded' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: '#f7a35b', background: 'rgba(247,163,91,0.1)', border: '1px solid rgba(247,163,91,0.3)' }}>↑ Your action needed</span>
                      )}
                      {account && (account.toLowerCase() === job.client.toLowerCase() || account.toLowerCase() === job.evaluator.toLowerCase()) && job.status === 'Submitted' && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: '#4caf50', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)' }}>↑ Approve to release USDC</span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: '#c8c8da', lineHeight: 1.5, wordBreak: 'break-all' }}>
                      {job.description || <span style={{ color: '#444', fontStyle: 'italic' }}>No description</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: job.budgetUSDC > 0 ? '#00d4aa' : '#555' }}>
                      {job.budgetUSDC > 0 ? job.budgetUSDC.toFixed(2) : '—'}
                      {job.budgetUSDC > 0 && <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>USDC</span>}
                    </span>
                    {job.expiry && <span style={{ fontSize: 11, color: '#555' }}>Expires {job.expiry}</span>}
                    <a href={'https://testnet.arcscan.app/tx/' + job.txHash} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#3a3a52', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}
                      onClick={e => e.stopPropagation()}>tx ↗</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid #14141f', flexWrap: 'wrap' }}>
                  <div><span style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client </span>
                    <Link href={'/owner/' + job.client} style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }} onClick={e => e.stopPropagation()}>{addr(job.client)}</Link>
                  </div>
                  <div><span style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Provider </span>
                    <Link href={'/owner/' + job.provider} style={{ color: '#00d4aa', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }} onClick={e => e.stopPropagation()}>{addr(job.provider)}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer', background: 'transparent', border: '1px solid #2a2a3a', color: page === 0 ? '#333' : '#888' }}>← Prev</button>
            <span style={{ color: '#555', fontSize: 13, display: 'flex', alignItems: 'center' }}>Page {page+1} of {Math.ceil(total/pageSize)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={(page+1)*pageSize >= total}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (page+1)*pageSize >= total ? 'not-allowed' : 'pointer', background: 'transparent', border: '1px solid #2a2a3a', color: (page+1)*pageSize >= total ? '#333' : '#888' }}>Next →</button>
          </div>
        )}

        {/* Detail modal */}
        {selected && (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span style={{ color: '#555', fontSize: 12 }}>Job </span>
                  <span style={{ color: '#e8e8f0', fontSize: 18, fontWeight: 800 }}>{'#' + selected.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
              </div>

              {selected.description && (
                <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 10, background: '#0a0a14', border: '1px solid #1a1a28' }}>
                  <p style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Description</p>
                  <p style={{ color: '#c8c8da', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{selected.description}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#0a0a14', border: '1px solid #1a1a28' }}>
                  <p style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', margin: '0 0 4px' }}>Budget</p>
                  <p style={{ color: selected.budgetUSDC > 0 ? '#00d4aa' : '#555', fontSize: 22, fontWeight: 800, margin: 0 }}>
                    {selected.budgetUSDC > 0 ? selected.budgetUSDC.toFixed(2) + ' USDC' : '—'}
                  </p>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#0a0a14', border: '1px solid #1a1a28' }}>
                  <p style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', margin: '0 0 4px' }}>Expires</p>
                  <p style={{ color: '#e8e8f0', fontSize: 15, fontWeight: 700, margin: 0 }}>{selected.expiry || '—'}</p>
                </div>
              </div>

              {[
                { label: 'Client',    value: selected.client,    link: true },
                { label: 'Provider',  value: selected.provider,  link: true },
                { label: 'Evaluator', value: selected.evaluator, link: false },
              ].filter(r => r.value && r.value !== '0x').map(({ label, value, link }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #14141f' }}>
                  <span style={{ color: '#444', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  {link ? (
                    <a href={'/owner/' + value} style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }} onClick={e => e.stopPropagation()}>
                      {value.slice(0,8)}...{value.slice(-6)}
                    </a>
                  ) : (
                    <span style={{ color: '#888', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{value.slice(0,8)}...{value.slice(-6)}</span>
                  )}
                </div>
              ))}

              {/* ── ACTION PANEL ── */}
              <div style={{ marginTop: 24 }}>

                {/* Not connected */}
                {!account && selected.status !== 'Completed' && selected.status !== 'Rejected' && selected.status !== 'Expired' && (
                  <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(91,138,247,0.05)', border: '1px solid rgba(91,138,247,0.15)', textAlign: 'center' }}>
                    <p style={{ color: '#555', fontSize: 13, margin: '0 0 12px' }}>Connect your wallet to perform actions on this job</p>
                    <button onClick={connectWallet} style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(91,138,247,0.1)', border: '1px solid rgba(91,138,247,0.3)', color: '#5b8af7', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Connect Wallet
                    </button>
                  </div>
                )}

                {/* Provider: Submit Work (job is Funded) */}
                {account && isProvider && selected.status === 'Funded' && txStep === 'idle' && (
                  <div style={{ padding: '18px', borderRadius: 12, background: 'rgba(247,163,91,0.05)', border: '1px solid rgba(247,163,91,0.2)' }}>
                    <p style={{ color: '#f7a35b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>📤 Submit Your Work</p>
                    <p style={{ color: '#555', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
                      You are the provider. Submit a deliverable (URL, hash, or description) — it will be hashed and stored on-chain.
                    </p>
                    <input
                      value={deliverable} onChange={e => setDeliverable(e.target.value)}
                      placeholder="https://... or describe your deliverable"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, background: '#0a0a14', border: '1px solid #2a2a3a', color: '#e8e8f0', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }}
                      onFocus={e => { e.target.style.borderColor = '#f7a35b' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }}
                    />
                    {txError && <p style={{ color: '#f44336', fontSize: 12, margin: '0 0 10px' }}>{txError}</p>}
                    <button onClick={() => submitWork(selected)} disabled={!deliverable.trim()}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, background: !deliverable.trim() ? '#1a1a28' : 'linear-gradient(135deg,#f7a35b,#e8833a)', color: !deliverable.trim() ? '#555' : '#000', fontSize: 14, fontWeight: 700, border: 'none', cursor: !deliverable.trim() ? 'not-allowed' : 'pointer' }}>
                      Submit Work →
                    </button>
                  </div>
                )}

                {/* Evaluator/Client: Approve & Complete (job is Submitted) */}
                {account && isEvaluator && selected.status === 'Submitted' && txStep === 'idle' && (
                  <div style={{ padding: '18px', borderRadius: 12, background: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.2)' }}>
                    <p style={{ color: '#4caf50', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>✅ Approve & Release Payment</p>
                    <p style={{ color: '#555', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>
                      You are the evaluator. Approving this job releases <strong style={{ color: '#00d4aa' }}>{selected.budgetUSDC.toFixed(2)} USDC</strong> from escrow to the provider.
                    </p>
                    {txError && <p style={{ color: '#f44336', fontSize: 12, margin: '0 0 10px' }}>{txError}</p>}
                    <button onClick={() => completeJob(selected)}
                      style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#4caf50,#2e7d32)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Approve & Pay {selected.budgetUSDC.toFixed(2)} USDC →
                    </button>
                  </div>
                )}

                {/* Transaction in progress */}
                {(txStep === 'signing' || txStep === 'confirming') && (
                  <div style={{ padding: '18px', borderRadius: 12, background: 'rgba(91,138,247,0.05)', border: '1px solid rgba(91,138,247,0.15)', textAlign: 'center' }}>
                    <p style={{ color: '#5b8af7', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>
                      {txStep === 'signing' ? '⟳ Waiting for signature...' : '⟳ Confirming on Arc Testnet...'}
                    </p>
                    {txHash && <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer" style={{ color: '#3a3a52', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}>{txHash.slice(0,20)}... ↗</a>}
                  </div>
                )}

                {/* Done */}
                {txStep === 'done' && (
                  <div style={{ padding: '18px', borderRadius: 12, background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.25)', textAlign: 'center' }}>
                    <p style={{ color: '#4caf50', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>✓ Transaction confirmed!</p>
                    <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer" style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>View on ArcScan ↗</a>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <a href={'https://testnet.arcscan.app/tx/' + selected.txHash} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', color: '#000', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  View on ArcScan ↗
                </a>
                <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', borderRadius: 10, background: 'transparent', border: '1px solid #2a2a3a', color: '#555', fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 48, textAlign: 'center', color: '#2a2a3a', fontSize: 12 }}>
          ERC-8183 AgenticCommerce · Arc Testnet · USDC Escrow Settlement
        </div>
      </main>
    </div>
  )
}
