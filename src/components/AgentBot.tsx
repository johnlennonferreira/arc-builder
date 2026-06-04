'use client'

import { useState, useEffect } from 'react'

const MESSAGES = [
  { text: 'Monitoring ERC-8004 registry...', icon: '◉' },
  { text: 'New agents registering every minute.', icon: '↑' },
  { text: 'Arc Testnet · Chain ID 5042002', icon: '⬡' },
  { text: 'Built on Arc. Open source.', icon: '⌥' },
  { text: 'Identity. Reputation. Commerce.', icon: '◈' },
  { text: 'ERC-8183 jobs settling in USDC.', icon: '◎' },
  { text: 'Sub-second finality. Always.', icon: '⚡' },
]

export default function AgentBot() {
  const [open,     setOpen]     = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [clicks,   setClicks]   = useState(0)
  const [pulse,    setPulse]    = useState(true)
  const [stats,    setStats]    = useState<{ total: number } | null>(null)

  useEffect(() => {
    fetch('/api/agents?page=0&pageSize=1')
      .then(r => r.json())
      .then(d => { if (d.totalAgents) setStats({ total: d.totalAgents }) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setPulse(p => !p)
      setTimeout(() => setPulse(p => !p), 600)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setMsgIndex(i => (i + 1) % MESSAGES.length), 4000)
    return () => clearInterval(t)
  }, [open])

  const handleClick = () => {
    setOpen(o => !o)
    setClicks(c => c + 1)
    setMsgIndex(prev => (prev + 1) % MESSAGES.length)
  }

  const msg = MESSAGES[msgIndex]

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      fontFamily: 'Inter, sans-serif',
    }}>
      {open && (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 18,
          width: 230,
          boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          animation: 'fadeUp 0.2s ease',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg,#5b8af7,#00d4aa)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14,
            }}>A</div>
            <div>
              <p style={{ color: '#111827', fontSize: 12, fontWeight: 700, margin: 0 }}>Agent #0000</p>
              <p style={{ color: '#6b7280', fontSize: 10, margin: 0 }}>Explorer · Online</p>
            </div>
            <div style={{
              marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
              background: '#00d4aa',
              boxShadow: pulse ? '0 0 6px #00d4aa' : 'none',
              transition: 'box-shadow 0.3s',
            }} />
          </div>

          <div style={{ height: 1, background: '#e5e7eb', marginBottom: 14 }} />

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <p style={{ color: '#5b8af7', fontSize: 15, fontWeight: 800, margin: 0 }}>{stats.total.toLocaleString()}</p>
                <p style={{ color: '#6b7280', fontSize: 9, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agents</p>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                <p style={{ color: '#059669', fontSize: 15, fontWeight: 800, margin: 0 }}>5042002</p>
                <p style={{ color: '#6b7280', fontSize: 9, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chain ID</p>
              </div>
            </div>
          )}

          {/* Message */}
          <div style={{
            background: '#f5f6fa', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: '#5b8af7', fontSize: 15, flexShrink: 0 }}>{msg.icon}</span>
            <p style={{ color: '#374151', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{msg.text}</p>
          </div>

          {clicks >= 5 && (
            <p style={{ color: '#9ca3af', fontSize: 10, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
              {clicks} interactions logged
            </p>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={handleClick}
        title="Agent #0000 · Explorer Bot"
        style={{
          width: 48, height: 48, borderRadius: 14,
          background: open ? '#5b8af7' : '#fff',
          border: open ? 'none' : '1px solid #e5e7eb',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 20px rgba(91,138,247,.4)' : '0 2px 12px rgba(0,0,0,.10)',
          transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 20, color: open ? '#fff' : '#5b8af7' }}>
          {open ? '×' : '◈'}
        </span>
        {!open && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            width: 7, height: 7, borderRadius: '50%',
            background: '#00d4aa',
            boxShadow: pulse ? '0 0 8px #00d4aa' : 'none',
            transition: 'box-shadow 0.3s',
          }} />
        )}
      </button>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
