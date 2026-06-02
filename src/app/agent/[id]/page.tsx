import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import ShareButton from './ShareButton'
import { publicClient as client } from '@/lib/arc'

const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as `0x${string}`

const ID_ABI = [
  { type: 'function', name: 'tokenURI', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
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

  let owner = ''
  let metadataURI = ''
  let reputation = 0
  let error = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let metadata: Record<string, any> | null = null

  try {
    const [uri, ownerAddr, rep] = await Promise.all([
      client.readContract({ address: IDENTITY, abi: ID_ABI, functionName: 'tokenURI', args: [tokenId] }),
      client.readContract({ address: IDENTITY, abi: ID_ABI, functionName: 'ownerOf', args: [tokenId] }),
      client.readContract({ address: REPUTATION, abi: REP_ABI, functionName: 'getReputation', args: [tokenId] }).catch(() => 0n),
    ])
    metadataURI = uri as string
    owner = ownerAddr as string
    reputation = Number(rep)
  } catch {
    error = true
  }

  // Decode metadata from URI
  if (metadataURI) {
    try {
      if (metadataURI.startsWith('data:application/json,')) {
        metadata = JSON.parse(decodeURIComponent(metadataURI.slice('data:application/json,'.length)))
      } else if (metadataURI.startsWith('ipfs://')) {
        const cid = metadataURI.slice(7)
        const res = await fetch('https://ipfs.io/ipfs/' + cid, { signal: AbortSignal.timeout(4000) })
        if (res.ok) metadata = await res.json()
      } else if (metadataURI.startsWith('http')) {
        const res = await fetch(metadataURI, { signal: AbortSignal.timeout(4000) })
        if (res.ok) metadata = await res.json()
      }
    } catch { /* metadata optional */ }
  }

  const isIPFS = metadataURI.startsWith('ipfs://')
  const scoreColor = reputation >= 80 ? '#00d4aa' : reputation >= 50 ? '#7aa4f9' : reputation > 0 ? '#f7a44f' : '#3a3a52'
  const shareUrl = `https://arc-agent-explorer.vercel.app/agent/${id}`

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', fontFamily: 'Inter, sans-serif' }}>
      <NavHeader />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        {error ? (
          <div style={{ background: '#111118', border: '1px solid #1a1a28', borderRadius: 14, padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#f77a7a', marginBottom: 16 }}>Agent #{id} not found or not yet registered.</p>
            <Link href="/" style={{ color: '#00d4aa', fontSize: 14 }}>← Back to Explorer</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Agent Identity</p>
                <h1 style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 48, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                  #{id}
                </h1>
              </div>
              <ShareButton url={shareUrl} agentId={id} />
            </div>

            <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid #1a1a28', borderRadius: 14, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${scoreColor}40`, background: `${scoreColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: scoreColor, fontSize: 20, fontWeight: 700 }}>{reputation > 0 ? reputation : '—'}</span>
              </div>
              <div>
                <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Reputation Score</p>
                <p style={{ color: '#6b6a7e', fontSize: 13, margin: '4px 0 0' }}>
                  {reputation > 0 ? 'This agent has received community feedback.' : 'No reputation recorded yet on ReputationRegistry.'}
                </p>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid #1a1a28', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Owner Address</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#8a8a9e', fontSize: 13, margin: 0, wordBreak: 'break-all' }}>{owner}</p>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Link href={`/owner/${owner}`}
                    style={{ color: '#5b8af7', fontSize: 12, textDecoration: 'none', padding: '2px 8px', border: '1px solid rgba(91,138,247,0.25)', borderRadius: 5 }}>
                    Profile
                  </Link>
                  <a href={`${explorerBase}/address/${owner}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#00d4aa', fontSize: 12, textDecoration: 'none', padding: '2px 8px', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 5 }}>
                    ArcScan ↗
                  </a>
                </div>
              </div>
            </div>

            {metadata && (metadata.name || metadata.description) && (
              <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Agent Profile</p>
                {metadata.name && <p style={{ color: '#e8e8f0', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{String(metadata.name)}</p>}
                {metadata.description && <p style={{ color: '#6b6a7e', fontSize: 14, margin: '0 0 10px', lineHeight: 1.6 }}>{String(metadata.description)}</p>}
                {Array.isArray(metadata.capabilities) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(metadata.capabilities as string[]).map((cap, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(91,138,247,0.1)', border: '1px solid rgba(91,138,247,0.25)', color: '#7aa4f9' }}>{cap}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
                        {metadataURI && (
              <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid #1a1a28', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Metadata URI</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: isIPFS ? 'rgba(91,138,247,0.1)' : 'rgba(0,212,170,0.1)', border: `1px solid ${isIPFS ? 'rgba(91,138,247,0.25)' : 'rgba(0,212,170,0.25)'}`, color: isIPFS ? '#7aa4f9' : '#00d4aa' }}>
                    {isIPFS ? 'IPFS' : 'URL'}
                  </span>
                </div>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#5a5a72', fontSize: 12, margin: 0, wordBreak: 'break-all' }}>{metadataURI}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <a href={`${explorerBase}/token/${IDENTITY}/instance/${id}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
                View on ArcScan ↗
              </a>
              <Link href="/"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', borderRadius: 10, background: '#111118', border: '1px solid #1a1a28', color: '#6b6a7e', fontSize: 14, textDecoration: 'none' }}>
                ← Explorer
              </Link>
            </div>

            <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: 'rgba(0,212,170,0.03)', border: '1px solid rgba(0,212,170,0.08)' }}>
              <p style={{ color: '#3a3a52', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                Share this agent: <span style={{ color: '#00d4aa', fontFamily: 'monospace' }}>{shareUrl}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}