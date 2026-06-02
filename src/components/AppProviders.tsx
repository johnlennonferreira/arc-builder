'use client'
import WalletProvider from '@/components/WalletProvider'
import ToastProvider from '@/components/Toast'
import type { ReactNode } from 'react'
export default function AppProviders({ children }: { children: ReactNode }) {
  return <WalletProvider><ToastProvider>{children}</ToastProvider></WalletProvider>
}
