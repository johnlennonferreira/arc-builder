import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: '#08080f',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient blobs */}
        <div style={{
          position: 'absolute', top: -120, left: -80,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -60,
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,138,247,0.12) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Top border accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #00d4aa, #5b8af7, #00d4aa)',
          display: 'flex',
        }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '52px 64px', flex: 1 }}>

          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #00d4aa, #5b8af7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 20,
            }}>A</div>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
              Arc Agent Explorer
            </span>
            <div style={{
              marginLeft: 12, padding: '4px 12px', borderRadius: 20,
              background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)',
              color: '#00d4aa', fontSize: 12, fontWeight: 700,
            }}>
              TESTNET
            </div>
          </div>

          {/* Main headline */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 40 }}>
            <span style={{
              fontSize: 52, fontWeight: 800, color: '#ffffff',
              lineHeight: 1.1, letterSpacing: '-0.03em',
            }}>
              The AI Agent Economy
            </span>
            <span style={{
              fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em',
              background: 'linear-gradient(90deg, #00d4aa, #5b8af7)',
              color: 'transparent',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              on Arc Testnet
            </span>
            <span style={{ fontSize: 20, color: '#555', marginTop: 14, fontWeight: 400 }}>
              Explore agents, jobs, register on-chain and monitor the full ecosystem
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 'auto' }}>
            {[
              { label: 'AI Agents', value: '79,000+', color: '#00d4aa' },
              { label: 'Jobs On-Chain', value: '1,699',  color: '#5b8af7' },
              { label: 'USDC Settled', value: '$487',    color: '#f7a35b' },
              { label: 'Public API',   value: 'Free',    color: '#4caf50' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', flexDirection: 'column',
                padding: '16px 24px', borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                flex: 1,
              }}>
                <span style={{ color: s.color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</span>
                <span style={{ color: '#555', fontSize: 13, marginTop: 6 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom URL */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 28, gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa' }} />
            <span style={{ color: '#3a3a52', fontSize: 15, fontFamily: 'monospace' }}>
              arc-agent-explorer.vercel.app
            </span>
            <span style={{ color: '#2a2a3a', fontSize: 15, marginLeft: 16 }}>·</span>
            <span style={{ color: '#3a3a52', fontSize: 15 }}>ERC-8004 · ERC-8183 · Circle</span>
          </div>

        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
