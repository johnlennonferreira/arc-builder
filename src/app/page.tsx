'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Agent {
  id: string
  owner: string
  metadataURI: string
  blockNumber: string
  registeredAt: string
  reputationScore: number
  txHash: string
}

interface ChartBar { date: string; count: number }
type Filter = 'all' | 'ipfs' | 'url' | 'reputed'
type Sort = 'newest' | 'oldest' | 'reputed'

// ── Copy button ───────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: 'transparent', border: '1px solid #1a1a28', borderRadius: 5, padding: '1px 6px', color: copied ? '#00d4aa' : '#3a3a52', cursor: 'pointer', fontSize: 11 }}
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}

// ── Animated counter ──────────────────────────────────────────
function AnimatedCounter({ target, loading }: { target: number; loading: boolean }) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (loading || target === 0 || started.current) return
    started.current = true
    const steps = 40
    const duration = 1200
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (step >= steps) { setValue(target); clearInterval(timer) }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target, loading])

  if (loading) return <>…</>
  return <>{value > 0 ? `${value.toLocaleString()}+` : target.toLocaleString()}</>
}

// ── Mini chart ────────────────────────────────────────────────
function MiniChart({ data }: { data: ChartBar[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid #1a1a28', borderRadius: 14, padding: '20px 20px 14px', marginBottom: 24 }}>
      <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
        Registrations · last ~50k blocks
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div title={`${d.date}: ${d.count}`} style={{
              width: '100%',
              height: `${Math.max(4, (d.count / max) * 52)}px`,
              background: i === data.length - 1 ? 'linear-gradient(180deg,#00d4aa,#5b8af7)' : 'rgba(91,138,247,0.25)',
              borderRadius: '3px 3px 0 0', transition: 'opacity 0.2s',
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ color: '#2a2a3a', fontSize: 10 }}>{data[0]?.date}</span>
        <span style={{ color: '#2a2a3a', fontSize: 10 }}>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// ── Score badge ───────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#00d4aa' : score >= 50 ? '#7aa4f9' : score > 0 ? '#f7a44f' : '#2a2a3a'
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, border: `1px solid ${color}40`, background: `${color}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color }}>
      {score > 0 ? score : '—'}
    </div>
  )
}

// ── Live block counter ────────────────────────────────────────
function LiveBlock({ block }: { block: string | null }) {
  const [pulse, setPulse] = useState(false)
  const prev = useRef(block)
  useEffect(() => {
    if (block && block !== prev.current) {
      prev.current = block
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }
  }, [block])
  if (!block || block === '0') return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa', boxShadow: pulse ? '0 0 8px #00d4aa' : 'none', transition: 'box-shadow 0.4s', flexShrink: 0 }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#3a3a52', fontSize: 12 }}>
        #{Number(block).toLocaleString()}
      </span>
    </div>
  )
}

// ── Recent registrations ticker ───────────────────────────────
function RecentTicker({ agents }: { agents: Agent[] }) {
  if (!agents.length) return null
  const recent = agents.slice(0, 5)
  return (
    <div style={{ background: 'rgba(0,212,170,0.03)', border: '1px solid rgba(0,212,170,0.08)', borderRadius: 10, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', flexWrap: 'wrap' }}>
      <span style={{ color: '#00d4aa', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Live</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        {recent.map((a, i) => (
          <Link key={a.id} href={`/agent/${a.id}`} style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: i === 0 ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${i === 0 ? 'rgba(0,212,170,0.2)' : '#1a1a28'}`,
              borderRadius: 6, padding: '3px 8px', fontSize: 12,
              color: i === 0 ? '#00d4aa' : '#3a3a52', fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.15s',
            }}>
              #{a.id}
            </span>
          </Link>
        ))}
      </div>
      <span style={{ color: '#2a2a3a', fontSize: 10, flexShrink: 0 }}>most recent</span>
    </div>
  )
}

// ── Agent card ────────────────────────────────────────────────
function AgentCard({ agent }: { agent: Agent }) {
  const short = `${agent.owner.slice(0, 6)}…${agent.owner.slice(-4)}`
  const isIPFS = agent.metadataURI.startsWith('ipfs://')
  const isURL = agent.metadataURI.startsWith('http')
  return (
    <Link href={`/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#2a2a3a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Agent</p>
            <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              #{agent.id}
            </p>
          </div>
          <ScoreBadge score={agent.reputationScore} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div>
            <p style={{ color: '#2a2a3a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Owner</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href={`/owner/${agent.owner}`} onClick={e => e.stopPropagation()}
                style={{ fontFamily: 'JetBrains Mono, monospace', color: '#5b8af7', fontSize: 12, textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.color = '#00d4aa')}
                onMouseOut={e => (e.currentTarget.style.color = '#5b8af7')}>
                {short}
              </Link>
              <CopyButton text={agent.owner} />
            </div>
          </div>
          {agent.registeredAt && (
            <div>
              <p style={{ color: '#2a2a3a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Registered</p>
              <p style={{ color: '#4a4a62', fontSize: 12, margin: 0 }}>{agent.registeredAt}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {isIPFS && <span className="tag tag-blue">IPFS</span>}
            {isURL && <span className="tag tag-green">URL</span>}
            {agent.reputationScore > 0 && <span className="tag tag-green">Reputed</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00d4aa', fontSize: 12, fontWeight: 500 }}>
          View details
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 8.5L8.5 1.5M8.5 1.5H4M8.5 1.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

// ── Skeleton ──────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="skeleton" style={{ height: 12, width: 48, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 24, width: 80, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 10, width: '100%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '60%' }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [latestBlock, setLatestBlock] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [error, setError] = useState<string | null>(null)
  const [chart, setChart] = useState<ChartBar[]>([])
  const [counts, setCounts] = useState({ ipfs: 0, url: 0, reputed: 0 })
  const searchRef = useRef<HTMLInputElement>(null)

  const PAGE_SIZE = 20

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault(); searchRef.current?.focus()
      }
      if (e.key === 'Escape') searchRef.current?.blur()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const load = useCallback(() => {
    setLoading(true); setError(null)
    fetch(`/api/agents?page=${page}&pageSize=${PAGE_SIZE}&filter=${filter}&sort=${sort}`)
      .then(r => r.json())
      .then(({ agents, total, totalAgents, latestBlock: lb, counts }) => {
        setAgents(agents ?? [])
        setTotal(total ?? 0)
        setTotalAgents(totalAgents ?? 0)
        if (lb) setLatestBlock(lb)
        if (counts) setCounts(counts)
      })
      .catch(() => setError('Failed to connect to Arc Testnet.'))
      .finally(() => setLoading(false))
  }, [page, filter, sort])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setInterval(() => {
      fetch('/api/agents?page=0&pageSize=1').then(r => r.json())
        .then(d => { if (d.latestBlock) setLatestBlock(d.latestBlock) }).catch(() => {})
    }, 10000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setChart(d.chart ?? [])).catch(() => {})
  }, [])

  const filtered = search
    ? agents.filter(a => a.id.includes(search) || a.owner.toLowerCase().includes(search.toLowerCase()))
    : agents

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main style={{ minHeight: '100vh', background: '#08080f' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #13131f', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,15,0.92)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>A</div>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0, lineHeight: 1 }}>Arc Agent Explorer</p>
              <p style={{ color: '#3a3a52', fontSize: 11, margin: 0 }}>ERC-8004 Identity Registry</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <LiveBlock block={latestBlock} />
            <span className="tag tag-green">Testnet</span>
            <a href="/jobs" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#5b8af7', border: '1px solid rgba(91,138,247,0.3)', textDecoration: 'none', background: 'rgba(91,138,247,0.08)' }}>
              Jobs Board
            </a>
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 12, fontWeight: 600, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.15)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.08)' }}>
              <span>💧</span> Get Test USDC
            </a>
            <a href="https://docs.arc.io/arc/tutorials/register-your-first-ai-agent" target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost" style={{ display: 'flex' }}>
              Register Agent ↗
            </a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.15 }}>
            Explore <span style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Agents</span> on Arc
          </h1>
          <p style={{ color: '#4a4a62', fontSize: 15, maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.7 }}>
            Browse all registered agents on the Arc Testnet ERC-8004 IdentityRegistry.
            View reputation scores, metadata, and on-chain activity.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              💧 Get Test USDC
            </a>
            <a href="https://docs.arc.io/arc/tutorials/register-your-first-ai-agent" target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 20px', borderRadius: 10, background: '#111118', border: '1px solid #1a1a28', color: '#6b6a7e', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Register Your Agent ↗
            </a>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            {
              label: 'Total Agents',
              value: <AnimatedCounter target={totalAgents || total} loading={loading} />,
              sub: totalAgents > 0 ? 'registered on testnet' : 'recent window',
            },
            {
              label: 'Reputed Agents',
              value: loading ? '…' : counts.reputed > 0 ? counts.reputed.toLocaleString() : '—',
              sub: counts.reputed > 0 && total > 0 ? `${Math.round((counts.reputed / total) * 100)}% of window` : 'with on-chain feedback',
            },
            {
              label: 'Latest Block',
              value: latestBlock && latestBlock !== '0' ? `#${Number(latestBlock).toLocaleString()}` : '…',
              sub: 'Arc Testnet · ~2s blocks',
            },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 16 }}>
              <p style={{ color: '#3a3a52', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 20, fontWeight: 700, margin: 0 }}>{s.value}</p>
              {s.sub && <p style={{ color: '#2a2a3a', fontSize: 10, margin: '3px 0 0' }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Chart */}
        {chart.length > 0 && <MiniChart data={chart} />}

        {/* Recent ticker */}
        {!loading && agents.length > 0 && <RecentTicker agents={agents} />}

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by Agent ID or owner address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 40px 10px 16px', borderRadius: 10, background: '#0e0e16', border: '1px solid #1a1a28', color: '#c9c7d4', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#2a2a45')}
              onBlur={e => (e.target.style.borderColor = '#1a1a28')}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#2a2a3a', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', pointerEvents: 'none' }}>/</span>
          </div>
        </div>

        {/* Filters + Sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              { key: 'all' as Filter, label: 'All', count: total },
              { key: 'ipfs' as Filter, label: 'IPFS', count: counts.ipfs },
              { key: 'url' as Filter, label: 'URL', count: counts.url },
              { key: 'reputed' as Filter, label: 'Reputed', count: counts.reputed },
            ]).map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setPage(0) }}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: filter === f.key ? 'linear-gradient(135deg,#00d4aa,#5b8af7)' : '#111118',
                  color: filter === f.key ? '#fff' : '#3a3a52',
                  outline: filter !== f.key ? '1px solid #1a1a28' : 'none',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {f.label}
                {!loading && f.count > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.7, background: filter === f.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ color: '#2a2a3a', fontSize: 11 }}>Sort:</span>
            {([
              { key: 'newest' as Sort, label: '↓ Newest' },
              { key: 'oldest' as Sort, label: '↑ Oldest' },
              { key: 'reputed' as Sort, label: '⭐ Reputed' },
            ]).map(s => (
              <button key={s.key} onClick={() => { setSort(s.key); setPage(0) }}
                style={{
                  padding: '7px 11px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: sort === s.key ? 'rgba(0,212,170,0.12)' : '#111118',
                  color: sort === s.key ? '#00d4aa' : '#3a3a52',
                  outline: sort !== s.key ? '1px solid #1a1a28' : '1px solid rgba(0,212,170,0.25)',
                  transition: 'all 0.15s',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 16, borderColor: '#2a1a1a' }}>
            <p style={{ color: '#f77a7a', margin: '0 0 12px' }}>{error}</p>
            <button onClick={load} className="btn btn-ghost">Try again</button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 56, textAlign: 'center' }}>
            <p style={{ color: '#3a3a52', fontSize: 15, margin: 0 }}>
              {search ? 'No agents match your search.' : filter !== 'all' ? 'No agents match this filter in the current window.' : 'No agents found.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {filtered.map(a => <AgentCard key={a.id} agent={a} />)}
          </div>
        )}

        {/* Pagination */}
        {!search && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="btn btn-ghost" style={{ opacity: page === 0 ? 0.3 : 1 }}>← Previous</button>
            <span style={{ color: '#3a3a52', fontSize: 13 }}>Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="btn btn-ghost" style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}>Next →</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #13131f', marginTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ color: '#2a2a3a', fontSize: 13, margin: 0 }}>Built on Arc Testnet · ERC-8004 · Open source</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              ['GitHub', 'https://github.com/johnlennonferreira/arc-builder'],
              ['ArcScan', 'https://testnet.arcscan.app'],
              ['Faucet', 'https://faucet.circle.com'],
              ['Docs', 'https://docs.arc.io'],
            ].map(([l, h]) => (
              <a key={l} href={h} target="_blank" rel="noopener noreferrer"
                style={{ color: '#3a3a52', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#00d4aa')}
                onMouseOut={e => (e.currentTarget.style.color = '#3a3a52')}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}