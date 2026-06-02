'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'

interface Event {
  type: string; icon: string; label: string; sub: string
  block: string; txHash: string; ts: number
}

const TYPE_COLOR: Record<string, string> = {
  job_created:       '#5b8af7',
  payment_released:  '#00d4aa',
  agent_registered:  '#f7a35b',
}

const POLL_INTERVAL = 15_000

export default function ActivityPage() {
  const [events,      setEvents]      = useState<Event[]>([])
  const [latestBlock, setLatestBlock] = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [newCount,    setNewCount]    = useState(0)
  const prevTopRef = useRef<string>('')

  async function fetchActivity() {
    try {
      const d = await fetch('/api/activity').then(r => r.json())
      const evts: Event[] = d.events ?? []
      setEvents(prev => {
        const topTx = evts[0]?.txHash ?? ''
        if (prev.length > 0 && topTx && prevTopRef.current && topTx !== prevTopRef.current) {
          const newOnes = evts.findIndex(e => e.txHash === prevTopRef.current)
          setNewCount(newOnes > 0 ? newOnes : 0)
        }
        prevTopRef.current = topTx
        return evts
      })
      setLatestBlock(d.latestBlock ?? '')
      setLastRefresh(new Date())
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchActivity()
    const t = setInterval(fetchActivity, POLL_INTERVAL)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear new count after 5s
  useEffect(() => {
    if (newCount > 0) { const t = setTimeout(() => setNewCount(0), 5000); return () => clearTimeout(t) }
  }, [newCount])

  const grouped = events.reduce((acc, e) => {
    const key = e.block
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, Event[]>)

  const blocks = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa', color: '#00d4aa' }} />
            <span style={{ color: '#00d4aa', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live · Arc Testnet</span>
            {newCount > 0 && (
              <span style={{ background: '#00d4aa', color: '#000', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>+{newCount} new</span>
            )}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>Activity Feed</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ color: '#555', fontSize: 14, margin: 0 }}>Real-time on-chain events: jobs, payments, agent registrations.</p>
            {lastRefresh && (
              <span style={{ color: '#333', fontSize: 12 }}>
                Updated {lastRefresh.toLocaleTimeString()} · Block {latestBlock}
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[['📋', 'Job Created', '#5b8af7'], ['💰', 'Payment Released', '#00d4aa'], ['🤖', 'Agent Registered', '#f7a35b']].map(([icon, label, color]) => (
            <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ fontSize: 12, color: color as string, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>
            <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 60 }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#f44336' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            Failed to load events. <button onClick={fetchActivity} style={{ color: '#5b8af7', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#555' }}>No recent events found in the last 2000 blocks.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {blocks.map(block => (
              <div key={block}>
                {/* Block label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 8px' }}>
                  <div style={{ height: 1, flex: 1, background: '#0d0d1a' }} />
                  <a href={`https://testnet.arcscan.app/block/${block}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#333', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Block #{block} ↗
                  </a>
                  <div style={{ height: 1, flex: 1, background: '#0d0d1a' }} />
                </div>
                {/* Events in this block */}
                {grouped[block].map((evt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', borderRadius: 10, marginBottom: 4, background: '#0d0d1a', border: '1px solid #1a1a28' }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{evt.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLOR[evt.type] ?? '#e8e8f0' }}>{evt.label}</div>
                      <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{evt.sub}</div>
                    </div>
                    <a href={`https://testnet.arcscan.app/tx/${evt.txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#333', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>
                      tx ↗
                    </a>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/leaderboard" style={{ color: '#5b8af7', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
            View Leaderboard →
          </Link>
        </div>
      </main>
    </div>
  )
}
