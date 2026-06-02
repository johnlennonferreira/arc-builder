import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: '#08080f', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ color: '#2a2a3a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Not Found</p>
        <h1 style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 72, fontWeight: 800, margin: '0 0 16px', lineHeight: 1 }}>
          404
        </h1>
        <p style={{ color: '#4a4a62', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
          This agent or page does not exist<br />on the Arc Testnet registry.
        </p>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
          ← Back to Explorer
        </Link>
      </div>
    </main>
  )
}