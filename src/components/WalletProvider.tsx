'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface WalletCtx {
  account: string
  connecting: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const Ctx = createContext<WalletCtx>({ account: '', connecting: false, connect: async () => {}, disconnect: () => {} })

export function useWallet() { return useContext(Ctx) }

export default function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount]     = useState('')
  const [connecting, setConnecting] = useState(false)

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('arc_wallet')
    if (saved) setAccount(saved)
  }, [])

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      if (!eth) { alert('Please install MetaMask to connect.'); return }
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
      if (!accounts[0]) return
      // Switch to Arc Testnet
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] })
      } catch (e: unknown) {
        if ((e as { code?: number }).code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x4CE252', chainName: 'Arc Testnet', nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 }, rpcUrls: ['https://rpc.testnet.arc.network'], blockExplorerUrls: ['https://testnet.arcscan.app'] }],
          })
        }
      }
      setAccount(accounts[0])
      localStorage.setItem('arc_wallet', accounts[0])
    } catch { /* cancelled */ }
    finally { setConnecting(false) }
  }, [])

  const disconnect = useCallback(() => {
    setAccount('')
    localStorage.removeItem('arc_wallet')
  }, [])

  // Listen for account changes in MetaMask
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum
    if (!eth) return
    const handler = (accounts: string[]) => {
      if (accounts.length === 0) { disconnect() }
      else { setAccount(accounts[0]); localStorage.setItem('arc_wallet', accounts[0]) }
    }
    eth.on('accountsChanged', handler)
    return () => eth.removeListener('accountsChanged', handler)
  }, [disconnect])

  return <Ctx.Provider value={{ account, connecting, connect, disconnect }}>{children}</Ctx.Provider>
}
