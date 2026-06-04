'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'

interface NetworkData {
  latestBlock: string
  windowBlocks: number
  agents: {
    total: number; maxId: number; uniqueOwners: number
    reputedCount: number; totalFeedbacks: number
    perWindow: { window: string; count: number }[]
  }
  jobs: {
    total: number; totalPayments: number; totalUSDCPaid: number
    paidWorkers: number; perWindow: { window: string; count: number }[]
  }
  usdc: { totalSupply: number }
  topOwners: { address: string; count: number }[]
}

function BarChart({ data, color }: { data: { window: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div title={`${d.window}: ${d.count}`} style={{
            width: '100%',
            height: `${Math.max(4, (d.count / max) * 56)}px`,
            background: i === data.length - 1 ? color : color + '55',
            borderRadius: '4px 4px 0 0',
            transition: 'opacity 0.2s',
          }} />
          <span style={{ fontSize: 9, color: '#9ca3af' }}>{d.window}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, color = '#111827' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const str = String(value)
  const fontSize = str.length > 12 ? 16 : str.length > 9 ? 20 : str.length > 7 ? 24 : 28
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize, fontWeight: 800, color, lineHeight: 1.2, wordBreak: 'break-all' }}>{value}</div>
      {sub && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function addr(a: string) { return `${a.slice(0, 8)}…${a.slice(-6)}` }

export default function NetworkPage() {
  const [data,    setData]    = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetch('/api/network')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const card = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '22px 26px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280' }}>Arc Testnet · Network Health</span>
            {!loading && data && (
              <span style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                block #{Number(data.latestBlock).toLocaleString()}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.03em', color: '#111827' }}>Network Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Live stats across all Arc Testnet contracts — last {loading ? '…' : `~${(data?.windowBlocks ?? 0).toLocaleString()}`} blocks.
          </p>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626', fontSize: 14 }}>
            ⚠️ Failed to load network data. Please refresh.
          </div>
        )}

        {data && !loading && (
          <>
            {/* Row 1: Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
              <StatCard label="Total Agents"   value={data.agents.maxId > 0 ? `${data.agents.maxId.toLocaleString()}+` : data.agents.total.toLocaleString()} sub="registered on testnet" color="#5b8af7" />
              <StatCard label="Unique Owners"  value={data.agents.uniqueOwners.toLocaleString()} sub="distinct wallets" color="#5b8af7" />
              <StatCard label="Reputed Agents" value={data.agents.reputedCount.toLocaleString()} sub={`${data.agents.totalFeedbacks} feedbacks`} color="#059669" />
              <StatCard label="Total Jobs"     value={data.jobs.total.toLocaleString()} sub="ERC-8183 commerce" color="#111827" />
              <StatCard label="USDC Settled"   value={`$${data.jobs.totalUSDCPaid.toFixed(2)}`} sub={`${data.jobs.totalPayments} payments`} color="#d97706" />
              <StatCard label="USDC Supply"    value={
                data.usdc.totalSupply >= 1e9 ? `${(data.usdc.totalSupply/1e9).toFixed(1)}B`
                : data.usdc.totalSupply >= 1e6 ? `${(data.usdc.totalSupply/1e6).toFixed(1)}M`
                : data.usdc.totalSupply > 0 ? data.usdc.totalSupply.toLocaleString() : '—'
              } sub="testnet total" color="#111827" />
            </div>

            {/* Row 2: Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Agent Registrations</div>
                    <div style={{ color: '#111827', fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                      {data.agents.total.toLocaleString()} <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 400 }}>in window</span>
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa' }} />
                </div>
                <BarChart data={data.agents.perWindow} color="#00d4aa" />
              </div>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280' }}>Jobs Created</div>
                    <div style={{ color: '#111827', fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                      {data.jobs.total.toLocaleString()} <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 400 }}>in window</span>
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5b8af7' }} />
                </div>
                <BarChart data={data.jobs.perWindow} color="#5b8af7" />
              </div>
            </div>

            {/* Row 3: Commerce + Top Owners */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280', marginBottom: 16 }}>ERC-8183 Commerce</div>
                {[
                  { label: 'Jobs Posted',          value: data.jobs.total.toLocaleString() },
                  { label: 'Payments Released',    value: data.jobs.totalPayments.toLocaleString() },
                  { label: 'Total USDC Settled',   value: `$${data.jobs.totalUSDCPaid.toFixed(2)} USDC` },
                  { label: 'Paid Workers',         value: data.jobs.paidWorkers.toLocaleString() },
                  { label: 'Completion Rate',      value: data.jobs.total > 0 ? `${Math.round((data.jobs.totalPayments / data.jobs.total) * 100)}%` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f3f4f8' }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>{label}</span>
                    <span style={{ color: '#111827', fontSize: 14, fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280', marginBottom: 16 }}>Top Agent Owners</div>
                {data.topOwners.length === 0 ? (
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>No data</div>
                ) : data.topOwners.map(({ address, count }, i) => (
                  <div key={address} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #f3f4f8' }}>
                    <span style={{ color: '#9ca3af', fontSize: 12, width: 16, textAlign: 'center' }}>#{i + 1}</span>
                    <Link href={`/owner/${address}`} style={{ flex: 1, color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
                      {addr(address)}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: `${Math.round((count / (data.topOwners[0]?.count ?? 1)) * 60)}px`,
                        height: 4, borderRadius: 2, background: '#dbeafe',
                      }} />
                      <span style={{ color: '#5b8af7', fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contracts */}
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#6b7280', marginBottom: 16 }}>Arc Testnet Contracts</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {[
                  { name: 'IdentityRegistry (ERC-8004)',  address: '0x8004A818BFB912233c491871b3d84c89A494BD9e', color: '#059669' },
                  { name: 'ReputationRegistry (ERC-8004)', address: '0x8004B663056A597Dffe9eCcC1965A193B7388713', color: '#059669' },
                  { name: 'AgenticCommerce (ERC-8183)',   address: '0x0747EEf0706327138c69792bF28Cd525089e4583', color: '#5b8af7' },
                  { name: 'USDC Token',                  address: '0x3600000000000000000000000000000000000000', color: '#d97706' },
                ].map(({ name, address, color }) => (
                  <div key={address} style={{ padding: '12px 16px', borderRadius: 10, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                    <div style={{ color, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{name}</div>
                    <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}>
                      {address.slice(0, 18)}…{address.slice(-6)} ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 32, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          Arc Testnet · Data from last ~50k blocks · Refreshes on load
        </div>
      </main>
    </div>
  )
}
