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

const SC: Record<string, string> = {
  Open:'#00d4aa', Funded:'#5b8af7', Submitted:'#f7a35b',
  Completed:'#4caf50', Rejected:'#f44336', Expired:'#888',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: 'transparent', border: '1px solid #1a1a28', borderRadius: 5, padding: '2px 8px', color: copied ? '#00d4aa' : '#3a3a52', cursor: 'pointer', fontSize: 12 }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function AgentCard({ agent }: { agent: Agent }) {
  const isIPFS = agent.metadataURI.startsWith('ipfs://')
  const isURL  = agent.metadataURI.startsWith('http')
  const col    = agent.reputationScore >= 80 ? '#00d4aa' : agent.reputationScore >= 50 ? '#7aa4f9' : agent.reputationScore > 0 ? '#f7a44f' : '#2a2a3a'
  return (
    <Link href={'/agent/' + agent.id} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 20, fontWeight: 700, margin: 0 }}>{'#' + agent.id}</p>
          <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid ' + col + '40', background: col + '0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: col }}>
            {agent.reputationScore > 0 ? agent.reputationScore : '-'}
          </div>
        </div>
        {agent.registeredAt && <p style={{ color: '#3a3a52', fontSize: 11, margin: 0 }}>{agent.registeredAt}</p>}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {isIPFS && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(91,138,247,0.08)', border: '1px solid rgba(91,138,247,0.2)', color: '#7aa4f9' }}>IPFS</span>}
          {isURL  && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>URL</span>}
          {agent.reputationScore > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>Reputed</span>}
        </div>
        <span style={{ color: '#00d4aa', fontSize: 11, fontWeight: 500 }}>View details →</span>
      </div>
    </Link>
  )
}

export default function OwnerPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
  const [agents, setAgents]           = useState<Agent[]>([])
  const [jobs, setJobs]               = useState<Job[]>([])
  const [loading, setLoading]         = useState(true)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [tab, setTab]                 = useState<Tab>('agents')

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
    <main style={{ minHeight: '100vh', background: '#08080f', fontFamily: 'Inter, sans-serif' }}>
      <NavHeader />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Owner Profile</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9c7d4', fontSize: 'clamp(12px,2vw,16px)', fontWeight: 500, margin: 0, wordBreak: 'break-all', flex: 1 }}>{address}</p>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <CopyButton text={address} />
              <a href={'https://testnet.arcscan.app/address/' + address} target="_blank" rel="noopener noreferrer"
                style={{ border: '1px solid #1a1a28', borderRadius: 5, padding: '2px 8px', color: '#00d4aa', fontSize: 12, textDecoration: 'none' }}>ArcScan</a>
            </div>
          </div>
        </div>

        {!loading && agents.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Agents',    value: agents.length.toString(),           sub: 'last ~50k blocks' },
              { label: 'Reputed',   value: reputedCnt.toString(),              sub: reputedCnt > 0 ? Math.round((reputedCnt/agents.length)*100)+'%' : 'no feedback' },
              { label: 'Rep Score', value: totalRep > 0 ? '+'+totalRep : '—',  sub: 'combined' },
              { label: 'Jobs',      value: jobsLoading ? '...' : jobs.length.toString(), sub: 'as client/provider' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 16 }}>
                <p style={{ color: '#3a3a52', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 22, fontWeight: 700, margin: 0 }}>{s.value}</p>
                <p style={{ color: '#2a2a3a', fontSize: 10, margin: '3px 0 0' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && (agents.length > 0 || jobs.length > 0) && (
          <div style={{ display: 'flex', borderBottom: '1px solid #1a1a28', marginBottom: 20 }}>
            {([
              { key: 'agents' as Tab, label: 'Agents (' + agents.length + ')' },
              { key: 'jobs'   as Tab, label: 'Jobs ('   + jobs.length   + ')' },
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none', color: tab === key ? '#00d4aa' : '#555', borderBottom: tab === key ? '2px solid #00d4aa' : '2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === 'agents' && (
          <>
            {error && <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}><p style={{ color: '#f77a7a', margin: '0 0 12px' }}>{error}</p><Link href="/" style={{ color: '#00d4aa', fontSize: 14, textDecoration: 'none' }}>Back to Explorer</Link></div>}
            {loading && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>{[0,1,2,3,4,5].map(i => <div key={i} className="card" style={{ padding: 16 }}><div className="skeleton" style={{ height: 20, width: 70, marginBottom: 10 }} /><div className="skeleton" style={{ height: 10, width: '60%' }} /></div>)}</div>}
            {!loading && !error && agents.length === 0 && <div className="card" style={{ padding: 32, textAlign: 'center' }}><p style={{ color: '#3a3a52', fontSize: 14, margin: 0 }}>No agents found in the last ~50,000 blocks.</p></div>}
            {!loading && agents.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                {agents.map(a => <AgentCard key={a.id} agent={a} />)}
              </div>
            )}
          </>
        )}

        {tab === 'jobs' && (
          <>
            {jobsLoading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>Loading jobs...</div>}
            {!jobsLoading && jobs.length === 0 && <div className="card" style={{ padding: 32, textAlign: 'center' }}><p style={{ color: '#3a3a52', fontSize: 14, margin: 0 }}>No jobs found for this address.</p></div>}
            {!jobsLoading && jobs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {jobs.map(job => {
                  const isClient = job.client.toLowerCase() === address.toLowerCase()
                  const color = SC[job.status] ?? '#888'
                  return (
                    <div key={job.id} style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#555' }}>{'#' + job.id}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color, background: color+'18', border: '1px solid '+color+'33', textTransform: 'uppercase' }}>{job.status}</span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, color: isClient ? '#f7a35b' : '#5b8af7', background: isClient ? 'rgba(247,163,91,0.1)' : 'rgba(91,138,247,0.1)', border: isClient ? '1px solid rgba(247,163,91,0.3)' : '1px solid rgba(91,138,247,0.3)' }}>
                              {isClient ? 'as Client' : 'as Provider'}
                            </span>
                          </div>
                          <p style={{ color: '#c8c8da', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{job.description || '—'}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: job.budgetUSDC > 0 ? '#00d4aa' : '#555' }}>
                            {job.budgetUSDC > 0 ? job.budgetUSDC.toFixed(2) + ' USDC' : '—'}
                          </div>
                          {job.expiry && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{job.expiry}</div>}
                          <a href={'https://testnet.arcscan.app/tx/' + job.txHash} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#3a3a52', textDecoration: 'none' }}>tx</a>
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
