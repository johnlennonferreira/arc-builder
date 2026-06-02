'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createWalletClient, createPublicClient, custom, http, parseAbi } from 'viem'

const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
} as const

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as `0x${string}`

const REGISTER_ABI = parseAbi(['function register(string metadataURI) external'])

type Step = 'idle' | 'connecting' | 'connected' | 'submitting' | 'confirming' | 'done' | 'error'

function shorten(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function LaunchPage() {
  const [step, setStep]       = useState<Step>('idle')
  const [account, setAccount] = useState<string>('')
  const [name, setName]       = useState('')
  const [desc, setDesc]       = useState('')
  const [uri, setUri]         = useState('')
  const [txHash, setTxHash]   = useState('')
  const [agentId, setAgentId] = useState('')
  const [error, setError]     = useState('')

  async function connectWallet() {
    setStep('connecting')
    setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      if (!eth) throw new Error('MetaMask not found. Please install MetaMask to continue.')
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
      if (!accounts[0]) throw new Error('No account selected.')
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] })
      } catch (switchErr: unknown) {
        if ((switchErr as { code?: number }).code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x4CE252',
              chainName: 'Arc Testnet',
              nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
              rpcUrls: ['https://rpc.testnet.arc.network'],
              blockExplorerUrls: ['https://testnet.arcscan.app'],
            }],
          })
        }
      }
      setAccount(accounts[0])
      setStep('connected')
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Connection failed.')
      setStep('error')
    }
  }

  async function registerAgent() {
    setStep('submitting')
    setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      const walletClient = createWalletClient({
        account: account as `0x${string}`,
        chain: ARC_TESTNET,
        transport: custom(eth),
      })
      const publicClient = createPublicClient({
        chain: ARC_TESTNET,
        transport: http('https://rpc.testnet.arc.network'),
      })

      let metadataURI = uri.trim()
      if (!metadataURI) {
        const meta = { name: name.trim() || 'Unnamed Agent', description: desc.trim() }
        metadataURI = `data:application/json,${encodeURIComponent(JSON.stringify(meta))}`
      }

      const hash = await walletClient.writeContract({
        address: IDENTITY_REGISTRY,
        abi: REGISTER_ABI,
        functionName: 'register',
        args: [metadataURI],
      })

      setTxHash(hash)
      setStep('confirming')

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      let foundId = ''
      for (const log of receipt.logs) {
        if (
          log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase() &&
          log.topics.length === 4 &&
          log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000'
        ) {
          foundId = BigInt(log.topics[3]).toString()
        }
      }

      setAgentId(foundId)
      setStep('done')
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Transaction failed.'
      setError(msg.toLowerCase().includes('user rejected') ? 'Transaction cancelled.' : msg)
      setStep('connected')
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
    background: '#0d0d1a', border: '1px solid #2a2a3a', color: '#e8e8f0',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
  }
  const label = { fontSize: 12, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 6, display: 'block' }

  const stepOrder: Step[] = ['idle', 'connecting', 'connected', 'submitting', 'confirming', 'done']
  const currentIdx = stepOrder.indexOf(step)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>

      <header style={{ borderBottom: '1px solid #1a1a28', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, background: '#0d0d1a' }}>
        <Link href="/" style={{ color: '#00d4aa', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>Arc Agent Explorer</Link>
        <span style={{ color: '#2a2a3a' }}>|</span>
        <span style={{ color: '#e8e8f0', fontWeight: 600, fontSize: 14 }}>Agent Launchpad</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link href="/jobs" style={{ color: '#5b8af7', fontSize: 13, textDecoration: 'none' }}>Jobs Board</Link>
          <Link href="/" style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>Explorer</Link>
        </div>
      </header>

      <main style={{ maxWidth: 580, margin: '0 auto', padding: '48px 16px' }}>

        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 20, padding: '4px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 6px #00d4aa' }} />
            <span style={{ color: '#00d4aa', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>ERC-8004 IDENTITY REGISTRY</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
            Register Your AI Agent
          </h1>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Mint an on-chain identity on Arc Testnet in under a minute.
          </p>
        </div>

        {/* Step indicator */}
        {step !== 'idle' && step !== 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
            {[
              { label: 'Connect', idx: 1 },
              { label: 'Configure', idx: 3 },
              { label: 'Done', idx: 5 },
            ].map((s, i) => {
              const done   = currentIdx > s.idx
              const active = currentIdx === s.idx || (i === 1 && currentIdx === 4)
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div style={{ width: 40, height: 1, background: currentIdx > s.idx - 1 ? '#00d4aa' : '#2a2a3a' }} />}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: done ? '#00d4aa' : active ? 'rgba(0,212,170,0.15)' : '#1a1a28',
                      color: done ? '#000' : active ? '#00d4aa' : '#333',
                      border: active ? '1px solid #00d4aa' : '1px solid transparent',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 11, color: active ? '#00d4aa' : done ? '#555' : '#333', fontWeight: 600 }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 16, overflow: 'hidden' }}>

          {/* CONNECT */}
          {(step === 'idle' || step === 'connecting' || step === 'error') && (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
              <p style={{ color: '#555', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Connect your MetaMask wallet to register a new AI agent on the Arc Testnet.
                Gas is paid in USDC.
              </p>
              <button
                onClick={connectWallet}
                disabled={step === 'connecting'}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: step === 'connecting' ? 'not-allowed' : 'pointer', border: 'none',
                  background: step === 'connecting' ? '#1a1a28' : 'linear-gradient(135deg,#00d4aa,#5b8af7)',
                  color: step === 'connecting' ? '#555' : '#000',
                }}
              >
                {step === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
              </button>
              {error && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
                  color: '#f44336', fontSize: 13, textAlign: 'left' }}>
                  {error}
                </div>
              )}
              <p style={{ color: '#333', fontSize: 12, marginTop: 20 }}>
                Need USDC?{' '}
                <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#00d4aa', textDecoration: 'none' }}>
                  Get test USDC at faucet.circle.com
                </a>
              </p>
            </div>
          )}

          {/* FORM */}
          {(step === 'connected' || step === 'submitting') && (
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 6px #00d4aa' }} />
                <span style={{ color: '#00d4aa', fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                  {shorten(account)}
                </span>
                <span style={{ color: '#333', fontSize: 12, marginLeft: 'auto' }}>Arc Testnet</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={label}>Agent Name *</label>
                  <input style={inputStyle} placeholder="My AI Agent"
                    value={name} onChange={e => setName(e.target.value)}
                    disabled={step === 'submitting'}
                    onFocus={e => { e.target.style.borderColor = '#00d4aa' }}
                    onBlur={e => { e.target.style.borderColor = '#2a2a3a' }}
                  />
                </div>
                <div>
                  <label style={label}>Description</label>
                  <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }}
                    placeholder="What does your agent do?"
                    value={desc} onChange={e => setDesc(e.target.value)}
                    disabled={step === 'submitting'}
                    onFocus={e => { e.target.style.borderColor = '#00d4aa' }}
                    onBlur={e => { e.target.style.borderColor = '#2a2a3a' }}
                  />
                </div>
                <div>
                  <label style={label}>Metadata URI <span style={{ color: '#333', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                  <input style={inputStyle} placeholder="ipfs://Qm... or https://..."
                    value={uri} onChange={e => setUri(e.target.value)}
                    disabled={step === 'submitting'}
                    onFocus={e => { e.target.style.borderColor = '#00d4aa' }}
                    onBlur={e => { e.target.style.borderColor = '#2a2a3a' }}
                  />
                  <p style={{ color: '#333', fontSize: 11, margin: '6px 0 0', lineHeight: 1.5 }}>
                    Leave blank — name and description will be encoded automatically.
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
                  color: '#f44336', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                onClick={registerAgent}
                disabled={step === 'submitting' || !name.trim()}
                style={{
                  width: '100%', marginTop: 28, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: (step === 'submitting' || !name.trim()) ? 'not-allowed' : 'pointer', border: 'none',
                  background: (step === 'submitting' || !name.trim()) ? '#1a1a28' : 'linear-gradient(135deg,#00d4aa,#5b8af7)',
                  color: (step === 'submitting' || !name.trim()) ? '#555' : '#000',
                }}
              >
                {step === 'submitting' ? 'Waiting for signature...' : 'Register Agent on Arc →'}
              </button>
            </div>
          )}

          {/* CONFIRMING */}
          {step === 'confirming' && (
            <div style={{ padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16, display: 'inline-block', animation: 'spin 1.2s linear infinite' }}>⟳</div>
              <p style={{ color: '#888', fontSize: 15, marginBottom: 20 }}>Confirming on Arc Testnet...</p>
              {txHash && (
                <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#5b8af7', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>
                  {txHash.slice(0, 22)}... ↗
                </a>
              )}
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ padding: '44px 32px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(0,212,170,0.1)', border: '2px solid #00d4aa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: '#00d4aa',
              }}>✓</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#00d4aa' }}>Agent Registered!</h2>
              {agentId && (
                <p style={{ color: '#888', fontSize: 14, margin: '0 0 4px' }}>
                  Agent ID:{' '}
                  <strong style={{ color: '#e8e8f0', fontFamily: "'JetBrains Mono', monospace" }}>#{agentId}</strong>
                </p>
              )}
              <p style={{ color: '#444', fontSize: 13, marginBottom: 28 }}>
                Your agent is now live on the Arc Testnet IdentityRegistry.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                {agentId && (
                  <Link href={`/agent/${agentId}`}
                    style={{ padding: '10px 22px', borderRadius: 10, textDecoration: 'none',
                      background: 'linear-gradient(135deg,#00d4aa,#5b8af7)', color: '#000', fontWeight: 700, fontSize: 14 }}>
                    View Agent →
                  </Link>
                )}
                {txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '10px 22px', borderRadius: 10, background: 'transparent',
                      border: '1px solid #2a2a3a', color: '#888', fontSize: 14, textDecoration: 'none' }}>
                    ArcScan ↗
                  </a>
                )}
                <button onClick={() => { setStep('connected'); setName(''); setDesc(''); setUri(''); setTxHash(''); setAgentId('') }}
                  style={{ padding: '10px 22px', borderRadius: 10, background: 'transparent',
                    border: '1px solid #2a2a3a', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                  Register Another
                </button>
              </div>
            </div>
          )}

        </div>

        {/* How it works */}
        {(step === 'idle' || step === 'connecting' || step === 'error') && (
          <div style={{ marginTop: 24, padding: '20px 24px', borderRadius: 12,
            background: 'rgba(91,138,247,0.05)', border: '1px solid rgba(91,138,247,0.15)' }}>
            <p style={{ color: '#5b8af7', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>How it works</p>
            {[
              'Connect MetaMask wallet (Arc Testnet)',
              'Fill in your agent name and description',
              'Sign the transaction — agent gets a unique on-chain ID',
              'View your agent live in the Explorer',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(91,138,247,0.2)', color: '#5b8af7',
                  fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </span>
                <span style={{ color: '#666', fontSize: 13 }}>{t}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: 'center', color: '#2a2a3a', fontSize: 12 }}>
          ERC-8004 IdentityRegistry · Arc Testnet · Open Source
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
