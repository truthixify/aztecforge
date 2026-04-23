# AztecForge

Private community incentive platform built on [Aztec Network](https://aztec.network). Bounties, funding pools, hackathons, peer rewards, quests, and contributor reputation — with privacy by default.

## Packages

| Package | Stack | Description |
|---------|-------|-------------|
| `contracts/` | Noir / Aztec.nr | 6 smart contracts for on-chain logic |
| `server/` | NestJS + TypeScript | REST API with Swagger docs |
| `client/` | Vite + React + TypeScript + Tailwind | Web dashboard |

## Quick Start

### Prerequisites

- Node.js >= 24
- pnpm >= 10
- Aztec toolchain (`aztec-up`)

### Contracts

```bash
cd contracts
./build.sh          # compile all 6 contracts
./test.sh           # run contract tests
```

### Server

```bash
cd server
pnpm install
pnpm run build
pnpm run start:dev  # http://localhost:3000
                    # Swagger: http://localhost:3000/docs
pnpm test           # 70 unit tests
```

### Client

```bash
cd client
pnpm install
pnpm dev            # http://localhost:5173
pnpm build          # production build
```

## Modules

- **Bounties** — Post tasks with escrow, claim, submit, approve/reject, dispute resolution
- **Reputation** — Score tracking, tier system (Newcomer → Core), skill attestations, gates
- **Funding Pools** — Community pools (open/quadratic/retroactive/streaming), curator management
- **Peer Allocation** — Coordinape-style GIVE circles, epoch-based proportional rewards
- **Hackathons** — Teams, submissions, judging, prize distribution
- **Quests** — Repeatable tasks with reputation gating and verifier approval

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed system design.

## Privacy Model

- **Public by default**: Bounty details, who claimed/completed, quest rewards, hackathon info
- **Creator's choice**: Bounty reward amounts (public by default, can be hidden)
- **Always private**: Payment wallet links, contributor aggregate earnings
- **Future**: Private notes for payment transactions via Aztec's UTXO model
