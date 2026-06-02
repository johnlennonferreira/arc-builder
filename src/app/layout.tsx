import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AgentBot from '@/components/AgentBot'
import AppProviders from '@/components/AppProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arc Agent Explorer',
  description: 'The complete onramp for the Arc ecosystem — explore AI agents, browse the ERC-8183 jobs marketplace, register your agent on-chain, and monitor network health.',
  keywords: ['Arc', 'ERC-8004', 'ERC-8183', 'AI agents', 'USDC', 'blockchain', 'Circle', 'AgenticCommerce'],
  openGraph: {
    title: 'Arc Agent Explorer — AI Agent Economy on Arc Testnet',
    description: 'Browse 79,000+ ERC-8004 agents, the ERC-8183 jobs board, register agents on-chain, and monitor the full Arc agentic economy. Free public API included.',
    url: 'https://arc-agent-explorer.vercel.app',
    siteName: 'Arc Agent Explorer',
    type: 'website',
    images: [{ url: 'https://arc-agent-explorer.vercel.app/og-image.png', width: 1200, height: 630, alt: 'Arc Agent Explorer' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arc Agent Explorer — AI Agent Economy',
    description: 'The first complete interface for the Arc agentic economy. Explore agents, jobs, register, and monitor — all on-chain.',
    images: ['https://arc-agent-explorer.vercel.app/og-image.png'],
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
