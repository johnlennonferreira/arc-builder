'use client'

import { useState } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import { createWalletClient, createPublicClient, custom, http, parseAbi } from 'viem'
import { ensureArcTestnet } from '@/lib/switchChain'
import { useWallet } from '@/components/WalletProvider'
import { useToast } from '@/components/Toast'

const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
} as const

const AGENTIC_COMMERCE = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`
const USDC             = '0x3600000000000000000000000000000000000000' as `0x${string}`

const COMMERCE_ABI = parseAbi([
  'function createJob(address provider, address evaluator, uint256 expiredAt, string description, address hook) external returns (uint256)',
  'function setBudget(uint256 jobId, uint256 amount, bytes optParams) external',
  'function fund(uint256 jobId, bytes optParams) external',
])
const USDC_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
])

type Step = 'idle' | 'connecting' | 'form' | 'tx1' | 'tx2' | 'tx3' | 'confirming' | 'done' | 'error'

function shorten(addr: string) { return addr.slice(0, 6) + '...' + addr.slice(-4) }

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
  background: '#0a0a14', border: '1px solid #2a2a3a', color: '#e8e8f0',
  outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
}
const labelStyle = {
  fontSize: 12, color: '#888', textTransform: 'uppercase' as const,
  letterSpacing: '0.07em', marginBottom: 6, display: 'block',
}

export default function CreateJobPage() {
  const { account: walletAccount, connect: walletConnect } = useWallet()
  const { success, error: toastError, info } = useToast()
  void walletAccount; void walletConnect; void toastError; void info; void success
  const [step, setStep]       = useState<Step>('idle')
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget]   = useState('')
  const [days, setDays]       = useState('7')
  const [jobId, setJobId]     = useState('')
  const [txHash, setTxHash]   = useState('')
  const [error, setError]     = useState('')

  async function connectWallet() {
    setStep('connecting'); setError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum
      if (!eth) throw new Error('MetaMask not found. Please install MetaMask.')
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
      try {
        await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x4CE252' }] })
      } catch (e: unknown) {
        if ((e as { code?: number }).code === 4902) {
          await eth.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x4CE252', chainName: 'Arc Testnet', nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 6 }, rpcUrls: ['https://rpc.testnet.arc.network'], blockExplorerUrls: ['https://testnet.arcscan.app'] }] })
        }
      }
      setAccount(accounts[0])
      setStep('form')
    } catch (e: unknown) {
      setError((e as Error).message); setStep('error')
    }
  }

  async function createJob() {
    if (!description.trim() || !budget || !provider.trim()) {
      setError('Fill all required fields.'); return
    }
    setError('')
    try {
      await ensureArcTestnet()
    } catch (e: unknown) {
      setError((e as Error).message); return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = (window as any).ethereum
    const wallet = createWalletClient({ account: account as `0x${string}`, chain: ARC_TESTNET, transport: custom(eth) })
    const pub    = createPublicClient({ chain: ARC_TESTNET, transport: http('https://rpc.testnet.arc.network') })

    const budgetMicro = BigInt(Math.round(parseFloat(budget) * 1_000_000))
    const expiredAt   = BigInt(Math.floor(Date.now() / 1000) + parseInt(days) * 86400)
    const ZERO        = '0x0000000000000000000000000000000000000000' as `0x${string}`
    const provAddr    = provider.trim() as `0x${string}`

    try {
      // Step 1: createJob
      setStep('tx1')
      const h1 = await wallet.writeContract({
        address: AGENTIC_COMMERCE, abi: COMMERCE_ABI, functionName: 'createJob',
        args: [provAddr, account as `0x${string}`, expiredAt, description.trim(), ZERO],
      })
      setTxHash(h1)
      setStep('confirming')
      const r1 = await pub.waitForTransactionReceipt({ hash: h1 })

      // Extract jobId from logs (first uint256 in first log topics[1])
      let foundId = ''
      for (const log of r1.logs) {
        if (log.address.toLowerCase() === AGENTIC_COMMERCE.toLowerCase() && log.topics.length >= 2) {
          foundId = BigInt(log.topics[1] ?? 0).toString()
          break
        }
      }
      if (!foundId) throw new Error('Could not extract job ID from transaction.')
      setJobId(foundId)

      // Step 2: setBudget
      setStep('tx2')
      const h2 = await wallet.writeContract({
        address: AGENTIC_COMMERCE, abi: COMMERCE_ABI, functionName: 'setBudget',
        args: [BigInt(foundId), budgetMicro, '0x' as `0x${string}`],
      })
      await pub.waitForTransactionReceipt({ hash: h2 })

      // Step 3: approve USDC + fund
      setStep('tx3')
      const h3 = await wallet.writeContract({
        address: USDC, abi: USDC_ABI, functionName: 'approve',
        args: [AGENTIC_COMMERCE, budgetMicro],
      })
      await pub.waitForTransactionReceipt({ hash: h3 })

      const h4 = await wallet.writeContract({
        address: AGENTIC_COMMERCE, abi: COMMERCE_ABI, functionName: 'fund',
        args: [BigInt(foundId), '0x' as `0x${string}`],
      })
      await pub.waitForTransactionReceipt({ hash: h4 })

      setTxHash(h4)
      setStep('done')
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Transaction failed.'
      setError(msg.toLowerCase().includes('user rejected') ? 'Transaction cancelled.' : msg.slice(0, 200))
      setStep('form')
    }
  }

  const stepLabels: Record<string, string> = {
    tx1: 'Step 1/3 — Creating job on-chain...',
    confirming: 'Confirming transaction...',
    tx2: 'Step 2/3 — Setting budget...',
    tx3: 'Step 3/3 — Approving USDC & funding escrow...',
  }
  const busy = ['tx1','tx2','tx3','confirming'].includes(step)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 16px' }}>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            background: 'rgba(91,138,247,0.08)', border: '1px solid rgba(91,138,247,0.2)', borderRadius: 20, padding: '4px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5b8af7', boxShadow: '0 0 6px #5b8af7' }} />
            <span style={{ color: '#5b8af7', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>ERC-8183 · AGENTICCOMMERCE</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em' }}>Create a Job</h1>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Post a job on-chain with USDC escrow. The provider gets paid automatically on completion.
          </p>
        </div>

        <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 16, overflow: 'hidden' }}>

          {/* IDLE */}
          {(step === 'idle' || step === 'connecting' || step === 'error') && (
            <div style={{ padding: '36px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
              <p style={{ color: '#555', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Connect your MetaMask wallet to post a job. The budget will be locked in USDC escrow until the job is completed.
              </p>
              <button onClick={connectWallet} disabled={step === 'connecting'}
                style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: step === 'connecting' ? '#1a1a28' : 'linear-gradient(135deg,#5b8af7,#00d4aa)',
                  color: step === 'connecting' ? '#555' : '#000' }}>
                {step === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
              </button>
              {error && <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#f44336', fontSize: 13, textAlign: 'left' }}>{error}</div>}
              <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(91,138,247,0.05)', border: '1px solid rgba(91,138,247,0.15)', textAlign: 'left' }}>
                <p style={{ color: '#5b8af7', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>How it works</p>
                {['Connect wallet and fill in job details', 'Sign 3 transactions: create job → set budget → fund escrow', 'Provider completes the work and claims USDC payment'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 7 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(91,138,247,0.2)', color: '#5b8af7', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: '#555', fontSize: 13 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORM */}
          {(step === 'form' || busy) && (
            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '8px 14px', borderRadius: 10, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4aa' }} />
                <span style={{ color: '#00d4aa', fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{shorten(account)}</span>
                <span style={{ color: '#333', fontSize: 12, marginLeft: 'auto' }}>Arc Testnet</span>
              </div>

              {busy && (
                <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(91,138,247,0.08)', border: '1px solid rgba(91,138,247,0.2)', color: '#5b8af7', fontSize: 13, fontWeight: 600 }}>
                  ⟳ {stepLabels[step] ?? 'Processing...'}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Describe the task clearly..."
                    value={description} onChange={e => setDescription(e.target.value)} disabled={busy}
                    onFocus={e => { e.target.style.borderColor = '#5b8af7' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }} />
                </div>
                <div>
                  <label style={labelStyle}>Provider Address * <span style={{ color: '#444', textTransform: 'none', letterSpacing: 0 }}>(who does the work)</span></label>
                  <input style={inputStyle} placeholder="0x..." value={provider} onChange={e => setProvider(e.target.value)} disabled={busy}
                    onFocus={e => { e.target.style.borderColor = '#5b8af7' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Budget * (USDC)</label>
                    <input style={inputStyle} type="number" placeholder="1.00" min="0.01" step="0.01"
                      value={budget} onChange={e => setBudget(e.target.value)} disabled={busy}
                      onFocus={e => { e.target.style.borderColor = '#5b8af7' }} onBlur={e => { e.target.style.borderColor = '#2a2a3a' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Deadline</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={days} onChange={e => setDays(e.target.value)} disabled={busy}>
                      {[['1','1 day'],['3','3 days'],['7','1 week'],['14','2 weeks'],['30','1 month'],['90','3 months']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: '#f44336', fontSize: 13 }}>{error}</div>}

              <button onClick={createJob} disabled={busy || !description.trim() || !budget || !provider.trim()}
                style={{ width: '100%', marginTop: 24, padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none',
                  cursor: (busy || !description.trim() || !budget || !provider.trim()) ? 'not-allowed' : 'pointer',
                  background: (busy || !description.trim() || !budget || !provider.trim()) ? '#1a1a28' : 'linear-gradient(135deg,#5b8af7,#00d4aa)',
                  color: (busy || !description.trim() || !budget || !provider.trim()) ? '#555' : '#000' }}>
                {busy ? 'Processing...' : `Post Job — $${budget || '0'} USDC`}
              </button>
              <p style={{ color: '#333', fontSize: 11, marginTop: 10, textAlign: 'center' }}>3 transactions required: create → budget → fund escrow</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ padding: '44px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(91,138,247,0.1)', border: '2px solid #5b8af7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#5b8af7' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#5b8af7' }}>Job Posted!</h2>
              {jobId && <p style={{ color: '#888', fontSize: 14, margin: '0 0 4px' }}>Job ID: <strong style={{ color: '#e8e8f0', fontFamily: 'JetBrains Mono, monospace' }}>#{jobId}</strong></p>}
              <p style={{ color: '#444', fontSize: 13, marginBottom: 28 }}>USDC is locked in escrow. The provider can now accept and complete the job.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/jobs" style={{ padding: '10px 22px', borderRadius: 10, textDecoration: 'none', background: 'linear-gradient(135deg,#5b8af7,#00d4aa)', color: '#000', fontWeight: 700, fontSize: 14 }}>
                  View Jobs Board →
                </Link>
                {txHash && <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '10px 22px', borderRadius: 10, background: 'transparent', border: '1px solid #2a2a3a', color: '#888', fontSize: 14, textDecoration: 'none' }}>ArcScan ↗</a>}
                <button onClick={() => { setStep('form'); setDescription(''); setProvider(''); setBudget(''); setJobId(''); setTxHash('') }}
                  style={{ padding: '10px 22px', borderRadius: 10, background: 'transparent', border: '1px solid #2a2a3a', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                  Post Another
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', color: '#2a2a3a', fontSize: 12 }}>
          ERC-8183 AgenticCommerce · Arc Testnet · USDC Escrow
        </div>
      </main>
    </div>
  )
}
