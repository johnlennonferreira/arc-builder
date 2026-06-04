'use client'

import Link from 'next/link'
import { parseAbi } from 'viem'
import { publicClient, USDC_ADDRESS } from '@/lib/arc'
import { useWallet } from '@/components/WalletProvider'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const LINKS = [
  { href: '/launch',       label: 'Register'    },
  { href: '/',             label: 'Agents'      },
  { href: '/jobs',         label: 'Jobs'        },
  { href: '/leaderboard',  label: 'Leaderboard' },
  { href: '/activity',     label: 'Activity'    },
  { href: '/network',      label: 'Network'     },
  { href: '/api-docs',     label: 'API'         },
]

export default function NavHeader({ right }: { right?: React.ReactNode }) {
  const pathname  = usePathname()
  const { account, connecting, connect, disconnect } = useWallet()
  const [balance, setBalance] = useState<string>('')

  useEffect(() => {
    if (!account) { setBalance(''); return }
    const abi = parseAbi(['function balanceOf(address) view returns (uint256)'])
    publicClient.readContract({ address: USDC_ADDRESS, abi, functionName: 'balanceOf', args: [account as `0x${string}`] })
      .then(bal => setBalance((Number(bal) / 1e6).toFixed(2)))
      .catch(() => setBalance(''))
  }, [account])

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      {/* ── Blue top bar ── */}
      <div style={{
        background: '#5b8af7',
        boxShadow: '0 2px 12px rgba(91,138,247,.35)',
        height: 58,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 12,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 15, flexShrink: 0,
          }}>A</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
            Arc Agent Explorer
          </span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {right}

          {/* Testnet pill */}
          <span style={{
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
            borderRadius: 20, padding: '3px 10px',
            color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          }}>TESTNET</span>

          {/* Wallet */}
          {account ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              borderRadius: 20, overflow: 'hidden',
              background: 'rgba(255,255,255,.15)',
              border: '1px solid rgba(255,255,255,.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                  {account.slice(0,6)}…{account.slice(-4)}
                </span>
                {balance && (
                  <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 10, whiteSpace: 'nowrap' }}>{balance} USDC</span>
                )}
              </div>
              <button
                onClick={disconnect}
                title="Disconnect"
                style={{
                  padding: '4px 10px', background: 'rgba(255,255,255,.15)',
                  border: 'none', borderLeft: '1px solid rgba(255,255,255,.2)',
                  color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 700,
                  lineHeight: 1, height: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.35)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.15)' }}
              >✕</button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: connecting ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)',
                color: '#fff', fontFamily: 'inherit',
              }}
            >
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>

      {/* ── White nav tabs ── */}
      <nav style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        padding: '0 12px',
      }}>
        {LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              padding: '11px 14px',
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              color: active ? '#5b8af7' : '#6b7280',
              borderBottom: active ? '2px solid #5b8af7' : '2px solid transparent',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#111827' }}
            onMouseOut={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
