'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import { createWalletClient, createPublicClient, custom, http, parseAbi } from 'viem'
import { ensureArcTestnet } from '@/lib/switchChain'
import { arcTestnet, ARC_RPC_URL, USDC_ADDRESS } from '@/lib/arc'
import { useWallet } from '@/components/WalletProvider'

const AGENTIC_COMMERCE = '0x0747EEf0706327138c69792bF28Cd525089e4583' as `0x${string}`

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

function shorten(addr: string) { return addr.slice(0, 6) + '…' + addr.slice(-4) }

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
  background: '#fff', border: '1px solid #e5e7eb', color: '#111827',
  outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
  transition: 'border-color .15s',
}
const labelStyle = {
  fontSize: 11, color: '#6b7280', textTransform: 'uppercase' as const,
  letterSpacing: '1px', fontWeight: 600 as const, marginBottom: 7, display: 'block',
}

export default function CreateJobPage() {
  const { account, connect } = useWallet()
  const [step,        setStep]        = useState<Step>('idle')
  const [provider,    setProvider]    = useState('')
  const [description, setDescription] = useState('')
  const [budget,      setBudget]      = useState('')
  const [days,        setDays]        = useState('7')
  const [jobId,       setJobId]       = useState('')
  const [txHash,      setTxHash]      = useState('')
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (account && (step === 'idle' || step === 'connecting')) setStep('form')
  }, [account, step])

  async function connectWallet() {
    setStep('connecting'); setError('')
    await connect()
  }

  async function createJob() {
    if (!description.trim() || !budget || !provider.trim()) {
      setError('Fill all required fields.'); return
    }
    setError('')
    try { await ensureArcTestnet() } catch (e: unknown) { setError((e as Error).message); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth    = (window as any).ethereum
    const wallet = createWalletClient({ account: account as `0x${string}`, chain: arcTestnet, transport: custom(eth) })
    const pub    = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) })
    const budgetMicro = BigInt(Math.round(parseFloat(budget) * 1_000_000))
    const expiredAt   = BigInt(Math.floor(Date.now() / 1000) + parseInt(days) * 86400)
    const ZERO        = '0x0000000000000000000000000000000000000000' as `0x${string}`
    const provAddr    = provider.trim() as `0x${string}`
    try {
      setStep('tx1')
      const h1 = await wallet.writeContract({ address: AGENTIC_COMMERCE, abi: COMMERCE_ABI, functionName: 'createJob', args: [provAddr, account as `0x${string}`, expiredAt, description.trim(), ZERO] })
      setTxHash(h1); setStep('confirming')
      const r1 = await pub.waitForTransactionReceipt({ hash: h1 })
      let foundId = ''
      for (const log of r1.logs) {
        if (log.address.toLowerCase() === AGENTIC_COMMERCE.toLowerCase() && log.topics.length >= 2) {
          foundId = BigInt(log.topics[1] ?? 0).toString(); break
        }
      }
      if (!foundId) throw new Error('Could not extract job ID from transaction.')
      setJobId(foundId)
      setStep('tx2')
      const h2 = await wallet.writeContract({ address: AGENTIC_COMMERCE, abi: COMMERCE_ABI, functionName: 'setBudget', args: [BigInt(foundId), budgetMicro, '0x' as `0x${string}`] })
      await pub.waitForTransactionReceipt({ hash: h2 })
      setStep('tx3')
      const h3 = await wallet.writeContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: 'approve', args: [AGENTIC_COMMERCE, budgetMicro] })
      await pub.waitForTransactionReceipt({ hash: h3 })
      const h4 = await wallet.writeContract({ address: AGENTIC_COMMERCE, abi: COMMERCE_ABI, functionName: 'fund', args: [BigInt(foundId), '0x' as `0x${string}`] })
      await pub.waitForTransactionReceipt({ hash: h4 })
      setTxHash(h4); setStep('done')
    } catch (e: unknown) {
      const msg = (e as Error).message ?? 'Transaction failed.'
      setError(msg.toLowerCase().includes('user rejected') ? 'Transaction cancelled.' : msg.slice(0, 200))
      setStep('form')
    }
  }

  const stepLabels: Record<string, string> = {
    tx1: 'Step 1/3 — Creating job on-chain…',
    confirming: 'Confirming transaction…',
    tx2: 'Step 2/3 — Setting budget…',
    tx3: 'Step 3/3 — Approving USDC & funding escrow…',
  }
  const busy = ['tx1','tx2','tx3','confirming'].includes(step)
  const canPost = !busy && !!description.trim() && !!budget && !!provider.trim()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, background: '#dbeafe', borderRadius: 20, padding: '4px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5b8af7' }} />
            <span style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>ERC-8183 · AgenticCommerce</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.03em', color: '#111827' }}>Create a Job</h1>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>Post a job on-chain with USDC escrow. The provider gets paid automatically on completion.</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, boxShadow: '0 1px 3px rgba(0,0,0,.07), 0 8px 24px rgba(0,0,0,.05)', overflow: 'hidden' }}>

          {/* IDLE / CONNECT */}
          {(step === 'idle' || step === 'connecting' || step === 'error') && (
            <div style={{ padding: '36px' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>💼</div>
                <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  Connect your wallet to post a job. The budget will be locked in USDC escrow until completed.
                </p>
              </div>
              <button onClick={connectWallet} disabled={step === 'connecting'}
                style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                  background: step === 'connecting' ? '#f3f4f8' : '#5b8af7',
                  color: step === 'connecting' ? '#9ca3af' : '#fff',
                  boxShadow: step === 'connecting' ? 'none' : '0 4px 12px rgba(91,138,247,.3)',
                }}>
                {step === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
              </button>
              {error && (
                <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13 }}>{error}</div>
              )}
              <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>How it works</p>
                {['Connect wallet and fill in job details', 'Sign 4 transactions: create → budget → approve USDC → fund escrow', 'Provider completes the work and claims USDC payment'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#dbeafe', color: '#5b8af7', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: '#374151', fontSize: 13 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORM */}
          {(step === 'form' || busy) && (
            <div style={{ padding: '28px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                <span style={{ color: '#065f46', fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{shorten(account)}</span>
                <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 'auto' }}>Arc Testnet</span>
              </div>

              {busy && (
                <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #93c5fd', color: '#5b8af7', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  {stepLabels[step] ?? 'Processing…'}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={labelStyle}>Description *</label>
                  <textarea style={{ ...inputStyle, height: 88, resize: 'vertical' }} placeholder="Describe the task clearly…"
                    value={description} onChange={e => setDescription(e.target.value)} disabled={busy} />
                </div>
                <div>
                  <label style={labelStyle}>Provider Address * <span style={{ color: '#9ca3af', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(who does the work)</span></label>
                  <input style={inputStyle} placeholder="0x…" value={provider} onChange={e => setProvider(e.target.value)} disabled={busy} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Budget * (USDC)</label>
                    <input style={inputStyle} type="number" placeholder="1.00" min="0.01" step="0.01"
                      value={budget} onChange={e => setBudget(e.target.value)} disabled={busy} />
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

              {error && (
                <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13 }}>{error}</div>
              )}

              <button onClick={createJob} disabled={!canPost}
                style={{ width: '100%', marginTop: 24, padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, border: 'none', fontFamily: 'inherit',
                  cursor: !canPost ? 'not-allowed' : 'pointer',
                  background: !canPost ? '#f3f4f8' : '#5b8af7',
                  color: !canPost ? '#9ca3af' : '#fff',
                  boxShadow: !canPost ? 'none' : '0 4px 12px rgba(91,138,247,.3)',
                }}>
                {busy ? 'Processing…' : `Post Job — $${budget || '0'} USDC`}
              </button>
              <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 10, textAlign: 'center' }}>4 transactions required: create → budget → approve USDC → fund escrow</p>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div style={{ padding: '44px 36px', textAlign: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 20px', background: '#dbeafe', border: '2px solid #5b8af7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#5b8af7' }}>✓</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#5b8af7' }}>Job Posted!</h2>
              {jobId && <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 4px' }}>Job ID: <strong style={{ color: '#111827', fontFamily: 'JetBrains Mono, monospace' }}>#{jobId}</strong></p>}
              <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 28 }}>USDC is locked in escrow. The provider can now accept and complete the job.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/jobs" style={{ padding: '10px 22px', borderRadius: 10, textDecoration: 'none', background: '#5b8af7', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 3px 10px rgba(91,138,247,.3)' }}>
                  View Jobs Board →
                </Link>
                {txHash && (
                  <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '10px 22px', borderRadius: 10, background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>ArcScan ↗</a>
                )}
                <button onClick={() => { setStep('form'); setDescription(''); setProvider(''); setBudget(''); setJobId(''); setTxHash('') }}
                  style={{ padding: '10px 22px', borderRadius: 10, background: '#f5f6fa', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>
                  Post Another
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
          ERC-8183 AgenticCommerce · Arc Testnet · USDC Escrow
        </div>
        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </main>
    </div>
  )
}
