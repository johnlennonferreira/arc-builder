'use client'

import { useState, useEffect } from 'react'
import { fetchAgents, type Agent } from '@/lib/arc'

function AgentCard({ agent }: { agent: Agent }) {
  const shortId = agent.id
  const shortOwner = `${agent.owner.slice(0, 6)}...${agent.owner.slice(-4)}`
  const shortURI = agent.metadataURI.length > 40
    ? `${agent.metadataURI.slice(0, 40)}...`
    : agent.metadataURI
  const explorerUrl = `https://testnet.arcscan.app/token/0x8004A818BFB912233c491871b3d84c89A494BD9e/instance/${shortId}`
  const score = agent.reputationScore
  const scoreColor = score >= 80 ? '#00d4aa' : score >= 60 ? '#4f8ef7' : '#f7a44f'

  return (
    <div className="arc-card p-5 hover:border-[#00d4aa40] transition-all duration-200 hover:shadow-lg hover:shadow-[#00d4aa10]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-[#6b6580] font-mono">AGENT</span>
          <h3 className="arc-gradient-text text-2xl font-bold">#{shortId}</h3>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: `${scoreColor}20`, border: `1px solid ${scoreColor}40`, color: scoreColor }}
        >
          {score}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <span className="text-xs text-[#6b6580]">Owner</span>
          <p className="font-mono text-sm text-[#c7c5d1]">{shortOwner}</p>
        </div>
        <div>
          <span className="text-xs text-[#6b6580]">Metadata</span>
          <p className="font-mono text-xs text-[#6b6580] truncate">{shortURI}</p>
        </div>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-[#00d4aa] hover:text-[#4f8ef7] transition-colors"
      >
        View on ArcScan
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </a>
    </div>
  )
}

function StatsBar({ total, loading }: { total: number; loading: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: 'Total Agents', value: loading ? '...' : total.toLocaleString() },
        { label: 'Network', value: 'Arc Testnet' },
        { label: 'Standard', value: 'ERC-8004' },
      ].map((stat) => (
        <div key={stat.label} className="arc-card p-4 text-center">
          <p className="text-xs text-[#6b6580] mb-1">{stat.label}</p>
          <p className="arc-gradient-text text-xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 20

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchAgents(page, PAGE_SIZE)
      .then(({ agents, total }) => {
        setAgents(agents)
        setTotal(total)
      })
      .catch(() => setError('Failed to connect to Arc Testnet. Please try again.'))
      .finally(() => setLoading(false))
  }, [page])

  const filtered = search
    ? agents.filter((a) => a.id.toString().includes(search) || a.owner.toLowerCase().includes(search.toLowerCase()))
    : agents

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <header className="border-b border-[#1e1e2e] sticky top-0 z-10" style={{ backgroundColor: '#0a0a0fee', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4aa, #4f8ef7)' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Arc Agent Explorer</h1>
              <span className="text-xs text-[#6b6580]">ERC-8004 Identity Registry</span>
            </div>
          </div>
          <span className="arc-badge">Testnet</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">
            Explore <span className="arc-gradient-text">AI Agents</span> on Arc
          </h2>
          <p className="text-[#6b6580] max-w-xl mx-auto">
            Browse all registered agents on the Arc Testnet ERC-8004 IdentityRegistry.
            View reputation scores, metadata, and on-chain activity.
          </p>
        </div>

        <StatsBar total={total} loading={loading} />

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by Agent ID or owner address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[#c7c5d1] placeholder-[#6b6580] outline-none focus:border-[#00d4aa] transition-colors font-mono text-sm"
            style={{ backgroundColor: '#13131a', border: '1px solid #1e1e2e' }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="arc-card p-6 text-center mb-6 border-red-900">
            <p className="text-red-400">{error}</p>
            <button onClick={() => { setPage(0) }} className="mt-3 text-sm text-[#00d4aa] hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="arc-card p-5 animate-pulse">
                <div className="h-3 w-16 bg-[#1e1e2e] rounded mb-3" />
                <div className="h-7 w-20 bg-[#1e1e2e] rounded mb-4" />
                <div className="h-3 w-full bg-[#1e1e2e] rounded mb-2" />
                <div className="h-3 w-3/4 bg-[#1e1e2e] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="arc-card p-12 text-center">
            <p className="text-[#6b6580] text-lg">No agents found</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-sm text-[#00d4aa] hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!search && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#13131a', border: '1px solid #1e1e2e', color: '#c7c5d1' }}
            >
              ← Previous
            </button>
            <span className="text-[#6b6580] text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
              style={{ backgroundColor: '#13131a', border: '1px solid #1e1e2e', color: '#c7c5d1' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2e] mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#6b6580] text-sm">
            Built on Arc Testnet • Open source
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a href="https://github.com/johnlennonferreira/arc-builder" target="_blank" rel="noopener noreferrer"
              className="text-[#6b6580] hover:text-[#00d4aa] transition-colors">
              GitHub
            </a>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
              className="text-[#6b6580] hover:text-[#00d4aa] transition-colors">
              ArcScan
            </a>
            <a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer"
              className="text-[#6b6580] hover:text-[#00d4aa] transition-colors">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
