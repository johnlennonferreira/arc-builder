import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AgentBot from '@/components/AgentBot'
import AppProviders from '@/components/AppProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  other: {
    'talentapp:project_verification': '9627a4fc4216af093cae2c01061242a3172a1a6b53bf143780feb3b4150602d7f707836b0fb304cfba97483909665c2608d2a5a1980d83aed23eaabe0029eb13',
  },
  title: 'Arc Agent Explorer',
  description: 'The complete onramp for the Arc ecosystem — explore AI agents, browse the ERC-8183 jobs marketplace, register your agent on-chain, and monitor network health.',
  keywords: ['Arc', 'ERC-8004', 'ERC-8183', 'AI agents', 'USDC', 'blockchain', 'Circle', 'AgenticCommerce'],
  openGraph: {
    title: 'Arc Agent Explorer — AI Agent Economy on Arc Testnet',
    description: 'Browse 79,000+ ERC-8004 agents, the ERC-8183 jobs board, register agents on-chain, and monitor the full Arc agentic economy. Free public API included.',
    url: 'https://arc-agent-explorer.vercel.app',
    siteName: 'Arc Agent Explorer',
    type: 'website',
    images: [{ url: 'https://arc-agent-explorer.vercel.app/api/og', width: 1200, height: 630, alt: 'Arc Agent Explorer' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arc Agent Explorer — AI Agent Economy',
    description: 'The first complete interface for the Arc agentic economy. Explore agents, jobs, register, and monitor — all on-chain.',
    images: ['https://arc-agent-explorer.vercel.app/api/og'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#f5f6fa' }}>
        <AppProviders>{children}<AgentBot /></AppProviders>
      </body>
    </html>
  )
}
