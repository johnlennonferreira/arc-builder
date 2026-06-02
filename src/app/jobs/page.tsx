'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'

interface Job {
  id: string
  client: string
  provider: string
  evaluator: string
  description: string
  budgetUSDC: number
  expiry: string
  status: string
  statusCode: number
  txHash: string
  blockNumber: string
}

const STATUS_COLOR: Record<string, string> = {
  Open:      '#00d4aa',
  Funded:    '#5b8af7',
  Submitted: '#f7a35b',
  Completed: '#4caf50',
  Rejected:  '#f44336',
  Expired:   '#888',
}

const STATUS_BG: Record<string, string> = {
  Open:      'rgba(0,212,170,0.12)',
  Funded:    'rgba(91,138,247,0.12)',
  Submitted: 'rgba(247,163,91,0.12)',
  Completed: 'rgba(76,175,80,0.12)',
  Rejected:  'rgba(244,67,54,0.12)',
  Expired:   'rgba(136,136,136,0.12)',
}

function addr(a: string) {
  if (!a || a === '0x') return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      color: STATUS_COLOR[status] ?? '#888',
      background: STATUS_BG[status] ?? 'rgba(136,136,136,0.1)',
      border: `1px solid ${STATUS_COLOR[status] ?? '#555'}33`,
      textTransform: 'uppercase',
    }}>
      {status}
    </span>
  )
}

type Filter = 'all' | 'open' | 'funded' | 'submitted' | 'completed'

export default function JobsPage() {
  const [jobs, setJobs]       = useState<Job[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>('all')
  const [page, setPage]       = useState(0)
  const pageSize = 20
  const [selected, setSelected] = useState<Job | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/jobs?filter=${filter}&page=${page}&pageSize=${pageSize}`)
      const data = await res.json()
      setJobs(data.jobs ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { setPage(0) }, [filter])

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'open',      label: 'Open' },
    { key: 'funded',    label: 'Funded' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <NavHeader />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5b8af7', boxShadow: '0 0 8px #5b8af7' }} />
            <span style={{ color: '#5b8af7', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ERC-8183 · AgenticCommerce</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
            Jobs Board
          </h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
            On-chain work marketplace for AI agents. Jobs are funded in USDC with automatic escrow settlement.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{
          background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12,
          padding: '16px 24px', marginBottom: 28, display: 'flex', gap: 32, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Jobs</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e8e8f0', marginTop: 2 }}>
              {loading ? '…' : total.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Showing</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#5b8af7', marginTop: 2 }}>
              {loading ? '…' : jobs.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contract</div>
            <a
              href="https://testnet.arcscan.app/address/0x0747EEf0706327138c69792bF28Cd525089e4583"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa', textDecoration: 'none', marginTop: 6, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}
            >
              0x0747…4583 ↗
            </a>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
            <span style={{ color: '#4caf50', fontSize: 12, fontWeight: 600 }}>Arc Testnet</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                background: filter === f.key ? '#5b8af7' : 'transparent',
                color: filter === f.key ? '#fff' : '#888',
                border: filter === f.key ? '1px solid #5b8af7' : '1px solid #2a2a3a',
              }}
            >
              {f.label}
            </button>
          ))}
          <a href="/jobs/create" style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#000', textDecoration: 'none', background: 'linear-gradient(135deg,#5b8af7,#00d4aa)' }}>
            + Post Job
          </a>
          <button onClick={fetchJobs} style={{ marginLeft: 8, padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid #2a2a3a', color: '#555', fontWeight: 600 }}>
            ↻ Refresh
          </button>
        </div>

        {/* Job list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⟳</div>
            Loading jobs from blockchain…
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            No jobs found for this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map(job => (
              <div
                key={job.id}
                onClick={() => setSelected(job)}
                style={{
                  background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12,
                  padding: '18px 22px', transition: 'border-color 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2a2a4a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a1a28')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>

                  {/* Left: ID + description */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#555' }}>
                        #{job.id}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <div style={{ fontSize: 14, color: '#c8c8da', lineHeight: 1.5, wordBreak: 'break-all' }}>
                      {job.description || <span style={{ color: '#444', fontStyle: 'italic' }}>No description</span>}
                    </div>
                  </div>

                  {/* Right: meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200, alignItems: 'flex-end' }}>
                    {/* Budget */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: job.budgetUSDC > 0 ? '#00d4aa' : '#555' }}>
                        {job.budgetUSDC > 0 ? `$${job.budgetUSDC.toFixed(2)}` : '—'}
                      </span>
                      {job.budgetUSDC > 0 && (
                        <span style={{ color: '#555', fontSize: 11, marginLeft: 4 }}>USDC</span>
                      )}
                    </div>

                    {/* Expiry */}
                    {job.expiry && (
                      <div style={{ fontSize: 11, color: '#555' }}>
                        Expires {job.expiry}
                      </div>
                    )}

                    {/* ArcScan link */}
                    <a
                      href={`https://testnet.arcscan.app/tx/${job.txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#3a3a52', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                      onClick={e => e.stopPropagation()}
                    >
                      tx ↗
                    </a>
                  </div>
                </div>

                {/* Addresses */}
                <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid #14141f', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client </span>
                    <Link
                      href={`/owner/${job.client}`}
                      style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
                    >
                      {addr(job.client)}
                    </Link>
                  </div>
                  <div>
                    <span style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Provider </span>
                    <Link
                      href={`/owner/${job.provider}`}
                      style={{ color: '#00d4aa', fontSize: 12, textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
                    >
                      {addr(job.provider)}
                    </Link>
                  </div>
                  {job.evaluator && job.evaluator !== '0x0000000000000000000000000000000000000000' && (
                    <div>
                      <span style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evaluator </span>
                      <span style={{ color: '#888', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                        {addr(job.evaluator)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: page === 0 ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid #2a2a3a', color: page === 0 ? '#333' : '#888',
              }}
            >
              ← Prev
            </button>
            <span style={{ color: '#555', fontSize: 13, display: 'flex', alignItems: 'center' }}>
              Page {page + 1} of {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * pageSize >= total}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: (page + 1) * pageSize >= total ? 'not-allowed' : 'pointer',
                background: 'transparent', border: '1px solid #2a2a3a',
                color: (page + 1) * pageSize >= total ? '#333' : '#888',
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Footer info */}
        {/* Detail panel */}
        {selected && (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: 16, padding: 28, maxWidth: 540, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span style={{ color: '#555', fontSize: 12 }}>Job </span>
                  <span style={{ color: '#e8e8f0', fontSize: 18, fontWeight: 800 }}>#{selected.id}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }}>×</button>
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
                    {selected.budgetUSDC > 0 ? ['$', selected.budgetUSDC.toFixed(2)].join('') : '—'}
                    {selected.budgetUSDC > 0 && <span style={{ fontSize: 12, color: '#555', marginLeft: 4 }}>USDC</span>}
                  </p>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#0a0a14', border: '1px solid #1a1a28' }}>
                  <p style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', margin: '0 0 4px' }}>Expires</p>
                  <p style={{ color: '#e8e8f0', fontSize: 15, fontWeight: 700, margin: 0 }}>{selected.expiry || '—'}</p>
                </div>
              </div>

              {[
                { label: 'Client',   value: selected.client,   link: true  },
                { label: 'Provider', value: selected.provider, link: true  },
                { label: 'Evaluator',value: selected.evaluator,link: false },
              ].filter(r => r.value && r.value !== '0x').map(({ label, value, link }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #14141f' }}>
                  <span style={{ color: '#444', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  {link ? (
                    <a href={'/owner/' + value} style={{ color: '#5b8af7', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                      {value.slice(0,8)}...{value.slice(-6)}
                    </a>
                  ) : (
                    <span style={{ color: '#888', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{value.slice(0,8)}...{value.slice(-6)}</span>
                  )}
                </div>
              ))}

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
          ERC-8183 AgenticCommerce · Arc Testnet · Data refreshes every 30s
        </div>
      </main>
    </div>
  )
}
