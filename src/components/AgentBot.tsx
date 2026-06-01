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
  const [open, setOpen] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [clicks, setClicks] = useState(0)
  const [pulse, setPulse] = useState(true)
  const [stats, setStats] = useState<{ total: number; block: string } | null>(null)

  // Fetch live stats
  useEffect(() => {
    fetch('/api/agents?page=0&pageSize=1')
      .then(r => r.json())
      .then(d => {
        if (d.totalAgents) setStats({ total: d.totalAgents, block: '' })
      })
      .catch(() => {})
  }, [])

  // Pulse every 3s
  useEffect(() => {
    const t = setInterval(() => {
      setPulse(p => !p)
      setTimeout(() => setPulse(p => !p), 600)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Cycle message every 4s when open
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 4000)
    return () => clearInterval(t)
  }, [open])

  const handleClick = () => {
    setOpen(o => !o)
    setClicks(c => c + 1)
    setMsgIndex(prev => (prev + 1) % MESSAGES.length)
  }

  const msg = MESSAGES[msgIndex]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Popup panel */}
      {open && (
        <div
          style={{
            background: 'linear-gradient(145deg, #111118, #0e0e16)',
            border: '1px solid #1e1e30',
            borderRadius: '14px',
            padding: '16px',
            width: '220px',
            boxShadow: '0 8px 32px rgba(0,212,170,0.08), 0 0 0 1px rgba(0,212,170,0.06)',
            animation: 'fadeUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '28px', height: '28px',
              background: 'linear-gradient(135deg, #00d4aa, #5b8af7)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: '#fff',
            }}>A</div>
            <div>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, margin: 0 }}>Agent #0000</p>
              <p style={{ color: '#3a3a52', fontSize: '10px', margin: 0 }}>Explorer · Online</p>
            </div>
            <div style={{
              marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%',
              background: '#00d4aa',
              boxShadow: pulse ? '0 0 6px #00d4aa' : 'none',
              transition: 'box-shadow 0.3s',
            }} />
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#1a1a28', marginBottom: '12px' }} />

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <p style={{ color: '#00d4aa', fontSize: '15px', fontWeight: 700, margin: 0 }}>{stats.total.toLocaleString()}</p>
                <p style={{ color: '#3a3a52', fontSize: '9px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agents</p>
              </div>
              <div style={{ background: 'rgba(91,138,247,0.05)', border: '1px solid rgba(91,138,247,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <p style={{ color: '#7aa4f9', fontSize: '15px', fontWeight: 700, margin: 0 }}>5042002</p>
                <p style={{ color: '#3a3a52', fontSize: '9px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chain ID</p>
              </div>
            </div>
          )}

          {/* Live message */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid #1a1a28',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#00d4aa', fontSize: '14px', flexShrink: 0 }}>{msg.icon}</span>
            <p style={{ color: '#6b6a7e', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>{msg.text}</p>
          </div>

          {/* Clicks easter egg */}
          {clicks >= 5 && (
            <p style={{ color: '#2a2a3a', fontSize: '10px', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
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
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: open
            ? 'linear-gradient(135deg, #00d4aa, #5b8af7)'
            : 'linear-gradient(145deg, #111118, #0e0e16)',
          border: open ? 'none' : '1px solid #1e1e30',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: open
            ? '0 4px 20px rgba(0,212,170,0.3)'
            : '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: '20px', color: open ? '#fff' : '#5a5a72' }}>
          {open ? '×' : '◈'}
        </span>
        {/* Pulse dot */}
        {!open && (
          <div style={{
            position: 'absolute',
            top: '8px', right: '8px',
            width: '7px', height: '7px',
            borderRadius: '50%',
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
