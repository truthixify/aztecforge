# AztecForge Architecture

## System Overview

AztecForge is a private community incentive platform built on Aztec Network. It has three layers:

```
┌──────────────────────────────────────────────────┐
│  Client (Vite + React + TypeScript + Tailwind)   │
│  - Dashboard pages for each module               │
│  - API client with React Query                   │
│  - Type-safe interfaces matching server entities  │
└────────────────────────┬─────────────────────────┘
                         │ REST API (/api)
┌────────────────────────▼─────────────────────────┐
│  Server (NestJS + TypeScript)                     │
│  - 6 domain modules with controllers + services   │
│  - In-memory storage (production: Aztec PXE)      │
│  - Swagger docs at /docs                          │
│  - Validation via class-validator                  │
└────────────────────────┬─────────────────────────┘
                         │ (future: Aztec.js / PXE)
┌────────────────────────▼─────────────────────────┐
│  Contracts (Noir / Aztec.nr)                      │
│  - 6 smart contracts in Nargo workspace           │
│  - Public state for browsable data                │
│  - Poseidon2 hashing for composite keys           │
│  - aztec-nr v4.1.0-rc.2                           │
└──────────────────────────────────────────────────┘
```

## Modules

| Module | Contract | Server Module | Client Page | Description |
|--------|----------|---------------|-------------|-------------|
| Bounties | `bounty/` | `bounties/` | `BountiesPage` | Task board with escrow, claiming, submission, approval |
| Reputation | `reputation/` | `reputation/` | `ReputationPage` | Contributor scores, tiers, skill attestations, gates |
| Funding Pools | `funding-pool/` | `funding-pools/` | `PoolsPage` | Community funding with deposit/allocate/curator |
| Peer Allocation | `peer-allocation/` | `peer-allocation/` | `CirclesPage` | Coordinape-style GIVE circles with epoch rewards |
| Hackathons | `hackathon/` | `hackathons/` | `HackathonsPage` | Full hackathon lifecycle with teams/judging/prizes |
| Quests | `quest/` | `quests/` | `QuestsPage` | Repeatable tasks with reputation gating and verification |

## Contract Architecture

All contracts are public-state-first (using `PublicMutable` and `Map`). This is intentional for the MVP — contributors need to browse bounties, see who completed what, and check reputation publicly. Privacy features (private notes for payment transactions, private aggregate earnings) will be added in a later iteration using Aztec's private state primitives.

### Key Patterns

- **Composite keys via Poseidon2**: When state needs to be keyed by multiple values (e.g., pool + depositor), we use `poseidon2_hash([field1, field2])` as the map key.
- **Self-incrementing IDs**: Each entity type (bounty, pool, circle, etc.) uses a counter stored in public state.
- **Access control via `self.msg_sender()`**: Creator/admin checks in every mutating function.
- **Status enums as u8**: Each entity has a status field tracking its lifecycle state.

### Bounty Amount Visibility

Bounty reward amounts are **public by default**. Creators can opt to hide them (`is_amount_public = false`) for sensitive tasks. When hidden, the public listing shows `0` and the UI displays "Hidden reward." The actual amount is always tracked in the escrow balance.

## Server Architecture

The server uses NestJS with a module-per-domain structure. Each module has:
- **Controller**: REST endpoints with Swagger documentation
- **Service**: Business logic with in-memory state
- **DTOs**: Request validation with class-validator
- **Entity types**: Shared interfaces in `common/entities/`

Authentication is simulated via the `x-sender` header — the caller passes their address. In production, this will be replaced by Aztec wallet signatures.

### API Conventions

- `POST /api/{resource}` — Create
- `GET /api/{resource}` — List all
- `GET /api/{resource}/:id` — Get one
- `GET /api/{resource}/stats` — Aggregate statistics
- `PATCH /api/{resource}/:id/{action}` — State transitions (claim, approve, etc.)
- All mutating endpoints require `x-sender` header

## Client Architecture

The client is a single-page app with React Router. Each page corresponds to a server module and uses React Query for data fetching.

### Structure

- `components/` — Shared UI: Layout, StatCard, StatusBadge
- `pages/` — One page per module
- `lib/api.ts` — Typed API client wrapping axios
- `types/` — TypeScript interfaces matching server entities

### Styling

Tailwind CSS with a dark theme (gray-950 base). No component library — all UI is built from Tailwind utilities for full control.
