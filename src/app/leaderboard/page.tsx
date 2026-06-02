'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'

interface Provider { address: string; earned: number; jobs: number }
interface Client   { address: string; posted: number; spent: number }
interface Builder  { address: string; agents: number }
interface Stats    { totalPayments: number; totalUSDCPaid: number; totalJobsCreated: number; totalAgents: number }

function addr(a: string) { return a.slice(0, 6) + '…' + a.slice(-4) }

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 18 }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: 18 }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: 18 }}>🥉</span>
  return <span style={{ color: '#555', fontSize: 13, fontWeight: 700, width: 24, display: 'inline-block', textAlign: 'center' }}>#{rank}</span>
}

function Row({ rank, address, primary, primaryLabel, secondary, secondaryLabel }: {
  rank: number; address: string; primary: string; primaryLabel: string; secondary?: string; secondaryLabel?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #0d0d1a' }}>
      <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Medal rank={rank} />
      </div>
      <Link href={'/owner/' + address} style={{ flex: 1, color: '#5b8af7', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, textDecoration: 'none' }}>
        {addr(address)}
      </Link>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#00d4aa' }}>{primary}</div>
        <div style={{ fontSize: 11, color: '#555' }}>{primaryLabel}</div>
      </div>
      {secondary && (
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0' }}>{secondary}</div>
          <div style={{ fontSize: 11, color: '#555' }}>{secondaryLabel}</div>
        </div>
      )}
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 16, padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#e8e8f0', letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function LeaderboardPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [clients,   setClients]   = useState<Client[]>([])
  const [builders,  setBuilders]  = useState<Builder[]>([])
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setProviders(d.providers ?? []); setClients(d.clients ?? []); setBuilders(d.builders ?? []); setStats(d.stats ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f7a35b', boxShadow: '0 0 8px #f7a35b' }} />
            <span style={{ color: '#f7a35b', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Arc Testnet · ERC-8004 + ERC-8183</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>Leaderboard</h1>
          <p style={{ color: '#555', fontSize: 14, margin: 0 }}>Top builders, providers, and clients on Arc Testnet by on-chain activity.</p>
        </div>

        {/* Summary stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'USDC Paid Out',   value: `$${stats.totalUSDCPaid.toLocaleString()}`, color: '#00d4aa' },
              { label: 'Jobs Completed',  value: stats.totalPayments.toLocaleString(),        color: '#5b8af7' },
              { label: 'Jobs Created',    value: stats.totalJobsCreated.toLocaleString(),      color: '#f7a35b' },
              { label: 'Agents Registered', value: stats.totalAgents.toLocaleString(),         color: '#e8e8f0' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
            Loading on-chain data…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

            {/* Top Providers */}
            <Card title="Top Providers" icon="💼">
              {providers.length === 0
                ? <p style={{ color: '#555', fontSize: 13 }}>No data yet.</p>
                : providers.map((p, i) => (
                  <Row key={p.address} rank={i + 1} address={p.address}
                    primary={`$${p.earned.toFixed(2)}`} primaryLabel="USDC earned"
                    secondary={`${p.jobs}`} secondaryLabel="jobs done" />
                ))}
            </Card>

            {/* Top Clients */}
            <Card title="Top Clients" icon="📋">
              {clients.length === 0
                ? <p style={{ color: '#555', fontSize: 13 }}>No data yet.</p>
                : clients.map((c, i) => (
                  <Row key={c.address} rank={i + 1} address={c.address}
                    primary={`${c.posted}`} primaryLabel="jobs posted"
                    secondary={c.spent > 0 ? `$${c.spent.toFixed(2)}` : undefined} secondaryLabel="USDC spent" />
                ))}
            </Card>

            {/* Top Builders */}
            <Card title="Top Builders" icon="🤖">
              {builders.length === 0
                ? <p style={{ color: '#555', fontSize: 13 }}>No data yet.</p>
                : builders.map((b, i) => (
                  <Row key={b.address} rank={i + 1} address={b.address}
                    primary={`${b.agents}`} primaryLabel="agents registered" />
                ))}
            </Card>

          </div>
        )}

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/activity" style={{ color: '#5b8af7', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            View Live Activity Feed →
          </Link>
        </div>
      </main>
    </div>
  )
}
