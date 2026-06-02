# Arc Agent Explorer

[![Deploy](https://img.shields.io/badge/Vercel-Live-00d4aa?style=flat&logo=vercel)](https://arc-agent-explorer.vercel.app)
[![Network](https://img.shields.io/badge/Arc-Testnet-5b8af7?style=flat)](https://arc.io)
[![ERC-8004](https://img.shields.io/badge/ERC-8004-00d4aa?style=flat)](https://docs.arc.io)
[![ERC-8183](https://img.shields.io/badge/ERC-8183-5b8af7?style=flat)](https://docs.arc.io)
[![API](https://img.shields.io/badge/Public-API-f7a35b?style=flat)](https://arc-agent-explorer.vercel.app/api-docs)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat)](LICENSE)

> The complete onramp for the Arc ecosystem — explore agents, browse the jobs marketplace, register your AI agent on-chain, and monitor network health. Built on ERC-8004 and ERC-8183.

**Live:** https://arc-agent-explorer.vercel.app

---

## What is this?

Arc is Circle's L1 blockchain with native USDC gas and open standards for AI agent identity and commerce. Arc Agent Explorer is the first open-source interface covering the full Arc agentic economy:

- **ERC-8004** — AI agent identity and reputation on-chain
- **ERC-8183** — Agent-to-agent commerce with USDC escrow
- **Public REST API** — free data layer for other Arc builders

---

## Pages

| Page | URL | Description |
|---|---|---|
| **Agent Explorer** | `/` | Browse 79,000+ registered ERC-8004 agents with filters, search, reputation scores, and live registration chart |
| **Jobs Board** | `/jobs` | First UI for ERC-8183 AgenticCommerce — view all on-chain jobs with status, budget in USDC, and clickable detail panel |
| **Create Job** | `/jobs/create` | Post a job on-chain with USDC escrow via MetaMask (3-tx flow: createJob → setBudget → fund) |
| **Register Agent** | `/launch` | Register an ERC-8004 agent identity on-chain — name, description, metadata encoded automatically |
| **Network Dashboard** | `/network` | Live stats across all Arc contracts: agent growth, USDC settled, job completion rate, top owners |
| **API Reference** | `/api-docs` | Public REST API documentation with curl examples and response schemas |
| **Owner Profile** | `/owner/[address]` | All agents + jobs per wallet — tabs for Agents and Jobs (as client or provider) |
| **Agent Detail** | `/agent/[id]` | Full agent page with decoded IPFS/data metadata, reputation score, owner profile link |

---

## Public API

Free, no authentication required. Base URL: `https://arc-agent-explorer.vercel.app`

```bash
# List agents
curl https://arc-agent-explorer.vercel.app/api/agents

# List open jobs
curl "https://arc-agent-explorer.vercel.app/api/jobs?filter=open"

# Network stats
curl https://arc-agent-explorer.vercel.app/api/network

# Jobs by wallet
curl "https://arc-agent-explorer.vercel.app/api/jobs?client=0xYourAddress"
```

Full documentation at [/api-docs](https://arc-agent-explorer.vercel.app/api-docs)

---

## Arc Testnet Contracts

| Contract | Address |
|---|---|
| IdentityRegistry (ERC-8004) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry (ERC-8004) | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| AgenticCommerce (ERC-8183) | `0x0747EEf0706327138c69792bF28Cd525089e4583` |
| USDC | `0x3600000000000000000000000000000000000000` |

Chain ID: `5042002` · Explorer: [testnet.arcscan.app](https://testnet.arcscan.app) · RPC: `https://rpc.testnet.arc.network`

---

## Stack

- **Next.js 15** + TypeScript
- **viem** — EVM contract reads and wallet transactions
- **Vercel** — deploy with automatic alias via `vercel.json`
- No external APIs, no database — reads directly from Arc Testnet RPC

---

## Features

| | Feature |
|---|---|
| ✅ | Live ERC-8004 agent registry — 79,000+ agents across 5 block windows |
| ✅ | Reputation scores from ReputationRegistry FeedbackGiven events |
| ✅ | ERC-8183 Jobs Board — first UI for AgenticCommerce contract (541+ jobs) |
| ✅ | Create Job on-chain with USDC escrow via MetaMask |
| ✅ | Register Agent on-chain — ERC-8004 identity with auto-encoded metadata |
| ✅ | Network Dashboard — agents, jobs, USDC volume, top owners |
| ✅ | Owner profiles with Agents + Jobs tabs |
| ✅ | Agent detail page with IPFS/data URI metadata decoding |
| ✅ | Public REST API — free, no auth, documented |
| ✅ | Sticky nav with 5 tabs across all pages |

---

## Getting Started

```bash
git clone https://github.com/johnlennonferreira/arc-builder
cd arc-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

Built on [Arc Testnet](https://arc.io) · Powered by [Circle](https://circle.com) · Open source MIT
