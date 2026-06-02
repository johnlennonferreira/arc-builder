# Arc Agent Explorer

[![Deploy](https://img.shields.io/badge/Vercel-Live-00d4aa?style=flat&logo=vercel)](https://arc-agent-explorer.vercel.app)
[![Network](https://img.shields.io/badge/Arc-Testnet-5b8af7?style=flat)](https://arc.io)
[![Standard](https://img.shields.io/badge/ERC-8004-00d4aa?style=flat)](https://docs.arc.io)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat)](LICENSE)

> Open-source explorer for ERC-8004 AI agents on the Arc Testnet — live data from the IdentityRegistry smart contract.

**🌐 Live:** https://arc-agent-explorer.vercel.app

---

## What is this?

Arc is Circle's L1 blockchain with native USDC gas and a unique standard for AI agent identity: **ERC-8004**. Every AI agent registered on Arc gets an on-chain identity with reputation, metadata, and provable history.

Arc Agent Explorer makes this registry visible and accessible — browse 32,000+ registered agents, see their reputation scores, explore owner portfolios, and track new registrations in real time.

---

## Features

| | Feature | Description |
|---|---|---|
| 🔍 | **Live registry** | Reads directly from IdentityRegistry via RPC — no API key needed |
| ⭐ | **Reputation scores** | Aggregated from FeedbackGiven events on ReputationRegistry |
| 👤 | **Owner profiles** | `/owner/[address]` — all agents per wallet with stats |
| 📄 | **Agent detail pages** | `/agent/[id]` — metadata, owner, reputation, ArcScan link |
| ↕️ | **Sort & filter** | Newest / Oldest / Most Reputed · IPFS / URL / Reputed |
| 📡 | **Live block counter** | Header shows current block, updates every 10s |
| 🔢 | **Animated stats** | Total agent count animates on load |
| ⚡ | **Recent ticker** | Live strip of the 5 latest registered agents |
| ⌨️ | **Keyboard shortcut** | Press `/` to focus search from anywhere |
| 🔗 | **Share button** | Copy direct link to any agent page |
| 💧 | **Faucet link** | One click → get test USDC from faucet.circle.com |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Blockchain:** [viem](https://viem.sh) — reads Arc Testnet via RPC
- **Deploy:** Vercel (auto-deploy on push to main)
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

## Run Locally

```bash
git clone https://github.com/johnlennonferreira/arc-builder
cd arc-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**No environment variables required** — reads directly from the public Arc Testnet RPC.

---

## New to Arc?

1. [💧 Get Test USDC](https://faucet.circle.com) — free testnet funds from Circle
2. [📝 Register Your Agent](https://docs.arc.io/arc/tutorials/register-your-first-ai-agent) — step-by-step tutorial
3. [🔍 Browse Agents](https://arc-agent-explorer.vercel.app) — explore what's already registered

---

## Roadmap

- [ ] ERC-8183 Jobs section — live job listings from AgenticCommerce
- [ ] Goldsky subgraph integration — faster indexing, full history
- [ ] x402 nanopayments for premium API access

---

## Links

| | |
|---|---|
| 🌐 Explorer | https://arc-agent-explorer.vercel.app |
| 📦 GitHub | https://github.com/johnlennonferreira/arc-builder |
| 🔍 ArcScan | https://testnet.arcscan.app |
| 📚 Arc Docs | https://docs.arc.io |
| 💧 Faucet | https://faucet.circle.com |
| 🏠 Arc House | https://community.arc.io |

---

Built on Arc Testnet · Open source · MIT License