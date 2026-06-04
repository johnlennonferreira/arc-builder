'use client'

import NavHeader from '@/components/NavHeader'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'

type Tab = 'agents' | 'jobs'

interface Agent {
  id: string; owner: string; metadataURI: string
  blockNumber: string; registeredAt: string; reputationScore: number; txHash: string
}
interface Job {
  id: string; client: string; provider: string; description: string
  budgetUSDC: number; expiry: string; status: string; txHash: string
}

const JOB_STATUS: Record<string, { color: string; bg: string; border: string }> = {
  Open:      { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  Funded:    { color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  Submitted: { color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  Completed: { color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
  Rejected:  { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
  Expired:   { color: '#374151', bg: '#f3f4f6', border: '#d1d5db' },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: copied ? '#f0fdf4' : '#fff', border: '1px solid ' + (copied ? '#86efac' : '#e5e7eb'), borderRadius: 6, padding: '3px 10px', color: copied ? '#059669' : '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const isIPFS = agent.metadataURI.startsWith('ipfs://')
  const isURL  = agent.metadataURI.startsWith('http')
  const score  = agent.reputationScore
  const scoreColor = score >= 80 ? '#059669' : score >= 50 ? '#5b8af7' : score > 0 ? '#d97706' : '#9ca3af'
  return (
    <Link href={'/agent/' + agent.id} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: '#5b8af7', fontSize: 20, fontWeight: 800, margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>#{agent.id}</p>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: scoreColor + '15', border: '1px solid ' + scoreColor + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: scoreColor }}>
            {score > 0 ? score : '—'}
          </div>
        </div>
        {agent.registeredAt && <p style={{ color: '#9ca3af', fontSize: 11, margin: 0 }}>{agent.registeredAt}</p>}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {isIPFS && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8' }}>IPFS</span>}
          {isURL  && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#d1fae5', color: '#065f46' }}>URL</span>}
          {score > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#d1fae5', color: '#065f46' }}>Reputed</span>}
        </div>
        <span style={{ color: '#5b8af7', fontSize: 11, fontWeight: 600 }}>View details →</span>
      </div>
    </Link>
  )
}

export default function OwnerPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
  const [agents,      setAgents]      = useState<Agent[]>([])
  const [jobs,        setJobs]        = useState<Job[]>([])
  const [loading,     setLoading]     = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [tab,         setTab]         = useState<Tab>('agents')

  useEffect(() => {
    setLoading(true)
    fetch('/api/agents?owner=' + address + '&page=0&pageSize=100&sort=newest')
      .then(r => r.json()).then(({ agents: a }) => setAgents(a ?? []))
      .catch(() => setError('Failed to load agents.')).finally(() => setLoading(false))
    Promise.all([
      fetch('/api/jobs?client='   + address + '&pageSize=50').then(r => r.json()),
      fetch('/api/jobs?provider=' + address + '&pageSize=50').then(r => r.json()),
    ]).then(([cd, pd]) => {
      const seen = new Set<string>()
      const all = [...(cd.jobs ?? []), ...(pd.jobs ?? [])].filter(j => {
        if (seen.has(j.id)) return false; seen.add(j.id); return true
      })
      setJobs(all)
    }).catch(() => {}).finally(() => setJobsLoading(false))
  }, [address])

  const totalRep   = agents.reduce((s, a) => s + a.reputationScore, 0)
  const reputedCnt = agents.filter(a => a.reputationScore > 0).length

  return (
    <main style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif' }}>
      <NavHeader />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Profile header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 8px' }}>Owner Profile</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#111827', fontSize: 'clamp(12px,2vw,15px)', fontWeight: 600, margin: 0, wordBreak: 'break-all', flex: 1 }}>{address}</p>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <CopyButton text={address} />
              <a href={'https://testnet.arcscan.app/address/' + address} target="_blank" rel="noopener noreferrer"
                style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 10px', color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontWeight: 600, background: '#fff' }}>ArcScan ↗</a>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && agents.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Agents',    value: agents.length.toString(),           sub: 'last ~50k blocks', color: '#5b8af7' },
              { label: 'Reputed',   value: reputedCnt.toString(),              sub: reputedCnt > 0 ? Math.round((reputedCnt/agents.length)*100)+'%' : 'no feedback', color: '#059669' },
              { label: 'Rep Score', value: totalRep > 0 ? '+'+totalRep : '—', sub: 'combined', color: '#d97706' },
              { label: 'Jobs',      value: jobsLoading ? '…' : jobs.length.toString(), sub: 'as client/provider', color: '#111827' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                <p style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 22, fontWeight: 800, margin: 0 }}>{s.value}</p>
                <p style={{ color: '#9ca3af', fontSize: 10, margin: '3px 0 0' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {!loading && (agents.length > 0 || jobs.length > 0) && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
            {([
              { key: 'agents' as Tab, label: 'Agents (' + agents.length + ')' },
              { key: 'jobs'   as Tab, label: 'Jobs ('   + jobs.length   + ')' },
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none', fontFamily: 'inherit', color: tab === key ? '#5b8af7' : '#6b7280', borderBottom: tab === key ? '2px solid #5b8af7' : '2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Agents tab */}
        {tab === 'agents' && (
          <>
            {error && <div style={{ padding: 24, textAlign: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, marginBottom: 20 }}><p style={{ color: '#dc2626', margin: '0 0 10px' }}>{error}</p><Link href="/" style={{ color: '#5b8af7', fontSize: 14 }}>Back to Explorer</Link></div>}
            {loading && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>{[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}</div>}
            {!loading && !error && agents.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14 }}>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>No agents found in the last ~50,000 blocks.</p>
              </div>
            )}
            {!loading && agents.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {agents.map(a => <AgentCard key={a.id} agent={a} />)}
              </div>
            )}
          </>
        )}

        {/* Jobs tab */}
        {tab === 'jobs' && (
          <>
            {jobsLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>Loading jobs…</div>}
            {!jobsLoading && jobs.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14 }}>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>No jobs found for this address.</p>
              </div>
            )}
            {!jobsLoading && jobs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {jobs.map(job => {
                  const isClient = job.client.toLowerCase() === address.toLowerCase()
                  const s = JOB_STATUS[job.status] ?? { color: '#374151', bg: '#f3f4f6', border: '#d1d5db' }
                  return (
                    <div key={job.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>#{job.id}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: s.color, background: s.bg, border: '1px solid ' + s.border, textTransform: 'uppercase' }}>{job.status}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: isClient ? '#92400e' : '#1d4ed8', background: isClient ? '#fef3c7' : '#dbeafe', border: isClient ? '1px solid #fcd34d' : '1px solid #93c5fd' }}>
                              {isClient ? 'as Client' : 'as Provider'}
                            </span>
                          </div>
                          <p style={{ color: '#374151', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{job.description || '—'}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: job.budgetUSDC > 0 ? '#059669' : '#9ca3af' }}>
                            {job.budgetUSDC > 0 ? job.budgetUSDC.toFixed(2) + ' USDC' : '—'}
                          </div>
                          {job.expiry && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{job.expiry}</div>}
                          <a href={'https://testnet.arcscan.app/tx/' + job.txHash} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'none' }}>tx ↗</a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}
