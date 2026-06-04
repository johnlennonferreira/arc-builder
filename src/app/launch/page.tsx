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

function shorten(addr: string) { return addr.slice(0, 6) + '…' + addr.slice(-4) }

export default function LaunchPage() {
  const { account, connect } = useWallet()
  const { success, error: toastError } = useToast()

  const [step,    setStep]    = useState<Step>('idle')
  const [name,    setName]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [uri,     setUri]     = useState('')
  const [txHash,  setTxHash]  = useState('')
  const [agentId, setAgentId] = useState('')
  const [error,   setError]   = useState('')

  async function registerAgent() {
    if (!account) { connect(); return }
    setStep('submitting'); setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      await ensureArcTestnet()
      const walletClient = createWalletClient({ account: account as `0x${string}`, chain: arcTestnet, transport: custom(eth) })
      const pub          = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) })
      let metadataURI    = uri.trim()
      if (!metadataURI) {
        const meta = { name: name.trim() || 'Unnamed Agent', description: desc.trim() }
        metadataURI = 'data:application/json,' + encodeURIComponent(JSON.stringify(meta))
      }
      const hash = await walletClient.writeContract({ address: IDENTITY_REGISTRY, abi: REGISTER_ABI, functionName: 'register', args: [metadataURI] })
      setTxHash(hash); setStep('confirming')
      const receipt = await pub.waitForTransactionReceipt({ hash })
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
    background: '#fff', border: '1px solid #e5e7eb', color: '#111827',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
    transition: 'border-color .15s',
  }
  const labelStyle = {
    fontSize: 11, color: '#6b7280', textTransform: 'uppercase' as const,
    letterSpacing: '1px', fontWeight: 600, marginBottom: 7, display: 'block',
  }
  const busy = step === 'submitting' || step === 'confirming'

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            background: '#d1fae5', borderRadius: 20, padding: '4px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
            <span style={{ color: '#065f46', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>ERC-8004 Identity Registry</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.03em', color: '#111827' }}>Register Your AI Agent</h1>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Mint an on-chain identity on Arc Testnet in under a minute.</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,.07), 0 8px 24px rgba(0,0,0,.05)', overflow: 'hidden' }}>

          {step === 'done' ? (
            <div style={{ padding: '44px 36px', textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 20px', background: '#d1fae5', border: '2px solid #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#059669' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#059669' }}>Agent Registered!</h2>
              {agentId && <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 4px' }}>Agent ID: <strong style={{ color: '#111827', fontFamily: 'JetBrains Mono, monospace' }}>#{agentId}</strong></p>}
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 28 }}>Your agent is now live on Arc Testnet.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {agentId && (
                  <a href={'/agent/' + agentId} style={{ padding: '10px 22px', borderRadius: 10, textDecoration: 'none', background: '#5b8af7', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 3px 10px rgba(91,138,247,.3)' }}>View Agent →</a>
                )}
                {txHash && (
                  <a href={'https://testnet.arcscan.app/tx/' + txHash} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '10px 22px', borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>ArcScan ↗</a>
                )}
                <button onClick={() => { setStep('idle'); setName(''); setDesc(''); setUri(''); setTxHash(''); setAgentId('') }}
                  style={{ padding: '10px 22px', borderRadius: 10, background: '#f5f6fa', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>
                  Register Another
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 36px' }}>

              {account ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                  <span style={{ color: '#065f46', fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{shorten(account)}</span>
                  <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 'auto' }}>Arc Testnet</span>
                </div>
              ) : (
                <div style={{ marginBottom: 24, padding: '14px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ color: '#374151', fontSize: 13, margin: 0 }}>Connect your wallet to register an agent</p>
                  <button onClick={connect} style={{ padding: '7px 16px', borderRadius: 8, background: '#5b8af7', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                    Connect Wallet
                  </button>
                </div>
              )}

              {busy && (
                <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #93c5fd', color: '#5b8af7', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  {step === 'submitting' ? 'Waiting for signature…' : 'Confirming on Arc Testnet…'}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Agent Name *</label>
                  <input style={inputStyle} placeholder="My AI Agent" value={name} onChange={e => setName(e.target.value)} disabled={busy} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, height: 88, resize: 'vertical' }} placeholder="What does your agent do?" value={desc} onChange={e => setDesc(e.target.value)} disabled={busy} />
                </div>
                <div>
                  <label style={labelStyle}>Metadata URI <span style={{ color: '#9ca3af', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                  <input style={inputStyle} placeholder="ipfs://Qm… or https://…" value={uri} onChange={e => setUri(e.target.value)} disabled={busy} />
                  <p style={{ color: '#9ca3af', fontSize: 11, margin: '6px 0 0' }}>Leave blank — name and description are encoded automatically.</p>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13 }}>{error}</div>
              )}

              <button onClick={registerAgent} disabled={busy || !name.trim()}
                style={{
                  width: '100%', marginTop: 24, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none',
                  cursor: (busy || !name.trim()) ? 'not-allowed' : 'pointer',
                  background: (busy || !name.trim()) ? '#f3f4f8' : '#5b8af7',
                  color: (busy || !name.trim()) ? '#9ca3af' : '#fff',
                  boxShadow: (busy || !name.trim()) ? 'none' : '0 4px 12px rgba(91,138,247,.3)',
                  fontFamily: 'inherit',
                }}>
                {busy ? 'Processing…' : account ? 'Register Agent on Arc →' : 'Connect Wallet & Register →'}
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          ERC-8004 IdentityRegistry · Arc Testnet · Open Source
        </div>
        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </main>
    </div>
  )
}
