'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NetworkData {
  latestBlock: string
  windowBlocks: number
  agents: {
    total: number
    maxId: number
    uniqueOwners: number
    reputedCount: number
    totalFeedbacks: number
    perWindow: { window: string; count: number }[]
  }
  jobs: {
    total: number
    totalPayments: number
    totalUSDCPaid: number
    paidWorkers: number
    perWindow: { window: string; count: number }[]
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
          <div
            title={`${d.window}: ${d.count}`}
            style={{
              width: '100%',
              height: `${Math.max(4, (d.count / max) * 56)}px`,
              background: i === data.length - 1 ? color : `${color}44`,
              borderRadius: '3px 3px 0 0',
              cursor: 'default',
              transition: 'opacity 0.2s',
            }}
          />
          <span style={{ fontSize: 9, color: '#3a3a52' }}>{d.window}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, color = '#e8e8f0' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ color: '#3a3a52', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function addr(a: string) {
  return `${a.slice(0, 8)}...${a.slice(-6)}`
}

export default function NetworkPage() {
  const [data, setData]     = useState<NetworkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    fetch('/api/network')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const nav = [
    { href: '/', label: 'Agents' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/launch', label: 'Register' },
    { href: '/network', label: 'Network', active: true },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>

      <header style={{ borderBottom: '1px solid #1a1a28', padding: '0 24px', background: '#0d0d1a', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#00d4aa', textDecoration: 'none', fontWeight: 700, fontSize: 15, padding: '16px 0', marginRight: 8 }}>Arc Agent Explorer</Link>
        <span style={{ color: '#2a2a3a', margin: '0 12px' }}>|</span>
        <nav style={{ display: 'flex', gap: 0 }}>
          {nav.map(({ href, label, active }) => (
            <Link key={href} href={href} style={{
              padding: '16px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              color: active ? '#f7a35b' : '#555',
              borderBottom: active ? '2px solid #f7a35b' : '2px solid transparent',
            }}>{label}</Link>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)', textDecoration: 'none', background: 'rgba(0,212,170,0.08)' }}>
            Get Test USDC
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 16px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f7a35b', boxShadow: '0 0 8px #f7a35b' }} />
            <span style={{ color: '#f7a35b', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Arc Testnet · Network Health</span>
            {!loading && data && (
              <span style={{ color: '#3a3a52', fontSize: 12, marginLeft: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                block #{Number(data.latestBlock).toLocaleString()}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Network Dashboard</h1>
          <p style={{ color: '#555', fontSize: 14, marginTop: 6 }}>
            Live stats across all Arc Testnet contracts — last {loading ? '...' : `~${(data?.windowBlocks ?? 0).toLocaleString()}`} blocks.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
            Fetching network data...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#f44336' }}>
            Failed to load network data. Please refresh.
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── Row 1: Key metrics ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <StatCard label="Total Agents" value={data.agents.maxId > 0 ? `${data.agents.maxId.toLocaleString()}+` : data.agents.total.toLocaleString()} sub="registered on testnet" color="#00d4aa" />
              <StatCard label="Unique Owners" value={data.agents.uniqueOwners.toLocaleString()} sub="distinct wallets" color="#00d4aa" />
              <StatCard label="Reputed Agents" value={data.agents.reputedCount.toLocaleString()} sub={`${data.agents.totalFeedbacks} feedbacks`} color="#5b8af7" />
              <StatCard label="Total Jobs" value={data.jobs.total.toLocaleString()} sub="ERC-8183 commerce" color="#5b8af7" />
              <StatCard label="USDC Settled" value={`$${data.jobs.totalUSDCPaid.toFixed(2)}`} sub={`${data.jobs.totalPayments} payments`} color="#f7a35b" />
              <StatCard label="USDC Supply" value={data.usdc.totalSupply > 0 ? `$${data.usdc.totalSupply.toLocaleString()}` : '—'} sub="testnet total" color="#f7a35b" />
            </div>

            {/* ── Row 2: Charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

              <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Agent Registrations</div>
                    <div style={{ color: '#e8e8f0', fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                      {data.agents.total.toLocaleString()} <span style={{ color: '#3a3a52', fontSize: 13, fontWeight: 400 }}>in window</span>
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 6px #00d4aa' }} />
                </div>
                <BarChart data={data.agents.perWindow} color="#00d4aa" />
              </div>

              <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jobs Created</div>
                    <div style={{ color: '#e8e8f0', fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                      {data.jobs.total.toLocaleString()} <span style={{ color: '#3a3a52', fontSize: 13, fontWeight: 400 }}>in window</span>
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5b8af7', boxShadow: '0 0 6px #5b8af7' }} />
                </div>
                <BarChart data={data.jobs.perWindow} color="#5b8af7" />
              </div>
            </div>

            {/* ── Row 3: Commerce + Top Owners ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

              {/* Commerce summary */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '24px' }}>
                <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>ERC-8183 Commerce</div>
                {[
                  { label: 'Jobs Posted', value: data.jobs.total.toLocaleString() },
                  { label: 'Payments Released', value: data.jobs.totalPayments.toLocaleString() },
                  { label: 'Total USDC Settled', value: `$${data.jobs.totalUSDCPaid.toFixed(2)} USDC` },
                  { label: 'Paid Workers', value: data.jobs.paidWorkers.toLocaleString() },
                  { label: 'Completion Rate', value: data.jobs.total > 0 ? `${Math.round((data.jobs.totalPayments / data.jobs.total) * 100)}%` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #14141f' }}>
                    <span style={{ color: '#555', fontSize: 13 }}>{label}</span>
                    <span style={{ color: '#e8e8f0', fontSize: 14, fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Top owners */}
              <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '24px' }}>
                <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Top Agent Owners</div>
                {data.topOwners.length === 0 ? (
                  <div style={{ color: '#333', fontSize: 13 }}>No data</div>
                ) : (
                  data.topOwners.map(({ address, count }, i) => (
                    <div key={address} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #14141f' }}>
                      <span style={{ color: '#3a3a52', fontSize: 12, width: 16, textAlign: 'center' }}>#{i + 1}</span>
                      <Link href={`/owner/${address}`} style={{ flex: 1, color: '#5b8af7', fontSize: 12, textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace" }}>
                        {addr(address)}
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: `${Math.round((count / (data.topOwners[0]?.count ?? 1)) * 60)}px`,
                          height: 4, borderRadius: 2, background: '#00d4aa44',
                        }} />
                        <span style={{ color: '#00d4aa', fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Contracts reference ── */}
            <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '24px' }}>
              <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Arc Testnet Contracts</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {[
                  { name: 'IdentityRegistry (ERC-8004)', address: '0x8004A818BFB912233c491871b3d84c89A494BD9e', color: '#00d4aa' },
                  { name: 'ReputationRegistry (ERC-8004)', address: '0x8004B663056A597Dffe9eCcC1965A193B7388713', color: '#00d4aa' },
                  { name: 'AgenticCommerce (ERC-8183)', address: '0x0747EEf0706327138c69792bF28Cd525089e4583', color: '#5b8af7' },
                  { name: 'USDC Token', address: '0x3600000000000000000000000000000000000000', color: '#f7a35b' },
                ].map(({ name, address, color }) => (
                  <div key={address} style={{ padding: '12px 16px', borderRadius: 8, background: '#0a0a14', border: '1px solid #1a1a28' }}>
                    <div style={{ color, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{name}</div>
                    <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3a3a52', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>
                      {address.slice(0, 18)}...{address.slice(-6)} ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', color: '#2a2a3a', fontSize: 12 }}>
          Arc Testnet · Data from last ~50k blocks · Refreshes on load
        </div>
      </main>
    </div>
  )
}
