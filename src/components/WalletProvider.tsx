'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface WalletCtx {
  account:    string
  connecting: boolean
  showModal:  boolean
  connect:    () => void
  disconnect: () => void
}

const Ctx = createContext<WalletCtx>({
  account: '', connecting: false, showModal: false,
  connect: () => {}, disconnect: () => {},
})

export function useWallet() { return useContext(Ctx) }

interface WalletOption {
  id:    string
  name:  string
  icon:  string
  color: string
  check: () => boolean
}

const WALLETS: WalletOption[] = [
  {
    id: 'metamask', name: 'MetaMask', color: '#f6851b', icon: '🦊',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
  },
  {
    id: 'coinbase', name: 'Coinbase Wallet', color: '#0052ff', icon: '🔵',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isCoinbaseWallet,
  },
  {
    id: 'rabby', name: 'Rabby', color: '#7b5ea7', icon: '🐰',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isRabby,
  },
  {
    id: 'brave', name: 'Brave Wallet', color: '#fb542b', icon: '🦁',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check: () => typeof window !== 'undefined' && !!(window as any).ethereum?.isBraveWallet,
  },
  {
    id: 'browser', name: 'Browser Wallet', color: '#00d4aa', icon: '🌐',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    check: () => typeof window !== 'undefined' && !!(window as any).ethereum,
  },
]

async function switchToArc(eth: unknown) {
  const e = eth as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
  try {
    await e.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] })
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 4902) {
      await e.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4CE252', chainName: 'Arc Testnet',
          nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
          rpcUrls: ['https://rpc.testnet.arc.network'],
          blockExplorerUrls: ['https://testnet.arcscan.app'],
        }],
      })
    }
  }
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [account,    setAccount]    = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showModal,  setShowModal]  = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('arc_wallet')
    if (saved) setAccount(saved)
  }, [])

  const connectWith = useCallback(async (walletId: string) => {
    setConnecting(true)
    setShowModal(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      if (!eth) { alert('No wallet detected. Please install MetaMask.'); return }
      void walletId
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[]
      if (!accounts[0]) return
      await switchToArc(eth)
      setAccount(accounts[0])
      localStorage.setItem('arc_wallet', accounts[0])
    } catch { /* cancelled */ }
    finally { setConnecting(false) }
  }, [])

  const connect    = useCallback(() => setShowModal(true), [])
  const disconnect = useCallback(() => {
    setAccount(''); localStorage.removeItem('arc_wallet')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum
    if (!eth) return
    const handler = (accounts: string[]) => {
      if (!accounts.length) disconnect()
      else { setAccount(accounts[0]); localStorage.setItem('arc_wallet', accounts[0]) }
    }
    eth.on('accountsChanged', handler)
    return () => eth.removeListener('accountsChanged', handler)
  }, [disconnect])

  const detected = WALLETS.filter(w => w.check())

  return (
    <Ctx.Provider value={{ account, connecting, showModal, connect, disconnect }}>
      {children}

      {/* Wallet selection modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: 20,
              padding: '28px 24px', width: '100%', maxWidth: 380,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#e8e8f0', fontSize: 18, fontWeight: 800, margin: 0 }}>Connect Wallet</h2>
                <p style={{ color: '#555', fontSize: 12, margin: '4px 0 0' }}>Choose your wallet to connect to Arc Testnet</p>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>
                ✕
              </button>
            </div>

            {/* Wallet list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detected.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#555', fontSize: 14 }}>
                  No wallet detected.<br />
                  <a href="https://metamask.io" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#f6851b', textDecoration: 'none', fontWeight: 600 }}>
                    Install MetaMask →
                  </a>
                </div>
              ) : (
                detected.map(w => (
                  <button
                    key={w.id}
                    onClick={() => connectWith(w.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3a',
                      transition: 'all 0.15s', textAlign: 'left', width: '100%',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.borderColor = w.color + '55'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                      e.currentTarget.style.borderColor = '#2a2a3a'
                    }}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{w.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#e8e8f0', fontSize: 15, fontWeight: 600, margin: 0 }}>{w.name}</p>
                      <p style={{ color: '#555', fontSize: 11, margin: '2px 0 0' }}>
                        {w.id === 'browser' && detected.length > 1 ? 'Generic browser wallet' : 'Detected'}
                      </p>
                    </div>
                    <span style={{ color: w.color, fontSize: 18 }}>→</span>
                  </button>
                ))
              )}
            </div>

            {/* Arc Testnet info */}
            <div style={{
              marginTop: 20, padding: '12px 16px', borderRadius: 12,
              background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 5px #00d4aa', flexShrink: 0 }} />
              <p style={{ color: '#3a6655', fontSize: 12, margin: 0, lineHeight: 1.4 }}>
                Will connect to <strong style={{ color: '#00d4aa' }}>Arc Testnet</strong> (Chain ID 5042002). Gas is paid in USDC.
              </p>
            </div>

            <p style={{ color: '#2a2a3a', fontSize: 11, textAlign: 'center', margin: '16px 0 0' }}>
              Need USDC? <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
                style={{ color: '#00d4aa', textDecoration: 'none' }}>Get test USDC →</a>
            </p>
          </div>
        </div>
      )}

      {connecting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ background: '#0d0d1a', border: '1px solid #2a2a3a', borderRadius: 16, padding: '28px 36px', textAlign: 'center' }}>
            <p style={{ color: '#00d4aa', fontSize: 24, margin: '0 0 12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</p>
            <p style={{ color: '#e8e8f0', fontSize: 14, margin: 0 }}>Connecting to Arc Testnet...</p>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
