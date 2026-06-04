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
  return <span style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700, width: 24, display: 'inline-block', textAlign: 'center' }}>#{rank}</span>
}

function Row({ rank, address, primary, primaryLabel, secondary, secondaryLabel }: {
  rank: number; address: string; primary: string; primaryLabel: string; secondary?: string; secondaryLabel?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f8' }}>
      <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Medal rank={rank} />
      </div>
      <Link href={'/owner/' + address} style={{ flex: 1, color: '#5b8af7', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, textDecoration: 'none' }}>
        {addr(address)}
      </Link>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{primary}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>{primaryLabel}</div>
      </div>
      {secondary && (
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{secondary}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{secondaryLabel}</div>
        </div>
      )}
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111827' }}>{title}</h2>
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
  const [error,     setError]     = useState(false)

  function load() {
    setLoading(true); setError(false)
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setProviders(d.providers ?? []); setClients(d.clients ?? []); setBuilders(d.builders ?? []); setStats(d.stats ?? null) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280' }}>Arc Testnet · ERC-8004 + ERC-8183</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em', color: '#111827' }}>Leaderboard</h1>
            {!loading && (
              <button onClick={load} title="Refresh" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 10px', color: '#6b7280', cursor: 'pointer', fontSize: 14, marginBottom: 6, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>↻</button>
            )}
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Top builders, providers, and clients by on-chain activity.</p>
        </div>

        {/* Summary stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'USDC Paid Out',     value: `$${stats.totalUSDCPaid.toLocaleString()}`, color: '#059669' },
              { label: 'Jobs Completed',    value: stats.totalPayments.toLocaleString(),        color: '#5b8af7' },
              { label: 'Jobs Created',      value: stats.totalJobsCreated.toLocaleString(),      color: '#d97706' },
              { label: 'Agents Registered', value: stats.totalAgents.toLocaleString(),           color: '#111827' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            Failed to load leaderboard.{' '}
            <button onClick={load} style={{ color: '#5b8af7', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Retry</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <Card title="Top Providers" icon="💼">
              {providers.length === 0
                ? <p style={{ color: '#6b7280', fontSize: 13 }}>No data yet.</p>
                : providers.map((p, i) => (
                  <Row key={p.address} rank={i + 1} address={p.address}
                    primary={`$${p.earned.toFixed(2)}`} primaryLabel="USDC earned"
                    secondary={`${p.jobs}`} secondaryLabel="jobs done" />
                ))}
            </Card>
            <Card title="Top Clients" icon="📋">
              {clients.length === 0
                ? <p style={{ color: '#6b7280', fontSize: 13 }}>No data yet.</p>
                : clients.map((c, i) => (
                  <Row key={c.address} rank={i + 1} address={c.address}
                    primary={`${c.posted}`} primaryLabel="jobs posted"
                    secondary={c.spent > 0 ? `$${c.spent.toFixed(2)}` : undefined} secondaryLabel="USDC spent" />
                ))}
            </Card>
            <Card title="Top Builders" icon="🤖">
              {builders.length === 0
                ? <p style={{ color: '#6b7280', fontSize: 13 }}>No data yet.</p>
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
