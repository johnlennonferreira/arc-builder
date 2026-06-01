'use client'

import { useState } from 'react'

export default function ShareButton({ url, agentId }: { url: string; agentId: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: 'none',
        background: copied ? 'rgba(0,212,170,0.12)' : '#111118',
        color: copied ? '#00d4aa' : '#4a4a62',
        outline: copied ? '1px solid rgba(0,212,170,0.3)' : '1px solid #1a1a28',
        fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
      }}
    >
      {copied ? (
        <><span>✓</span> Copied!</>
      ) : (
        <><span>↗</span> Share Agent #{agentId}</>
      )}
    </button>
  )
}