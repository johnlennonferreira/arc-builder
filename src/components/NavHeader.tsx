'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/',        label: 'Agents'   },
  { href: '/jobs',    label: 'Jobs'     },
  { href: '/launch',  label: 'Register' },
  { href: '/network',  label: 'Network'  },
  { href: '/api-docs', label: 'API'      },
]

export default function NavHeader({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <header style={{
      borderBottom: '1px solid #13131f',
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(8,8,15,0.96)',
      backdropFilter: 'blur(16px)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 0', marginRight: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg,#00d4aa,#5b8af7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 13,
        }}>A</div>
        <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Arc Agent Explorer
        </Link>
      </div>

      <span style={{ color: '#2a2a3a', margin: '0 8px' }}>|</span>

      {/* Nav tabs */}
      <nav style={{ display: 'flex' }}>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              padding: '16px 12px',
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              color: active ? '#00d4aa' : '#555',
              borderBottom: active ? '2px solid #00d4aa' : '2px solid transparent',
              transition: 'color 0.15s',
            }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right slot */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        <span style={{
          background: 'rgba(0,212,170,0.1)',
          border: '1px solid rgba(0,212,170,0.25)',
          borderRadius: 20, padding: '2px 10px',
          color: '#00d4aa', fontSize: 11, fontWeight: 700,
        }}>Testnet</span>
        <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{
          padding: '5px 12px', borderRadius: 8,
          background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
          color: '#00d4aa', fontSize: 12, fontWeight: 600, textDecoration: 'none',
        }}>
          Get USDC
        </a>
      </div>
    </header>
  )
}
