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
        padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
        border: '1px solid ' + (copied ? '#86efac' : '#e5e7eb'),
        background: copied ? '#f0fdf4' : '#fff',
        color: copied ? '#059669' : '#6b7280',
        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
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
