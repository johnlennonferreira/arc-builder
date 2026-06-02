'use client'

import Link from 'next/link'
import { parseAbi } from 'viem'
import { publicClient, USDC_ADDRESS } from '@/lib/arc'
import { useWallet } from '@/components/WalletProvider'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const LINKS = [
  { href: '/launch',       label: 'Register'     },
  { href: '/',             label: 'Agents'       },
  { href: '/jobs',         label: 'Jobs'         },
  { href: '/leaderboard',  label: 'Leaderboard'  },
  { href: '/activity',     label: 'Activity'     },
  { href: '/network',      label: 'Network'      },
  { href: '/api-docs',     label: 'API'          },
]

export default function NavHeader({ right }: { right?: React.ReactNode }) {
  const pathname = usePathname()
  const { account, connecting, connect, disconnect } = useWallet()
  const [balance, setBalance] = useState<string>('')

  useEffect(() => {
    if (!account) { setBalance(''); return }
    const abi = parseAbi(['function balanceOf(address) view returns (uint256)'])
    publicClient.readContract({ address: USDC_ADDRESS, abi, functionName: 'balanceOf', args: [account as `0x${string}`] })
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

          {account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,212,170,0.25)', background: 'rgba(0,212,170,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 4px #00d4aa', flexShrink: 0 }} />
                <span style={{ color: '#00d4aa', fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                  {account.slice(0,6)}...{account.slice(-4)}
                </span>
                {balance && (
                  <span style={{ color: '#3a5a50', fontSize: 10, whiteSpace: 'nowrap' }}>{balance} USDC</span>
                )}
              </div>
              <button
                onClick={disconnect}
                title="Disconnect wallet"
                style={{
                  padding: '4px 10px', background: 'rgba(244,67,54,0.1)', border: 'none',
                  borderLeft: '1px solid rgba(0,212,170,0.15)', color: '#f44336',
                  fontSize: 13, cursor: 'pointer', fontWeight: 700, lineHeight: 1,
                  height: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,67,54,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,67,54,0.1)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: connecting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                background: 'rgba(91,138,247,0.1)', border: '1px solid rgba(91,138,247,0.3)',
                color: '#5b8af7',
              }}
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
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
