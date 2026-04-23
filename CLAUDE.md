# AztecForge — Standing Instructions

## Project Overview

AztecForge is a private community incentive platform built on Aztec Network. It combines bounties, funding pools, hackathons, peer-based reward allocation, quests, and private contributor reputation into a single platform — all with privacy by default.

The project has three packages:
- `contracts/` — Noir smart contracts (Aztec.nr) for on-chain logic
- `client/` — Vite + React + TypeScript frontend
- `server/` — NestJS + TypeScript backend API

## Commit Rules

- Commit regularly — small, focused commits with clear messages.
- Do NOT add any co-author trailers or Claude attribution to commits.
- Push after each meaningful batch of work (end of feature, end of iteration, before switching contexts).
- Use conventional commit style: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

## Code Style

- **TypeScript (client + server):** Strict mode everywhere. No `any` unless justified with a comment. ESLint + Prettier enforced.
- **NestJS (server):** Idiomatic patterns — modules, controllers, services, DTOs with class-validator. Use dependency injection properly.
- **Vite + React (client):** Functional components, hooks, standard file structure. No CSS-in-JS unless requested.
- **Noir (contracts):** Follow Aztec.nr patterns — `#[aztec]` contract macro, `#[storage]` structs, `#[external("private")]`/`#[external("public")]`/`#[external("utility")]` function annotations. Use `self.storage` access pattern.

## Testing

- Write tests for every new piece of code and when modifying existing code.
- Contracts: Noir test functions (`#[test]`) and TypeScript integration tests via Aztec.js.
- Server: Jest unit tests for services, e2e tests for API endpoints.
- Client: Vitest for unit tests, React Testing Library for component tests.

## Documentation

- Keep READMEs updated for each package.
- Architecture notes at `docs/architecture.md`.
- Inline comments only where the logic is non-obvious.
- Update this file if project conventions change.

## Aztec-Specific Notes

- Aztec toolchain version: nargo 1.0.0-beta.18, aztec-nr v4.1.0-rc.2
- Node.js v24 required
- Contracts compile with `aztec compile` or `nargo compile`
- Private functions run client-side (PXE), public functions run on-chain (AVM)
- Private state uses notes (UTXO model) — create, nullify, recreate pattern
- Public state uses traditional key-value storage
- Private cannot call public synchronously; public cannot call private
- `msg_sender` is leaked when private calls public — use intermediary contracts where needed

## Project Structure

```
aztecforge/
├── CLAUDE.md
├── README.md
├── package.json          # Root workspace config
├── pnpm-workspace.yaml
├── contracts/
│   ├── Nargo.toml        # Workspace root for Noir contracts
│   ├── bounty/           # BountyBoard contract
│   ├── reputation/       # ReputationRegistry contract
│   ├── funding-pool/     # FundingPool contract
│   ├── peer-allocation/  # PeerAllocation (Private Coordinape) contract
│   ├── hackathon/        # HackathonEngine contract
│   └── quest/            # QuestTracker contract
├── client/               # Vite + React frontend
├── server/               # NestJS backend
└── docs/                 # Architecture and design docs
```
