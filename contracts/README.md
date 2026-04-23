# AztecForge Contracts

6 Noir smart contracts compiled against aztec-nr v4.1.0-rc.2.

## Contracts

| Contract | Directory | Functions | Description |
|----------|-----------|-----------|-------------|
| BountyBoard | `bounty/` | 12 write + 16 read | Bounty lifecycle with escrow |
| ReputationRegistry | `reputation/` | 9 write + 10 read | Score/tier tracking, skill attestations, gates |
| FundingPool | `funding-pool/` | 7 write + 12 read | Community funding pools |
| PeerAllocation | `peer-allocation/` | 6 write + 10 read | GIVE circles, epoch rewards |
| HackathonEngine | `hackathon/` | 11 write + 10 read | Full hackathon lifecycle |
| QuestTracker | `quest/` | 5 write + 12 read | Quests with verifiers |

## Build

```bash
./build.sh      # compile all
./test.sh       # test all
```

Or individually:
```bash
cd bounty && aztec compile
```

## Key Patterns

- All contracts use `self.msg_sender()` for access control
- Composite keys use `poseidon2_hash` from `aztec::protocol::hash`
- Public state with `PublicMutable` and `Map` for browsable data
- Status tracking via `u8` fields
- `#[view]` annotation for read-only public functions
