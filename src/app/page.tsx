'use client'

import { useState, useEffect, useCallback } from 'react'
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

// ── Copy button ──────────────────────────────────────────────
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

// ── Mini chart ───────────────────────────────────────────────
function MiniChart({ data }: { data: ChartBar[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid #1a1a28', borderRadius: 14, padding: '20px 20px 14px', marginBottom: 24 }}>
      <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
        Registrations · last ~50k blocks
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              title={`${d.date}: ${d.count}`}
              style={{
                width: '100%',
                height: `${Math.max(4, (d.count / max) * 52)}px`,
                background: i === data.length - 1
                  ? 'linear-gradient(180deg,#00d4aa,#5b8af7)'
                  : 'rgba(91,138,247,0.25)',
                borderRadius: '3px 3px 0 0',
                transition: 'opacity 0.2s',
                cursor: 'default',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ color: '#2a2a3a', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>{data[0]?.date}</span>
        <span style={{ color: '#2a2a3a', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// ── Score badge ──────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#00d4aa' : score >= 50 ? '#7aa4f9' : score > 0 ? '#f7a44f' : '#2a2a3a'
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      border: `1px solid ${color}40`, background: `${color}0d`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color,
    }}>
      {score > 0 ? score : '—'}
    </div>
  )
}

// ── Agent card ───────────────────────────────────────────────
function AgentCard({ agent }: { agent: Agent }) {
  const short = `${agent.owner.slice(0, 6)}…${agent.owner.slice(-4)}`
  const isIPFS = agent.metadataURI.startsWith('ipfs://')
  const isURL = agent.metadataURI.startsWith('http')

  return (
    <Link href={`/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#2a2a3a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontFamily: 'Inter, sans-serif' }}>Agent</p>
            <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              #{agent.id}
            </p>
          </div>
          <ScoreBadge score={agent.reputationScore} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div>
            <p style={{ color: '#2a2a3a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', fontFamily: 'Inter, sans-serif' }}>Owner</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6b6a7e', fontSize: 12 }}>{short}</span>
              <CopyButton text={agent.owner} />
            </div>
          </div>
          {agent.registeredAt && (
            <div>
              <p style={{ color: '#2a2a3a', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px', fontFamily: 'Inter, sans-serif' }}>Registered</p>
              <p style={{ color: '#4a4a62', fontSize: 12, margin: 0, fontFamily: 'Inter, sans-serif' }}>{agent.registeredAt}</p>
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

// ── Skeleton ─────────────────────────────────────────────────
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

// ── Filter bar ───────────────────────────────────────────────
type Filter = 'all' | 'ipfs' | 'url' | 'reputed'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ipfs', label: 'IPFS' },
  { key: 'url', label: 'URL' },
  { key: 'reputed', label: 'Reputed' },
]

// ── Main ─────────────────────────────────────────────────────
export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [error, setError] = useState<string | null>(null)
  const [chart, setChart] = useState<ChartBar[]>([])

  const PAGE_SIZE = 20

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/agents?page=${page}&pageSize=${PAGE_SIZE}&filter=${filter}`)
      .then(r => r.json())
      .then(({ agents, total, totalAgents }) => {
        setAgents(agents ?? [])
        setTotal(total ?? 0)
        setTotalAgents(totalAgents ?? 0)
      })
      .catch(() => setError('Failed to connect to Arc Testnet.'))
      .finally(() => setLoading(false))
  }, [page, filter])

  useEffect(() => { load() }, [load])

  // Load chart once
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setChart(d.chart ?? []))
      .catch(() => { })
  }, [])

  const filtered = search
    ? agents.filter(a => a.id.includes(search) || a.owner.toLowerCase().includes(search.toLowerCase()))
    : agents

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main style={{ minHeight: '100vh', background: '#08080f' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #13131f', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,15,0.92)', backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>A</div>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0, lineHeight: 1 }}>Arc Agent Explorer</p>
              <p style={{ color: '#3a3a52', fontSize: 11, margin: 0 }}>ERC-8004 Identity Registry</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag tag-green">Testnet</span>
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
          <p style={{ color: '#4a4a62', fontSize: 15, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Browse all registered agents on the Arc Testnet ERC-8004 IdentityRegistry.
            View reputation scores, metadata, and on-chain activity.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Agents', value: loading ? '…' : totalAgents > 0 ? `${totalAgents.toLocaleString()}+` : total.toString(), sub: totalAgents > 0 ? 'total registered' : 'recent window' },
            { label: 'Network', value: 'Arc Testnet', sub: 'Chain ID 5042002' },
            { label: 'Standard', value: 'ERC-8004', sub: 'Agent Identity' },
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

        {/* Search + Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by Agent ID or owner address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 10, background: '#0e0e16', border: '1px solid #1a1a28', color: '#c9c7d4', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = '#2a2a45')}
            onBlur={e => (e.target.style.borderColor = '#1a1a28')}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => { setFilter(f.key); setPage(0) }}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: filter === f.key ? 'linear-gradient(135deg,#00d4aa,#5b8af7)' : '#111118',
                  color: filter === f.key ? '#fff' : '#3a3a52',
                  outline: filter !== f.key ? '1px solid #1a1a28' : 'none',
                  transition: 'all 0.15s',
                }}>
                {f.label}
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
          <p style={{ color: '#2a2a3a', fontSize: 13, margin: 0 }}>Built on Arc Testnet · Open source</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              ['GitHub', 'https://github.com/johnlennonferreira/arc-builder'],
              ['ArcScan', 'https://testnet.arcscan.app'],
              ['Docs', 'https://docs.arc.io'],
              ['Register Agent', 'https://docs.arc.io/arc/tutorials/register-your-first-ai-agent'],
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
