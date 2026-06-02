'use client'

import NavHeader from '@/components/NavHeader'

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      background: '#070710', border: '1px solid #1a1a28', borderRadius: 10,
      padding: '16px 20px', fontSize: 12, color: '#00d4aa', overflowX: 'auto',
      fontFamily: "'JetBrains Mono', monospace", margin: '10px 0',
      lineHeight: 1.7,
    }}>
      <code>{children}</code>
    </pre>
  )
}

function Param({ name, type: t, desc, required }: { name: string; type: string; desc: string; required?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid #0f0f1a' }}>
      <code style={{ color: '#00d4aa', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", minWidth: 100 }}>{name}</code>
      <span style={{ color: '#5b8af7', fontSize: 11, minWidth: 60 }}>{t}</span>
      {required && <span style={{ color: '#f7a35b', fontSize: 10, fontWeight: 700 }}>required</span>}
      <span style={{ color: '#555', fontSize: 13, flex: 1 }}>{desc}</span>
    </div>
  )
}

function Section({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #1a1a28' }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,212,170,0.1)', color: '#00d4aa', fontFamily: "'JetBrains Mono', monospace" }}>GET</span>
        <code style={{ color: '#e8e8f0', fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{title}</code>
        <span style={{ color: '#3a3a52', fontSize: 12 }}>{badge}</span>
      </div>
      {children}
    </div>
  )
}

export default function ApiDocsPage() {
  const base = 'https://arc-agent-explorer.vercel.app'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#e8e8f0', fontFamily: "'Inter', sans-serif" }}>
      <NavHeader />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
            background: 'rgba(91,138,247,0.08)', border: '1px solid rgba(91,138,247,0.2)',
            borderRadius: 20, padding: '4px 14px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5b8af7', boxShadow: '0 0 6px #5b8af7' }} />
            <span style={{ color: '#5b8af7', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>PUBLIC API · FREE · NO AUTH</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.03em' }}>API Reference</h1>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Free, open REST API for Arc Testnet data. No API key required.<br />
            Base URL: <code style={{ color: '#00d4aa', fontFamily: "'JetBrains Mono', monospace" }}>{base}</code>
          </p>
        </div>

        {/* Quick start */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Quick Start</p>
          <Code>{`# List all agents
curl ${base}/api/agents

# Get network stats
curl ${base}/api/network

# List all jobs
curl ${base}/api/jobs

# Filter by status
curl "${base}/api/jobs?filter=open"

# Get stats summary
curl ${base}/api/stats`}</Code>
        </div>

        {/* /api/agents */}
        <Section title="/api/agents" badge="ERC-8004 IdentityRegistry">
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            Returns paginated list of registered ERC-8004 agents with reputation scores and metadata URIs.
          </p>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Parameters</p>
          <div style={{ marginBottom: 16 }}>
            <Param name="page"     type="number"  desc="Page number, starting at 0 (default: 0)" />
            <Param name="pageSize" type="number"  desc="Results per page, max 50 (default: 20)" />
            <Param name="filter"   type="string"  desc="Filter by metadata type: all | ipfs | url | reputed (default: all)" />
            <Param name="sort"     type="string"  desc="Sort order: newest | oldest | reputed (default: newest)" />
            <Param name="owner"    type="address" desc="Filter by owner wallet address (optional)" />
          </div>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Response</p>
          <Code>{`{
  "agents": [
    {
      "id": "79930",
      "owner": "0xca4f...6d0e",
      "metadataURI": "ipfs://Qm...",
      "blockNumber": "45067200",
      "registeredAt": "Jun 1, 2026",
      "reputationScore": 42,
      "txHash": "0xabc..."
    }
  ],
  "total": 541,
  "totalAgents": 79930,
  "latestBlock": "45067256",
  "counts": {
    "ipfs": 12,
    "url": 8,
    "reputed": 24
  }
}`}</Code>
          <Code>{`# Example: get reputed agents, newest first
curl "${base}/api/agents?filter=reputed&sort=newest"

# Example: get agents for a specific owner
curl "${base}/api/agents?owner=0xYourAddress"`}</Code>
        </Section>

        {/* /api/jobs */}
        <Section title="/api/jobs" badge="ERC-8183 AgenticCommerce">
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            Returns paginated list of ERC-8183 jobs with live status, budget in USDC, and participant addresses.
          </p>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Parameters</p>
          <div style={{ marginBottom: 16 }}>
            <Param name="page"     type="number" desc="Page number, starting at 0 (default: 0)" />
            <Param name="pageSize" type="number" desc="Results per page, max 50 (default: 20)" />
            <Param name="filter"   type="string" desc="Filter by status: all | open | funded | submitted | completed (default: all)" />
          </div>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Job Status Values</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { s: 'Open',      c: '#00d4aa' },
              { s: 'Funded',    c: '#5b8af7' },
              { s: 'Submitted', c: '#f7a35b' },
              { s: 'Completed', c: '#4caf50' },
              { s: 'Rejected',  c: '#f44336' },
              { s: 'Expired',   c: '#888'    },
            ].map(({ s, c }) => (
              <span key={s} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: c, background: `${c}18`, border: `1px solid ${c}33` }}>{s}</span>
            ))}
          </div>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Response</p>
          <Code>{`{
  "jobs": [
    {
      "id": "79930",
      "client":    "0xca4f...6d0e",
      "provider":  "0xd867...9999",
      "evaluator": "0xca4f...6d0e",
      "description": "Create slogan | Short copywriting task",
      "budgetUSDC": 0.69,
      "expiry": "Jun 2, 2026",
      "status": "Completed",
      "statusCode": 3,
      "txHash": "0xabc...",
      "blockNumber": "45067200"
    }
  ],
  "total": 541,
  "page": 0,
  "pageSize": 20
}`}</Code>
          <Code>{`# Example: list open jobs
curl "${base}/api/jobs?filter=open"

# Example: list completed jobs, page 2
curl "${base}/api/jobs?filter=completed&page=1"`}</Code>
        </Section>

        {/* /api/network */}
        <Section title="/api/network" badge="Aggregated network stats">
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            Returns aggregated statistics from all Arc Testnet contracts — agents, jobs, USDC volume, and top owners.
          </p>
          <Code>{`{
  "latestBlock": "45067256",
  "windowBlocks": 49995,
  "agents": {
    "total": 412,
    "maxId": 79930,
    "uniqueOwners": 38,
    "reputedCount": 24,
    "totalFeedbacks": 89,
    "perWindow": [
      { "window": "W1", "count": 82 },
      { "window": "W2", "count": 91 }
    ]
  },
  "jobs": {
    "total": 541,
    "totalPayments": 312,
    "totalUSDCPaid": 312.69,
    "paidWorkers": 14,
    "perWindow": [...]
  },
  "usdc": { "totalSupply": 9999999 },
  "topOwners": [
    { "address": "0xbe4a...806c", "count": 180 }
  ]
}`}</Code>
          <Code>{`curl ${base}/api/network`}</Code>
        </Section>

        {/* /api/stats */}
        <Section title="/api/stats" badge="Chart data">
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
            Returns hourly registration chart data for the last ~50k blocks.
          </p>
          <Code>{`{
  "chart": [
    { "date": "Jun 1 00h", "count": 14 },
    { "date": "Jun 1 01h", "count": 22 }
  ]
}`}</Code>
        </Section>

        {/* Contracts */}
        <div style={{ background: '#0d0d1a', border: '1px solid #1a1a28', borderRadius: 12, padding: '20px 24px', marginBottom: 40 }}>
          <p style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Arc Testnet Contracts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'IdentityRegistry (ERC-8004)',   addr: '0x8004A818BFB912233c491871b3d84c89A494BD9e', color: '#00d4aa' },
              { name: 'ReputationRegistry (ERC-8004)', addr: '0x8004B663056A597Dffe9eCcC1965A193B7388713', color: '#00d4aa' },
              { name: 'AgenticCommerce (ERC-8183)',     addr: '0x0747EEf0706327138c69792bF28Cd525089e4583', color: '#5b8af7' },
              { name: 'USDC Token',                    addr: '0x3600000000000000000000000000000000000000', color: '#f7a35b' },
            ].map(({ name, addr, color }) => (
              <div key={addr} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color, fontSize: 12, fontWeight: 700, minWidth: 220 }}>{name}</span>
                <code style={{ color: '#3a3a52', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{addr}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'rgba(0,212,170,0.04)', border: '1px solid rgba(0,212,170,0.1)' }}>
          <p style={{ color: '#00d4aa', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>Notes</p>
          <ul style={{ color: '#555', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
            <li>All endpoints are read-only. No authentication required.</li>
            <li>Data covers the last ~50,000 blocks (approx 5 windows × 10,000).</li>
            <li>Responses are cached for 30–60 seconds (Cache-Control: s-maxage).</li>
            <li>Arc Testnet · Chain ID: 5042002 · RPC: rpc.testnet.arc.network</li>
            <li>Open source: <a href="https://github.com/johnlennonferreira/arc-builder" target="_blank" rel="noopener noreferrer" style={{ color: '#5b8af7' }}>github.com/johnlennonferreira/arc-builder</a></li>
          </ul>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', color: '#2a2a3a', fontSize: 12 }}>
          Arc Agent Explorer API · Arc Testnet · Open Source
        </div>
      </main>
    </div>
  )
}
