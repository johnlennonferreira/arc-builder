import { createPublicClient, http, type Chain } from 'viem'
import Link from 'next/link'

const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
}

const client = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.network') })

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
  return { title: `Agent #${id} — Arc Agent Explorer`, description: `ERC-8004 agent identity on Arc Testnet` }
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tokenId = BigInt(id)
  const explorerBase = 'https://testnet.arcscan.app'

  let owner = ''
  let metadataURI = ''
  let reputation = 0
  let error = false

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

  const isIPFS = metadataURI.startsWith('ipfs://')
  const scoreColor = reputation >= 80 ? '#00d4aa' : reputation >= 50 ? '#7aa4f9' : reputation > 0 ? '#f7a44f' : '#3a3a52'

  return (
    <main style={{ minHeight: '100vh', background: '#08080f', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #13131f', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, background: 'rgba(8,8,15,0.9)', backdropFilter: 'blur(16px)', zIndex: 40 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>A</div>
        <div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0, lineHeight: 1 }}>Arc Agent Explorer</p>
          <p style={{ color: '#3a3a52', fontSize: 11, margin: 0 }}>ERC-8004 Identity Registry</p>
        </div>
        <Link href="/" style={{ marginLeft: 'auto', color: '#3a3a52', fontSize: 13, textDecoration: 'none' }}>
          ← All Agents
        </Link>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
        {error ? (
          <div style={{ background: '#111118', border: '1px solid #1a1a28', borderRadius: 14, padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#f77a7a', marginBottom: 16 }}>Agent #{id} not found or not yet registered.</p>
            <Link href="/" style={{ color: '#00d4aa', fontSize: 14 }}>← Back to Explorer</Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Agent Identity</p>
              <h1 style={{ background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 48, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                #{id}
              </h1>
            </div>

            {/* Reputation */}
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

            {/* Owner */}
            <div style={{ background: 'linear-gradient(145deg,#111118,#0e0e16)', border: '1px solid #1a1a28', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <p style={{ color: '#3a3a52', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Owner Address</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', color: '#8a8a9e', fontSize: 13, margin: 0, wordBreak: 'break-all' }}>{owner}</p>
                <a href={`${explorerBase}/address/${owner}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00d4aa', fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>View ↗</a>
              </div>
            </div>

            {/* Metadata */}
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

            {/* Actions */}
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

            {/* Info box */}
            <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'rgba(0,212,170,0.03)', border: '1px solid rgba(0,212,170,0.08)' }}>
              <p style={{ color: '#3a3a52', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                This agent is registered on the Arc Testnet ERC-8004 IdentityRegistry at{' '}
                <span style={{ fontFamily: 'monospace', color: '#2a2a3a' }}>{IDENTITY}</span>.
                Share this page: <span style={{ color: '#00d4aa' }}>arc-agent-explorer.vercel.app/agent/{id}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
