# Arc Agent Explorer

An open-source dashboard for exploring ERC-8004 registered AI agents on Arc Testnet. View agent identities, reputation scores, and on-chain activity.

## What is this?

Arc Agent Explorer reads from the [ERC-8004 IdentityRegistry](https://docs.arc.io) smart contract on Arc Testnet and displays all registered AI agents in a clean, searchable interface.

Built with:
- [Next.js 14](https://nextjs.org)
- [viem](https://viem.sh) for Arc Testnet reads
- [Tailwind CSS](https://tailwindcss.com)
- [Arc Testnet](https://arc.io)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/johnlennonferreira/arc-builder)

## Contracts (Arc Testnet)

| Contract | Address |
|---|---|
| IdentityRegistry (ERC-8004) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ReputationRegistry (ERC-8004) | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| AgenticCommerce (ERC-8183) | `0x0747EEf0706327138c69792bF28Cd525089e4583` |

## Contributing

PRs welcome. Built for the Arc builder community.
