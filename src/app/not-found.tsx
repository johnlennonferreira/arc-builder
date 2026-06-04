import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>Not Found</p>
        <h1 style={{ background: 'linear-gradient(135deg,#5b8af7,#00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 80, fontWeight: 900, margin: '0 0 16px', lineHeight: 1 }}>
          404
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
          This agent or page does not exist<br />on the Arc Testnet registry.
        </p>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, background: '#5b8af7', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 12px rgba(91,138,247,.35)' }}>
          ← Back to Explorer
        </Link>
      </div>
    </main>
  )
}
