# Arc Agent Explorer

> Browse all registered ERC-8004 AI agents on the Arc Testnet — live from the IdentityRegistry smart contract.

**Live:** https://arc-agent-explorer.vercel.app

---

## What it does

Arc Agent Explorer is an open-source explorer for the [Arc Testnet](https://arc.io) ERC-8004 IdentityRegistry. It lets you:

- Browse 32,000+ registered AI agent identities in real time
- See reputation scores from the ReputationRegistry
- Filter by metadata type (IPFS, URL) or reputation
- Sort by newest, oldest, or most reputed
- Click any owner address to see their full agent portfolio
- Get test USDC from the faucet and register your own agent

Built to make the Arc agent identity layer visible and accessible to builders.

---

## Features

| Feature | Details |
|---|---|
| **Live registry data** | Reads directly from IdentityRegistry contract via RPC |
| **Reputation scores** | Aggregated from FeedbackGiven events on ReputationRegistry |
| **Owner profiles** | `/owner/[address]` — all agents per wallet |
| **Agent detail pages** | `/agent/[id]` — metadata, owner, reputation, ArcScan link |
| **Sort & filter** | Newest / Oldest / Most Reputed · IPFS / URL / Reputed |
| **Live block counter** | Real-time block number in header, updates every 10s |
| **Animated stats** | Total agent count animates on load |
| **Recent registrations** | Live ticker of 5 latest registered agents |
| **Keyboard shortcut** | Press `/` to focus search from anywhere |
| **Share button** | Copy direct link to any agent page |
| **Faucet link** | One click to get test USDC from faucet.circle.com |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Blockchain:** [viem](https://viem.sh) — reads Arc Testnet via RPC
- **Deploy:** Vercel (auto-deploy on push)
- **Network:** Arc Testnet (Chain ID: 5042002)
- **Standards:** ERC-8004 (agent identity), ERC-8183 (agent commerce)

---

## Arc Contracts (Testnet)

| Contract | Address |
|---|---|
| IdentityRegistry (ERC-8004) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry (ERC-8004) | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ValidationRegistry (ERC-8004) | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |
| AgenticCommerce (ERC-8183) | `0x0747EEf0706327138c69792bF28Cd525089e4583` |

---

## Getting Started

```bash
git clone https://github.com/johnlennonferreira/arc-builder
cd arc-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No env vars needed — reads directly from the public Arc Testnet RPC.

---

## Register Your Agent

New to Arc? Get test USDC and register your first ERC-8004 agent:

1. [Get Test USDC](https://faucet.circle.com) — free from the Circle faucet
2. [Register Agent](https://docs.arc.io/arc/tutorials/register-your-first-ai-agent) — Arc docs tutorial

---

## Links

- **Explorer:** https://arc-agent-explorer.vercel.app
- **Arc Testnet:** https://arc.io
- **ArcScan:** https://testnet.arcscan.app
- **Arc Docs:** https://docs.arc.io
- **Faucet:** https://faucet.circle.com

---

Built on Arc Testnet · Open source · MIT