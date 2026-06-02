'use client'

import NavHeader from '@/components/NavHeader'
import { useState, useEffect, use } from 'react'
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{ background: 'transparent', border: '1px solid #1a1a28', borderRadius: 5, padding: '2px 8px', color: copied ? '#00d4aa' : '#3a3a52', cursor: 'pointer', fontSize: 12 }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function AgentMiniCard({ agent }: { agent: Agent }) {
  const isIPFS = agent.metadataURI.startsWith('ipfs://')
  const isURL = agent.metadataURI.startsWith('http')
  const scoreColor = agent.reputationScore >= 80 ? '#00d4aa' : agent.reputationScore >= 50 ? '#7aa4f9' : agent.reputationScore > 0 ? '#f7a44f' : '#2a2a3a'

  return (
    <Link href={`/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 20, fontWeight: 700, margin: 0 }}>
            #{agent.id}
          </p>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            border: `1px solid ${scoreColor}40`, background: `${scoreColor}0d`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: scoreColor,
          }}>
            {agent.reputationScore > 0 ? agent.reputationScore : '-'}
          </div>
        </div>
        {agent.registeredAt && (
          <p style={{ color: '#3a3a52', fontSize: 11, margin: 0 }}>{agent.registeredAt}</p>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {isIPFS && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(91,138,247,0.08)', border: '1px solid rgba(91,138,247,0.2)', color: '#7aa4f9' }}>IPFS</span>}
          {isURL && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>URL</span>}
          {agent.reputationScore > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa' }}>Reputed</span>}
        </div>
        <span style={{ color: '#00d4aa', fontSize: 11, fontWeight: 500 }}>View details →</span>
      </div>
    </Link>
  )
}

function Skeleton() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="skeleton" style={{ height: 20, width: 70, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 10, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 10, width: '40%' }} />
    </div>
  )
}

export default function OwnerPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/agents?owner=${address}&page=0&pageSize=100&sort=newest`)
      .then(r => r.json())
      .then(({ agents }) => setAgents(agents ?? []))
      .catch(() => setError('Failed to load agents for this owner.'))
      .finally(() => setLoading(false))
  }, [address])

  const short = address.slice(0, 8) + '...' + address.slice(-6)
  const totalReputation = agents.reduce((sum, a) => sum + a.reputationScore, 0)
  const reputedCount = agents.filter(a => a.reputationScore > 0).length

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', fontFamily: 'Inter, sans-serif' }}>
      <NavHeader />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>Owner Profile</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9c7d4', fontSize: 'clamp(12px,2vw,16px)', fontWeight: 500, margin: 0, wordBreak: 'break-all', flex: 1 }}>
              {address}
            </p>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <CopyButton text={address} />
              <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer"
                style={{ border: '1px solid #1a1a28', borderRadius: 5, padding: '2px 8px', color: '#00d4aa', fontSize: 12, textDecoration: 'none' }}>
                ArcScan
              </a>
            </div>
          </div>
        </div>

        {!loading && agents.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Agents Found', value: agents.length.toString(), sub: 'last ~50k blocks' },
              { label: 'Reputed Agents', value: reputedCount.toString(), sub: reputedCount > 0 ? Math.round((reputedCount / agents.length) * 100) + '% of total' : 'no feedback yet' },
              { label: 'Total Reputation', value: totalReputation > 0 ? '+' + totalReputation : '-', sub: 'combined score' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 16 }}>
                <p style={{ color: '#3a3a52', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 22, fontWeight: 700, margin: 0 }}>{s.value}</p>
                <p style={{ color: '#2a2a3a', fontSize: 10, margin: '3px 0 0' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#f77a7a', margin: '0 0 12px' }}>{error}</p>
            <Link href="/" style={{ color: '#00d4aa', fontSize: 14, textDecoration: 'none' }}>Back to Explorer</Link>
          </div>
        )}

        {!loading && (
          <p style={{ color: '#2a2a3a', fontSize: 12, margin: '0 0 14px' }}>Showing agents minted by this address in the last ~50,000 blocks</p>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : agents.length === 0 && !error ? (
          <div className="card" style={{ padding: 56, textAlign: 'center' }}>
            <p style={{ color: '#3a3a52', fontSize: 15, margin: '0 0 8px' }}>No agents found for this address.</p>
            <p style={{ color: '#2a2a3a', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
              This owner may have agents outside the current 50k-block window.
            </p>
            <Link href="/" style={{ color: '#00d4aa', fontSize: 14, textDecoration: 'none' }}>Back to Explorer</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {agents.map(a => <AgentMiniCard key={a.id} agent={a} />)}
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #13131f', marginTop: 64 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#2a2a3a', fontSize: 12, margin: 0 }}>Owner: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{short}</span></p>
          <Link href="/" style={{ color: '#3a3a52', fontSize: 13, textDecoration: 'none' }}>Arc Agent Explorer</Link>
        </div>
      </footer>
    </main>
  )
}