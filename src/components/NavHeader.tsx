'use client'

import Link from 'next/link'
import { createPublicClient, http, parseAbi } from 'viem'
import { useWallet } from '@/components/WalletProvider'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const LINKS = [
  { href: '/',        label: 'Agents'   },
  { href: '/jobs',    label: 'Jobs'     },
  { href: '/launch',  label: 'Register' },
  { href: '/network',  label: 'Network'  },
  { href: '/api-docs', label: 'API'      },
]

export default function NavHeader({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname()
  const { account, connecting, connect, disconnect } = useWallet()
  const [balance, setBalance] = useState<string>('')

  useEffect(() => {
    if (!account) { setBalance(''); return }
    const USDC = '0x3600000000000000000000000000000000000000' as `0x${string}`
    const pub = createPublicClient({ chain: { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 }, rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } } } as Parameters<typeof createPublicClient>[0]['chain'], transport: http('https://rpc.testnet.arc.network') })
    const abi = parseAbi(['function balanceOf(address) view returns (uint256)'])
    pub.readContract({ address: USDC, abi, functionName: 'balanceOf', args: [account as `0x${string}`] })
      .then((bal) => setBalance((Number(bal) / 1e6).toFixed(2)))
      .catch(() => setBalance(''))
  }, [account])

  return (
    <header style={{
      borderBottom: '1px solid #13131f',
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(8,8,15,0.96)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', flex: 1, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>A</div>
          <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Arc Agent Explorer
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {right}
          <span style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 20, padding: '2px 8px', color: '#00d4aa', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>Testnet</span>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00d4aa', fontSize: 11, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            USDC
          </a>
        </div>
      </div>
      {/* Nav tabs row — scrollable on mobile */}
      <nav style={{ display: 'flex', overflowX: 'auto', borderTop: '1px solid #0d0d1a', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '0 8px' }}>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              padding: '10px 14px',
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              color: active ? '#00d4aa' : '#555',
              borderBottom: active ? '2px solid #00d4aa' : '2px solid transparent',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
