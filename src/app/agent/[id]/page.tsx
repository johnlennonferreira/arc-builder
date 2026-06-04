import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import ShareButton from './ShareButton'
import { publicClient as client } from '@/lib/arc'

const IDENTITY  = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`

const ID_ABI = [
  { type: 'function', name: 'tokenURI', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'ownerOf',  stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
] as const
const REP_ABI = [
  { type: 'function', name: 'getReputation', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ type: 'int128' }] },
] as const

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return {
    title: `Agent #${id} — Arc Agent Explorer`,
    description: `ERC-8004 agent identity on Arc Testnet. View reputation, metadata, and on-chain details.`,
    openGraph: {
      title: `Agent #${id} on Arc Testnet`,
      description: `ERC-8004 registered agent. View on Arc Agent Explorer.`,
      url: `https://arc-agent-explorer.vercel.app/agent/${id}`,
    },
  }
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tokenId = BigInt(id)
  const explorerBase = 'https://testnet.arcscan.app'

  let owner = '', metadataURI = '', reputation = 0, error = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let metadata: Record<string, any> | null = null

  try {
    const [uri, ownerAddr, rep] = await Promise.all([
      client.readContract({ address: IDENTITY, abi: ID_ABI, functionName: 'tokenURI', args: [tokenId] }),
      client.readContract({ address: IDENTITY, abi: ID_ABI, functionName: 'ownerOf',  args: [tokenId] }),
      client.readContract({ address: REPUTATION, abi: REP_ABI, functionName: 'getReputation', args: [tokenId] }).catch(() => 0n),
    ])
    metadataURI = uri as string
    owner       = ownerAddr as string
    reputation  = Number(rep)
  } catch { error = true }

  if (metadataURI) {
    try {
      if (metadataURI.startsWith('data:application/json,')) {
        metadata = JSON.parse(decodeURIComponent(metadataURI.slice('data:application/json,'.length)))
      } else if (metadataURI.startsWith('ipfs://')) {
        const res = await fetch('https://ipfs.io/ipfs/' + metadataURI.slice(7), { signal: AbortSignal.timeout(4000) })
        if (res.ok) metadata = await res.json()
      } else if (metadataURI.startsWith('http')) {
        const res = await fetch(metadataURI, { signal: AbortSignal.timeout(4000) })
        if (res.ok) metadata = await res.json()
      }
    } catch { /* metadata optional */ }
  }

  const isIPFS      = metadataURI.startsWith('ipfs://')
  const shareUrl    = `https://arc-agent-explorer.vercel.app/agent/${id}`
  const scoreColor  = reputation >= 80 ? '#059669' : reputation >= 50 ? '#5b8af7' : reputation > 0 ? '#d97706' : '#9ca3af'
  const scoreBg     = reputation >= 80 ? '#d1fae5' : reputation >= 50 ? '#dbeafe' : reputation > 0 ? '#fef3c7' : '#f3f4f6'

  const card = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '20px 24px',
    marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: 'Inter, sans-serif' }}>
      <NavHeader />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        {error ? (
          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>Agent #{id} not found or not yet registered.</p>
            <Link href="/" style={{ color: '#5b8af7', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>← Back to Explorer</Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>Agent Identity</p>
                <h1 style={{ color: '#5b8af7', fontSize: 48, fontWeight: 900, margin: 0, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>#{id}</h1>
              </div>
              <ShareButton url={shareUrl} agentId={id} />
            </div>

            {/* Reputation */}
            <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: scoreBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: scoreColor, fontSize: 20, fontWeight: 800 }}>{reputation > 0 ? reputation : '—'}</span>
              </div>
              <div>
                <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Reputation Score</p>
                <p style={{ color: '#374151', fontSize: 13, margin: '4px 0 0', lineHeight: 1.4 }}>
                  {reputation > 0 ? 'This agent has received community feedback.' : 'No reputation recorded yet on ReputationRegistry.'}
                </p>
              </div>
            </div>

            {/* Owner */}
            <div style={card}>
              <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Owner Address</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#111827', fontSize: 13, margin: 0, wordBreak: 'break-all' }}>{owner}</p>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Link href={`/owner/${owner}`} style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', padding: '3px 10px', border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', fontWeight: 600 }}>Profile</Link>
                  <a href={`${explorerBase}/address/${owner}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#065f46', fontSize: 12, textDecoration: 'none', padding: '3px 10px', border: '1px solid #6ee7b7', borderRadius: 6, background: '#d1fae5', fontWeight: 600 }}>ArcScan ↗</a>
                </div>
              </div>
            </div>

            {/* Profile metadata */}
            {metadata && (metadata.name || metadata.description) && (
              <div style={{ ...card, border: '1px solid #93c5fd' }}>
                <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>Agent Profile</p>
                {metadata.name && <p style={{ color: '#111827', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{String(metadata.name)}</p>}
                {metadata.description && <p style={{ color: '#374151', fontSize: 14, margin: '0 0 10px', lineHeight: 1.6 }}>{String(metadata.description)}</p>}
                {Array.isArray(metadata.capabilities) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(metadata.capabilities as string[]).map((cap, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8' }}>{cap}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metadata URI */}
            {metadataURI && (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Metadata URI</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: isIPFS ? '#dbeafe' : '#d1fae5', color: isIPFS ? '#1d4ed8' : '#065f46' }}>
                    {isIPFS ? 'IPFS' : 'URL'}
                  </span>
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6b7280', fontSize: 12, margin: 0, wordBreak: 'break-all' }}>{metadataURI}</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <a href={`${explorerBase}/token/${IDENTITY}/instance/${id}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 20px', borderRadius: 10, background: '#5b8af7', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 3px 10px rgba(91,138,247,.3)' }}>
                View on ArcScan ↗
              </a>
              <Link href="/"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>
                ← Explorer
              </Link>
            </div>

            {/* Share URL */}
            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb' }}>
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                Share: <span style={{ color: '#5b8af7', fontFamily: 'monospace' }}>{shareUrl}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
