'use client'

import { useState, useEffect, useCallback } from 'react'

interface Agent {
  id: string
  owner: string
  metadataURI: string
  blockNumber: string
  registeredAt: string
  reputationScore: number
  txHash: string
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="btn btn-ghost" style={{ padding: '2px 7px', fontSize: '11px' }}>
      {copied ? '✓' : '⎘'}
    </button>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'score-high' : score >= 50 ? 'score-mid' : score > 0 ? 'score-low' : 'score-zero'
  const label = score > 0 ? score : '—'
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${cls}`}
      style={{
        borderColor: score >= 80 ? 'rgba(0,212,170,0.3)' : score >= 50 ? 'rgba(91,138,247,0.3)' : score > 0 ? 'rgba(247,164,79,0.3)' : 'rgba(58,58,82,0.5)',
        background: score >= 80 ? 'rgba(0,212,170,0.07)' : score >= 50 ? 'rgba(91,138,247,0.07)' : score > 0 ? 'rgba(247,164,79,0.07)' : 'rgba(20,20,30,0.5)',
      }}
    >
      {label}
    </div>
  )
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const shortOwner = `${agent.owner.slice(0, 6)}…${agent.owner.slice(-4)}`
  const isIPFS = agent.metadataURI.startsWith('ipfs://')
  const metaLabel = isIPFS ? 'IPFS' : agent.metadataURI ? 'URL' : 'None'
  const explorerUrl = `https://testnet.arcscan.app/token/0x8004A818BFB912233c491871b3d84c89A494BD9e/instance/${agent.id}`

  return (
    <div className="card p-5 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-[#3a3a52] tracking-widest uppercase font-semibold mb-0.5">Agent</p>
          <h3 className="gradient-text text-[22px] font-bold leading-none">#{agent.id}</h3>
        </div>
        <ScoreBadge score={agent.reputationScore} />
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-[10px] text-[#3a3a52] uppercase tracking-wider mb-1">Owner</p>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[13px] text-[#8a8a9e]">{shortOwner}</span>
            <CopyButton text={agent.owner} />
          </div>
        </div>

        {agent.registeredAt && (
          <div>
            <p className="text-[10px] text-[#3a3a52] uppercase tracking-wider mb-1">Registered</p>
            <p className="text-[13px] text-[#5a5a72]">{agent.registeredAt}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`tag ${isIPFS ? 'tag-blue' : agent.metadataURI ? 'tag-green' : 'tag-gray'}`}>
            {metaLabel}
          </span>
          {agent.reputationScore > 0 && (
            <span className="tag tag-green">Reputed</span>
          )}
        </div>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-[12px] text-[#00d4aa] hover:text-[#5b8af7] transition-colors font-medium"
      >
        View on ArcScan
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 8.5L8.5 1.5M8.5 1.5H4M8.5 1.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </a>
    </div>
  )
}

function AgentModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const explorerUrl = `https://testnet.arcscan.app/token/0x8004A818BFB912233c491871b3d84c89A494BD9e/instance/${agent.id}`
  const txUrl = agent.txHash ? `https://testnet.arcscan.app/tx/${agent.txHash}` : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}
      style={{ background: 'rgba(8,8,15,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-[#3a3a52] uppercase tracking-widest mb-1">Agent Identity</p>
            <h2 className="gradient-text text-3xl font-bold">#{agent.id}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost text-lg w-9 h-9 p-0 flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a28' }}>
            <p className="text-[10px] text-[#3a3a52] uppercase tracking-wider mb-2">Owner Address</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] text-[#8a8a9e] break-all">{agent.owner}</span>
              <CopyButton text={agent.owner} />
            </div>
          </div>

          {agent.metadataURI && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a28' }}>
              <p className="text-[10px] text-[#3a3a52] uppercase tracking-wider mb-2">Metadata URI</p>
              <p className="font-mono text-[11px] text-[#5a5a72] break-all">{agent.metadataURI}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a28' }}>
              <p className="text-[10px] text-[#3a3a52] uppercase tracking-wider mb-1">Reputation</p>
              <p className={`text-xl font-bold ${agent.reputationScore > 0 ? 'score-high' : 'score-zero'}`}>
                {agent.reputationScore > 0 ? agent.reputationScore : '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a28' }}>
              <p className="text-[10px] text-[#3a3a52] uppercase tracking-wider mb-1">Registered</p>
              <p className="text-sm text-[#6b6a7e]">{agent.registeredAt || '—'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1 justify-center">
            View on ArcScan ↗
          </a>
          {txUrl && (
            <a href={txUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Tx ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-[10px] text-[#3a3a52] uppercase tracking-widest mb-2">{label}</p>
      <p className="gradient-text text-xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-[#3a3a52] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [totalAgents, setTotalAgents] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Agent | null>(null)

  const PAGE_SIZE = 20

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/agents?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((r) => r.json())
      .then(({ agents, total, totalAgents }) => {
        setAgents(agents ?? [])
        setTotal(total ?? 0)
        setTotalAgents(totalAgents ?? 0)
      })
      .catch(() => setError('Failed to connect to Arc Testnet.'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? agents.filter((a) =>
        a.id.includes(search) ||
        a.owner.toLowerCase().includes(search.toLowerCase())
      )
    : agents

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#08080f' }}>
      {/* Modal */}
      {selected && <AgentModal agent={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <header style={{ borderBottom: '1px solid #13131f', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,8,15,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #5b8af7)' }}>A</div>
            <div>
              <p className="text-white font-semibold text-[15px] leading-none">Arc Agent Explorer</p>
              <p className="text-[11px] text-[#3a3a52] mt-0.5">ERC-8004 Identity Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="tag tag-green">Testnet</span>
            <a
              href="https://docs.arc.io/arc/tutorials/register-your-first-ai-agent"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost hidden sm:flex"
            >
              Register Agent ↗
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-[32px] sm:text-[42px] font-bold text-white mb-3 leading-tight">
            Explore <span className="gradient-text">AI Agents</span> on Arc
          </h1>
          <p className="text-[#4a4a62] max-w-lg mx-auto text-[15px] leading-relaxed">
            Browse all registered agents on the Arc Testnet ERC-8004 IdentityRegistry.
            View reputation scores, metadata, and on-chain activity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard
            label="Total Agents"
            value={loading ? '...' : totalAgents > 0 ? totalAgents.toLocaleString() : total.toString()}
            sub={totalAgents > 0 ? 'on-chain' : 'recent window'}
          />
          <StatCard label="Network" value="Arc Testnet" sub="Chain ID 5042002" />
          <StatCard label="Standard" value="ERC-8004" sub="Agent Identity" />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search by Agent ID or owner address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl font-mono text-[13px] outline-none transition-all"
            style={{
              background: '#0e0e16',
              border: '1px solid #1a1a28',
              color: '#c9c7d4',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2a2a45')}
            onBlur={(e) => (e.target.style.borderColor = '#1a1a28')}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a3a52] hover:text-[#6b6a7e] text-lg">
              ✕
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="card p-6 text-center mb-6" style={{ borderColor: '#2a1a1a' }}>
            <p className="text-[#f77a7a] mb-3">{error}</p>
            <button onClick={load} className="btn btn-ghost text-sm">Try again</button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-3 w-12 mb-3" />
                <div className="skeleton h-7 w-20 mb-5" />
                <div className="skeleton h-3 w-full mb-2" />
                <div className="skeleton h-3 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-14 text-center">
            <p className="text-[#3a3a52] text-[15px]">
              {search ? 'No agents match your search.' : 'No agents found in current block range.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!search && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="btn btn-ghost disabled:opacity-30">
              ← Previous
            </button>
            <span className="text-[#3a3a52] text-sm">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="btn btn-ghost disabled:opacity-30">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #13131f', marginTop: '64px' }}>
        <div className="max-w-6xl mx-auto px-4 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#2a2a3a] text-[13px]">Built on Arc Testnet · Open source</p>
          <div className="flex items-center gap-5 text-[13px]">
            {[
              { label: 'GitHub', href: 'https://github.com/johnlennonferreira/arc-builder' },
              { label: 'ArcScan', href: 'https://testnet.arcscan.app' },
              { label: 'Docs', href: 'https://docs.arc.io' },
              { label: 'Register Agent', href: 'https://docs.arc.io/arc/tutorials/register-your-first-ai-agent' },
            ].map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                className="text-[#3a3a52] hover:text-[#00d4aa] transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
