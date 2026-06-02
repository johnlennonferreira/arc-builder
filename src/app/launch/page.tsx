'use client'

import { useState } from 'react'
import NavHeader from '@/components/NavHeader'
import { createWalletClient, createPublicClient, custom, http, parseAbi } from 'viem'
import { ensureArcTestnet } from '@/lib/switchChain'
import { arcTestnet, ARC_RPC_URL } from '@/lib/arc'
import { useWallet } from '@/components/WalletProvider'
import { useToast } from '@/components/Toast'

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`
const REGISTER_ABI = parseAbi(['function register(string metadataURI) external'])

type Step = 'idle' | 'submitting' | 'confirming' | 'done'

function shorten(addr: string) { return addr.slice(0, 6) + '...' + addr.slice(-4) }

export default function LaunchPage() {
  const { account, connect } = useWallet()
  const { success, error: toastError } = useToast()

  const [step, setStep]     = useState<Step>('idle')
  const [name, setName]     = useState('')
  const [desc, setDesc]     = useState('')
  const [uri, setUri]       = useState('')
  const [txHash, setTxHash] = useState('')
  const [agentId, setAgentId] = useState('')
  const [error, setError]   = useState('')

  async function registerAgent() {
    if (!account) { connect(); return }
    setStep('submitting'); setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      await ensureArcTestnet()
      const walletClient = createWalletClient({ account: account as `0x${string}`, chain: arcTestnet, transport: custom(eth) })
      const publicClient = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) })

      let metadataURI = uri.trim()
      if (!metadataURI) {
        const meta = { name: name.trim() || 'Unnamed Agent', description: desc.trim() }
        metadataURI = 'data:application/json,' + encodeURIComponent(JSON.stringify(meta))
      }

      const hash = await walletClient.writeContract({ address: IDENTITY_REGISTRY, abi: REGISTER_ABI, functionName: 'register', args: [metadataURI] })
      setTxHash(hash); setStep('confirming')

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      let foundId = ''
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase() && log.topics.length === 4 &&
          log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          foundId = BigInt(log.topics[3]).toString()
        }
      }
      setAgentId(foundId); setStep('done')
      success('Agent #' + foundId + ' registered on Arc Testnet!')
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Transaction failed.'
      const friendly = msg.toLowerCase().includes('user rejected') ? 'Transaction cancelled.' : msg
      setError(friendly); toastError(friendly); setStep('idle')
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
    background: '#0a0a14', border: '1px solid #2a2a3a', color: '#e8e8f0',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
  }
  const labelStyle = {
    fontSize: 12, color: '#888', textTransform: 'uppercase' as const,
    letterSpacing: '0.07em', marginBottom: 6, display: 'block',
  }
  const busy = step === 'submitting' || step === 'confirming'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 16px' }}>

        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 20, padding: '4px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 6px #00d4aa' }} />
            <span style={{ color: '#00d4aa', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>ERC-8004 IDENTITY REGISTRY</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.03em' }}>Register Your AI Agent</h1>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Mint an on-chain identity on Arc Testnet in under a minute.</p>
        </div>

        <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 16, overflow: 'hidden' }}>

          {step === 'done' ? (
            <div style={{ padding: '44px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(0,212,170,0.1)', border: '2px solid #00d4aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#00d4aa' }}>✓</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#00d4aa' }}>Agent Registered!</h2>
              {agentId && <p style={{ color: '#888', fontSize: 14, margin: '0 0 4px' }}>Agent ID: <strong style={{ color: '#e8e8f0', fontFamily: 'JetBrains Mono, monospace' }}>#{agentId}</strong></p>}
              <p style={{ color: '#444', fontSize: 13, marginBottom: 28 }}>Your agent is now live on Arc Testnet.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                {agentId && <a href={'/agent/' + agentId} style={{ padding: '10px 22px', borderRadius: 10, textDecoration: 'none', background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', color: '#000', fontWeight: 700, fontSize: 14 }}>View Agent →</a>}
                {txHash && <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 22px', borderRadius: 10, background: 'transparent', border: '1px solid #2a2a3a', color: '#888', fontSize: 14, textDecoration: 'none' }}>ArcScan ↗</a>}
                <button onClick={() => { setStep('idle'); setName(''); setDesc(''); setUri(''); setTxHash(''); setAgentId('') }}
                  style={{ padding: '10px 22px', borderRadius: 10, background: 'transparent', border: '1px solid #2a2a3a', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                  Register Another
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px' }}>

              {account ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa' }} />
                  <span style={{ color: '#00d4aa', fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{shorten(account)}</span>
                  <span style={{ color: '#333', fontSize: 12, marginLeft: 'auto' }}>Arc Testnet</span>
                </div>
              ) : (
                <div style={{ marginBottom: 24, padding: '14px 16px', borderRadius: 10, background: 'rgba(91,138,247,0.06)', border: '1px solid rgba(91,138,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Connect your wallet to register an agent</p>
                  <button onClick={connect} style={{ padding: '7px 16px', borderRadius: 8, background: 'rgba(91,138,247,0.15)', border: '1px solid rgba(91,138,247,0.3)', color: '#5b8af7', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Connect Wallet
                  </button>
                </div>
              )}

              {busy && (
                <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', color: '#00d4aa', fontSize: 13, fontWeight: 600 }}>
                  ⟳ {step === 'submitting' ? 'Waiting for signature...' : 'Confirming on Arc Testnet...'}
                  {step === 'confirming' && txHash && (
                    <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3a3a52', fontSize: 11, marginLeft: 10, fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none' }}>
                      {txHash.slice(0, 16)}...
                    </a>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Agent Name *</label>
                  <input style={inputStyle} placeholder="My AI Agent" value={name} onChange={e => setName(e.target.value)} disabled={busy}
                    onFocus={e => { e.target.style.borderColor = '#00d4aa' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="What does your agent do?" value={desc} onChange={e => setDesc(e.target.value)} disabled={busy}
                    onFocus={e => { e.target.style.borderColor = '#00d4aa' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }} />
                </div>
                <div>
                  <label style={labelStyle}>Metadata URI <span style={{ color: '#333', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                  <input style={inputStyle} placeholder="ipfs://Qm... or https://..." value={uri} onChange={e => setUri(e.target.value)} disabled={busy}
                    onFocus={e => { e.target.style.borderColor = '#00d4aa' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }} />
                  <p style={{ color: '#333', fontSize: 11, margin: '6px 0 0' }}>Leave blank — name and description are encoded automatically.</p>
                </div>
              </div>

              {error && <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#f44336', fontSize: 13 }}>{error}</div>}

              <button onClick={registerAgent} disabled={busy || !name.trim()}
                style={{
                  width: '100%', marginTop: 24, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none',
                  cursor: (busy || !name.trim()) ? 'not-allowed' : 'pointer',
                  background: (busy || !name.trim()) ? '#1a1a28' : 'linear-gradient(135deg,#00d4aa,#5b8af7)',
                  color: (busy || !name.trim()) ? '#555' : '#000',
                }}>
                {busy ? 'Processing...' : account ? 'Register Agent on Arc →' : 'Connect Wallet & Register →'}
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', color: '#2a2a3a', fontSize: 12 }}>
          ERC-8004 IdentityRegistry · Arc Testnet · Open Source
        </div>
      </main>
    </div>
  )
}
