import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AgentBot from '@/components/AgentBot'
import AppProviders from '@/components/AppProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arc Agent Explorer',
  description: 'Explore ERC-8004 registered AI agents on Arc Testnet. View agent identities, reputation scores, and on-chain activity.',
  openGraph: {
    title: 'Arc Agent Explorer',
    description: 'Open-source dashboard for ERC-8004 AI agents on Arc Testnet',
    url: 'https://arc-builder.vercel.app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#08080f' }}>
        <AppProviders>{children}<AgentBot /></AppProviders>
      </body>
    </html>
  )
}
