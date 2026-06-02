'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface WalletCtx {
  account:    string
  connecting: boolean
  connect:    () => Promise<void>
  disconnect: () => void
}

const Ctx = createContext<WalletCtx>({
  account: '', connecting: false,
  connect: async () => {}, disconnect: () => {},
})

export function useWallet() { return useContext(Ctx) }

async function switchToArc() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum
  if (!eth) return
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] })
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4CE252',
          chainName: 'Arc Testnet',
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

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem('arc_wallet')
    if (saved) setAccount(saved)
  }, [])

  // Standard MetaMask connect — triggers native browser popup
  const connect = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum
    if (!eth) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    setConnecting(true)
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' }) as string[]
      if (!accounts[0]) return
      await switchToArc()
      setAccount(accounts[0])
      localStorage.setItem('arc_wallet', accounts[0])
    } catch {
      // User rejected — do nothing
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount('')
    localStorage.removeItem('arc_wallet')
  }, [])

  // Sync when MetaMask account changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum
    if (!eth) return
    const onAccounts = (accounts: string[]) => {
      if (!accounts.length) disconnect()
      else { setAccount(accounts[0]); localStorage.setItem('arc_wallet', accounts[0]) }
    }
    const onChain = () => { /* just stay aware of chain changes */ }
    eth.on('accountsChanged', onAccounts)
    eth.on('chainChanged', onChain)
    return () => {
      eth.removeListener('accountsChanged', onAccounts)
      eth.removeListener('chainChanged', onChain)
    }
  }, [disconnect])

  return (
    <Ctx.Provider value={{ account, connecting, connect, disconnect }}>
      {children}
    </Ctx.Provider>
  )
}
