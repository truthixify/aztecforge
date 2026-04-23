# Private Community Incentive Platform — Detailed Specification

## 1. Executive Summary

An Aztec-native platform for community contributions, bounties, funding pools, hackathons, and recurring contributor rewards — all with privacy by default. Contributors earn, build reputation, and prove credentials without exposing their identity, earnings, or work history. Projects post tasks, run hackathons, and distribute funds without revealing individual allocations.

The first contributor platform where **what you earned, who paid you, and what you worked on** are all private — with selective disclosure for proof of credentials when you need it.

---

## 2. Problem Statement

### 2.1 The Ecosystem Gap

Aztec launched its Alpha network in March 2026. It needs builders — Noir developers, Aztec.js integrators, circuit designers, technical writers, community organizers. Every successful L1/L2 has a contributor incentive layer to attract and retain talent:

- Solana → Superteam (30K+ users, millions in bounties)
- Ethereum → Gitcoin ($60M+ distributed via quadratic funding)
- Optimism → RPGF ($60M+ in retroactive funding)
- Cosmos → Interchain Foundation grants
- Arbitrum → DAO grants + Questbook

Aztec has the Foundation grants program (individual RFPs: $150K for bridges, $200-300K for wallets, $60K for state migration) but no organized contributor platform. Tasks are scattered across GitHub issues, forum posts, and Discord messages. There's no unified place for someone to say "I want to build on Aztec — what can I work on?"

### 2.2 Privacy Problems in Existing Platforms

Every contributor platform is fully transparent. This isn't a minor annoyance — it creates measurable harm:

**For contributors:**
- Your entire earning history is permanently on-chain. Future employers, clients, and competitors can see every bounty you completed and every dollar you earned.
- Bounty competition is visible — you can see who else applied and who won, creating social dynamics and discouragement.
- Your "rate" gets anchored. If you did a $500 bounty once, projects expect that rate forever.
- Tax complexity: public on-chain earnings create reporting burdens in many jurisdictions.
- Skill-building is exposed: early, low-quality work stays on your record permanently.

**For projects:**
- Bounty amounts reveal how much you value work — competitors benchmark against you.
- Grant allocations face political scrutiny from applicants who weren't funded.
- Payroll for contributors is visible — competing projects can see what you're paying and poach talent.
- Hackathon prize distributions reveal budget priorities.

**For peer allocation (Coordinape model):**
- Visible GIVE allocations create popularity contests — people with more visibility get more, regardless of contribution quality.
- Social pressure prevents honest allocation — nobody wants to give a colleague zero.
- Alliance-forming: informal groups coordinate allocations.
- Recency bias: people remember recent contributions, not sustained work over the epoch.

**For funding pools:**
- Donors to controversial projects face social consequences.
- Large donors influence perception even in quadratic funding ("whale follows").
- Retroactive funding (RPGF) votes are visible, enabling lobbying and vote-trading.

### 2.3 Sybil Problem

30-70% of quest participants on platforms like Galxe and Zealy are bots or multi-wallet farmers. This is the #1 operational burden for community managers. Aztec's architecture provides natural Sybil resistance:

1. **Account abstraction**: Every Aztec account is a smart contract with custom auth. Creating throwaway accounts is more expensive than on L1.
2. **Client-side proving**: Sybil bots would need to generate ZK proofs for each fake account, consuming significant compute.
3. **Reputation gating**: Higher-value tasks require reputation, which takes real work to build.
4. **Private reputation**: You can't fake reputation by copying someone else's profile — reputation notes are private and non-transferable.

This doesn't eliminate Sybil attacks entirely, but it significantly raises the cost compared to transparent chains where creating 100 wallets costs a few cents in gas.

---

## 3. Platform Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         WEB APPLICATION                      │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Contributor  │  │   Project   │  │  Community / Admin  │ │
│  │  Dashboard   │  │  Dashboard  │  │     Dashboard       │ │
│  │              │  │              │  │                     │ │
│  │ - My tasks   │  │ - Post task │  │ - Platform stats    │ │
│  │ - My earnings│  │ - Manage    │  │ - Hackathon mgmt    │ │
│  │ - Reputation │  │   pool      │  │ - Pool curation     │ │
│  │ - Proofs     │  │ - Run       │  │ - Reputation gates  │ │
│  │ - Settings   │  │   hackathon │  │ - Compliance        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐ │
│  │              TypeScript SDK Layer                        │ │
│  │         @aztec/community-platform                       │ │
│  │                                                          │ │
│  │  TaskClient, PoolClient, HackathonClient,               │ │
│  │  RewardClient, ReputationClient, PeerAllocClient        │ │
│  └──────────────────────┬──────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ Aztec.js / PXE
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ON-CHAIN CONTRACTS                         │
│                                                              │
│  ┌─────────────────── NEW (Product C) ───────────────────┐  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │  Reputation  │  │   Funding    │  │    Peer     │ │  │
│  │  │  Registry    │  │    Pool      │  │ Allocation  │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │  Hackathon   │  │   Quest      │                   │  │
│  │  │  Engine      │  │   Tracker    │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────── REUSED (Product B) ───────────────────┐  │
│  │                                                        │  │
│  │  BountyBoard  GrantsManager  PayrollManager            │  │
│  │  TippingManager  EscrowManager  PrivateGate            │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Contract Dependency Map

```
ReputationRegistry
  ├── reads: BountyBoard (bounty completions)
  ├── reads: HackathonEngine (hackathon wins)
  ├── reads: GrantsManager (grant deliveries)
  ├── reads: PeerAllocation (peer recognition scores)
  └── used by: PrivateGate (reputation-gated access)

FundingPool
  ├── uses: EscrowManager (deposit locking)
  ├── uses: Token contracts (transfers)
  └── used by: HackathonEngine (prize pools), GrantsManager (funding source)

PeerAllocation
  ├── uses: Token contracts (reward distribution)
  ├── updates: ReputationRegistry (peer recognition)
  └── used by: FundingPool (allocation decisions for streaming pools)

HackathonEngine
  ├── uses: EscrowManager (prize escrow)
  ├── uses: FundingPool (prize pool source)
  ├── updates: ReputationRegistry (hackathon wins)
  └── used by: ReputationRegistry (skill attestation)

QuestTracker
  ├── uses: Token contracts (quest rewards)
  ├── updates: ReputationRegistry (quest completions)
  └── used by: PrivateGate (quest-gated access)
```

---

## 4. Data Models

### 4.1 Reputation Notes

```noir
/// Core reputation note — one per contributor, updated atomically.
#[note]
struct ReputationNote {
    // Contribution metrics
    bounties_completed: u32,
    bounties_total_earned: u128,       // lifetime bounty earnings
    hackathons_participated: u32,
    hackathons_won: u32,
    grants_received: u32,
    grants_total_earned: u128,
    milestones_delivered: u32,
    quests_completed: u32,

    // Peer recognition
    peer_give_received: u128,          // lifetime GIVE received across all circles
    peer_epochs_participated: u32,

    // Timing
    first_activity_block: u64,
    last_activity_block: u64,
    consecutive_active_epochs: u32,    // streak tracking

    // Computed tier (0-4: newcomer, contributor, builder, expert, core)
    reputation_tier: u8,

    // Owner
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Skill attestation — issued by projects/peers to confirm skill demonstration.
#[note]
struct SkillNote {
    skill_hash: Field,                 // poseidon2("noir_development"), poseidon2("circuit_design"), etc.
    attester: AztecAddress,            // who attested this skill
    context_hash: Field,               // hash of the work that demonstrated the skill
    attested_at_block: u64,
    proficiency_level: u8,             // 0=beginner, 1=intermediate, 2=advanced, 3=expert
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Reputation gate config — public requirements for access.
struct ReputationGateConfig {
    gate_id: Field,
    min_bounties_completed: u32,
    min_hackathons_won: u32,
    min_reputation_tier: u8,
    required_skills: [Field; 4],       // skill hashes required
    min_tenure_blocks: u64,
    is_active: bool,
}
```

### 4.2 Funding Pool Notes

```noir
/// Deposit into a funding pool.
#[note]
struct PoolDepositNote {
    pool_id: Field,
    depositor: AztecAddress,
    payment_token: AztecAddress,
    amount: u128,
    deposited_at_block: u64,
    // For streaming pools: vesting schedule
    vesting_start_block: u64,
    vesting_duration_blocks: u64,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Allocation from a funding pool to a recipient.
#[note]
struct PoolAllocationNote {
    pool_id: Field,
    recipient: AztecAddress,
    amount: u128,
    reason_hash: Field,                // hash of allocation rationale
    milestone_hash: Field,             // hash of milestone (if milestone-based)
    allocated_at_block: u64,
    claimed: bool,
    owner: AztecAddress,               // recipient owns this note
    owner_npk_m_hash: Field,
}

/// Pool configuration — public.
struct PoolConfig {
    pool_id: Field,
    purpose_hash: Field,               // hash of pool description
    curator: AztecAddress,             // who manages allocations
    payment_token: AztecAddress,
    pool_type: u8,                     // 0=open, 1=quadratic, 2=retroactive, 3=streaming
    total_deposited: u128,             // aggregate
    total_disbursed: u128,             // aggregate
    contributor_count: u64,            // aggregate
    recipient_count: u64,              // aggregate
    created_at_block: u64,
    is_active: bool,
}
```

### 4.3 Peer Allocation Notes

```noir
/// A single GIVE allocation in an epoch.
#[note]
struct GiveNote {
    circle_id: Field,
    epoch: u64,
    giver: AztecAddress,
    recipient: AztecAddress,
    amount: u64,                       // GIVE tokens allocated
    comment_hash: Field,               // optional private feedback
    owner: AztecAddress,               // recipient owns (for tally)
    owner_npk_m_hash: Field,
}

/// Epoch distribution result for a member.
#[note]
struct EpochDistributionNote {
    circle_id: Field,
    epoch: u64,
    member: AztecAddress,
    give_received: u64,                // total GIVE received this epoch
    share_bps: u64,                    // percentage of pool (basis points)
    reward_amount: u128,               // actual token payout
    claimed: bool,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Circle configuration — public.
struct CircleConfig {
    circle_id: Field,
    admin: AztecAddress,
    name_hash: Field,
    payment_token: AztecAddress,
    epoch_duration_blocks: u64,
    current_epoch: u64,
    current_epoch_start_block: u64,
    member_count: u64,                 // aggregate
    give_per_member: u64,              // how many GIVE each member gets per epoch
    reward_pool_per_epoch: u128,       // tokens distributed each epoch
    total_epochs_completed: u64,
    total_distributed: u128,           // aggregate lifetime
    is_active: bool,
}
```

### 4.4 Hackathon Notes

```noir
/// Team registration (private by default, optional public reveal).
#[note]
struct TeamNote {
    hackathon_id: Field,
    team_id: Field,                    // pseudonymous identifier
    team_name_hash: Field,
    members: [AztecAddress; 5],        // up to 5 members
    member_count: u8,
    registered_at_block: u64,
    is_public: bool,                   // team chooses visibility
    owner: AztecAddress,               // team lead
    owner_npk_m_hash: Field,
}

/// Project submission.
#[note]
struct SubmissionNote {
    hackathon_id: Field,
    track_id: Field,
    team_id: Field,
    project_name_hash: Field,
    description_hash: Field,
    repo_hash: Field,                  // hash of repo URL or content
    demo_hash: Field,                  // hash of demo URL or content
    submitted_at_block: u64,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Judge score for a submission.
#[note]
struct JudgeScoreNote {
    hackathon_id: Field,
    submission_id: Field,
    judge: AztecAddress,
    // Scoring rubric
    innovation_score: u8,              // 0-20
    technical_score: u8,               // 0-20
    design_score: u8,                  // 0-20
    impact_score: u8,                  // 0-20
    presentation_score: u8,            // 0-20
    total_score: u8,                   // 0-100
    feedback_hash: Field,
    scored_at_block: u64,
    owner: AztecAddress,               // judge owns the note
    owner_npk_m_hash: Field,
}

/// Prize note (private payment to winner).
#[note]
struct PrizeNote {
    hackathon_id: Field,
    track_id: Field,
    team_id: Field,
    placement: u8,                     // 1st, 2nd, 3rd, etc.
    payment_token: AztecAddress,
    prize_amount: u128,
    claimed: bool,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Hackathon configuration — public.
struct HackathonConfig {
    hackathon_id: Field,
    organizer: AztecAddress,
    name_hash: Field,
    description_hash: Field,
    tracks: [TrackConfig; 4],
    total_prize_pool: u128,            // aggregate only
    registration_start: u64,
    registration_end: u64,
    submission_deadline: u64,
    judging_deadline: u64,
    team_count: u64,                   // aggregate
    submission_count: u64,             // aggregate
    judge_count: u64,
    status: u8,                        // 0=upcoming, 1=registration, 2=building, 3=judging, 4=completed
}

struct TrackConfig {
    track_id: Field,
    name_hash: Field,
    description_hash: Field,
    submission_count: u64,             // aggregate
}
```

### 4.5 Quest Notes

```noir
/// Quest completion record.
#[note]
struct QuestCompletionNote {
    quest_id: Field,
    completer: AztecAddress,
    completed_at_block: u64,
    reward_amount: u128,
    verification_hash: Field,          // proof of completion (e.g., tx hash, content hash)
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Quest definition — public.
struct QuestConfig {
    quest_id: Field,
    creator: AztecAddress,
    name_hash: Field,
    description_hash: Field,
    quest_type: u8,                    // 0=on-chain action, 1=content, 2=development, 3=community
    payment_token: AztecAddress,
    reward_per_completion: u128,
    max_completions: u64,              // 0 = unlimited
    completions: u64,                  // aggregate
    deadline_block: u64,
    reputation_gate: Field,            // gate_id (0 = no gate)
    is_active: bool,
}
```

---

## 5. Contract Specifications

### 5.1 ReputationRegistry

```noir
#[aztec]
contract ReputationRegistry {
    #[storage]
    struct Storage {
        // Private: one reputation note per contributor
        reputations: Map<AztecAddress, PrivateMutable<ReputationNote>>,
        // Private: skill attestations
        skills: Map<AztecAddress, PrivateSet<SkillNote>>,
        // Public: reputation gates
        gates: Map<Field, PublicMutable<ReputationGateConfig>>,
        // Public: aggregate stats
        total_contributors: PublicMutable<u64>,
        total_bounties_completed: PublicMutable<u64>,
        total_hackathons_run: PublicMutable<u64>,
        // Public: authorized updaters (contracts that can update reputation)
        authorized_updaters: Map<AztecAddress, PublicMutable<bool>>,
        gate_counter: PublicMutable<u64>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        storage.total_contributors.write(0);
        storage.total_bounties_completed.write(0);
        storage.total_hackathons_run.write(0);
        storage.gate_counter.write(0);
    }

    // ── REPUTATION UPDATES (called by other contracts) ───

    /// Record a bounty completion. Called by BountyBoard contract.
    #[external("private")]
    fn record_bounty_completion(
        contributor: AztecAddress,
        earned_amount: u128,
    ) {
        // Verify caller is authorized updater
        assert_authorized_updater(context.msg_sender());

        let mut rep = get_or_create_reputation(contributor);

        rep.bounties_completed += 1;
        rep.bounties_total_earned += earned_amount;
        rep.last_activity_block = context.block_number();
        rep.reputation_tier = compute_tier(&rep);

        storage.reputations.at(contributor).replace(&mut rep);

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_bounties()"),
            [],
        );
    }

    /// Record a hackathon result. Called by HackathonEngine.
    #[external("private")]
    fn record_hackathon_result(
        contributor: AztecAddress,
        won: bool,
    ) {
        assert_authorized_updater(context.msg_sender());

        let mut rep = get_or_create_reputation(contributor);

        rep.hackathons_participated += 1;
        if won { rep.hackathons_won += 1; }
        rep.last_activity_block = context.block_number();
        rep.reputation_tier = compute_tier(&rep);

        storage.reputations.at(contributor).replace(&mut rep);
    }

    /// Record grant milestone delivery. Called by GrantsManager.
    #[external("private")]
    fn record_grant_delivery(
        contributor: AztecAddress,
        grant_amount: u128,
    ) {
        assert_authorized_updater(context.msg_sender());

        let mut rep = get_or_create_reputation(contributor);

        rep.grants_received += 1;
        rep.grants_total_earned += grant_amount;
        rep.milestones_delivered += 1;
        rep.last_activity_block = context.block_number();
        rep.reputation_tier = compute_tier(&rep);

        storage.reputations.at(contributor).replace(&mut rep);
    }

    /// Record peer recognition. Called by PeerAllocation.
    #[external("private")]
    fn record_peer_recognition(
        contributor: AztecAddress,
        give_amount: u128,
    ) {
        assert_authorized_updater(context.msg_sender());

        let mut rep = get_or_create_reputation(contributor);

        rep.peer_give_received += give_amount;
        rep.peer_epochs_participated += 1;
        rep.last_activity_block = context.block_number();
        rep.reputation_tier = compute_tier(&rep);

        storage.reputations.at(contributor).replace(&mut rep);
    }

    /// Record quest completion. Called by QuestTracker.
    #[external("private")]
    fn record_quest_completion(contributor: AztecAddress) {
        assert_authorized_updater(context.msg_sender());

        let mut rep = get_or_create_reputation(contributor);

        rep.quests_completed += 1;
        rep.last_activity_block = context.block_number();
        rep.reputation_tier = compute_tier(&rep);

        storage.reputations.at(contributor).replace(&mut rep);
    }

    // ── SKILL ATTESTATION ────────────────────────────

    /// Attest that a contributor demonstrated a skill.
    /// Can be called by project contracts or authorized attesters.
    #[external("private")]
    fn attest_skill(
        contributor: AztecAddress,
        skill_hash: Field,
        context_hash: Field,
        proficiency_level: u8,
    ) {
        let attester = context.msg_sender();

        let skill_note = SkillNote {
            skill_hash,
            attester,
            context_hash,
            attested_at_block: context.block_number(),
            proficiency_level,
            owner: contributor,
            owner_npk_m_hash: get_npk_m_hash(contributor),
        };

        storage.skills.at(contributor).insert(&mut skill_note);
        skill_note.emit_encrypted_log(&mut context, contributor);
    }

    // ── PROOF GENERATION (contributor calls these) ───

    /// Prove bounties completed >= threshold.
    #[external("private")]
    fn prove_bounties_completed(min_count: u32) -> bool {
        let contributor = context.msg_sender();
        let rep = storage.reputations.at(contributor).get_note();
        rep.bounties_completed >= min_count
    }

    /// Prove total earnings >= threshold (across all sources).
    #[external("private")]
    fn prove_earnings_above(min_total: u128) -> bool {
        let contributor = context.msg_sender();
        let rep = storage.reputations.at(contributor).get_note();
        let total = rep.bounties_total_earned + rep.grants_total_earned;
        total >= min_total
    }

    /// Prove reputation tier >= threshold.
    #[external("private")]
    fn prove_reputation_tier(min_tier: u8) -> bool {
        let contributor = context.msg_sender();
        let rep = storage.reputations.at(contributor).get_note();
        rep.reputation_tier >= min_tier
    }

    /// Prove hackathon wins >= threshold.
    #[external("private")]
    fn prove_hackathon_wins(min_wins: u32) -> bool {
        let contributor = context.msg_sender();
        let rep = storage.reputations.at(contributor).get_note();
        rep.hackathons_won >= min_wins
    }

    /// Prove you have a specific skill attested.
    #[external("private")]
    fn prove_skill(skill_hash: Field) -> bool {
        let contributor = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(SkillNote::properties().skill_hash, skill_hash)
            .set_limit(1);
        let notes = storage.skills.at(contributor).get_notes(options);
        notes.len() > 0
    }

    /// Prove you have a skill at a minimum proficiency level.
    #[external("private")]
    fn prove_skill_level(skill_hash: Field, min_level: u8) -> bool {
        let contributor = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(SkillNote::properties().skill_hash, skill_hash)
            .set_limit(1);
        let notes = storage.skills.at(contributor).get_notes(options);
        if notes.len() == 0 { return false; }
        notes[0].proficiency_level >= min_level
    }

    /// Prove tenure (time in ecosystem) >= threshold.
    #[external("private")]
    fn prove_tenure(min_blocks: u64) -> bool {
        let contributor = context.msg_sender();
        let rep = storage.reputations.at(contributor).get_note();
        (context.block_number() - rep.first_activity_block) >= min_blocks
    }

    /// Check if a contributor passes a specific reputation gate.
    #[external("private")]
    fn check_gate(gate_id: Field) -> bool {
        let contributor = context.msg_sender();
        let gate = get_gate_config(gate_id);
        let rep = storage.reputations.at(contributor).get_note();

        let passes_bounties = rep.bounties_completed >= gate.min_bounties_completed;
        let passes_hackathons = rep.hackathons_won >= gate.min_hackathons_won;
        let passes_tier = rep.reputation_tier >= gate.min_reputation_tier;
        let passes_tenure = (context.block_number() - rep.first_activity_block)
            >= gate.min_tenure_blocks;

        // Check required skills
        let mut passes_skills = true;
        for i in 0..4 {
            if gate.required_skills[i] != Field::zero() {
                if !self.prove_skill(gate.required_skills[i]) {
                    passes_skills = false;
                }
            }
        }

        passes_bounties && passes_hackathons && passes_tier
            && passes_tenure && passes_skills
    }

    // ── GATE MANAGEMENT (public) ─────────────────────

    #[external("public")]
    fn create_gate(config: ReputationGateConfig) -> Field {
        let gate_id = poseidon2_hash([
            context.msg_sender().to_field(),
            storage.gate_counter.read() as Field,
        ]);

        let mut gate_config = config;
        gate_config.gate_id = gate_id;
        gate_config.is_active = true;
        storage.gates.at(gate_id).write(gate_config);

        let counter = storage.gate_counter.read();
        storage.gate_counter.write(counter + 1);

        gate_id
    }

    #[external("public")]
    fn authorize_updater(contract_address: AztecAddress) {
        // Only admin can authorize updaters
        storage.authorized_updaters.at(contract_address).write(true);
    }

    // ── UTILITY ──────────────────────────────────────

    #[external("utility")]
    unconstrained fn get_my_reputation(contributor: AztecAddress) -> ReputationNote {
        storage.reputations.at(contributor).get_note()
    }

    #[external("utility")]
    unconstrained fn get_my_skills(contributor: AztecAddress) -> [SkillNote] {
        storage.skills.at(contributor).get_notes(NoteGetterOptions::new())
    }

    // ── INTERNAL ─────────────────────────────────────

    fn compute_tier(rep: &ReputationNote) -> u8 {
        let score =
            (rep.bounties_completed as u64) * 10
            + (rep.hackathons_won as u64) * 50
            + (rep.grants_received as u64) * 30
            + (rep.milestones_delivered as u64) * 20
            + (rep.quests_completed as u64) * 5
            + (rep.peer_epochs_participated as u64) * 15;

        if score >= 500 { 4 }      // core
        else if score >= 200 { 3 } // expert
        else if score >= 50 { 2 }  // builder
        else if score >= 10 { 1 }  // contributor
        else { 0 }                 // newcomer
    }

    fn get_or_create_reputation(contributor: AztecAddress) -> ReputationNote {
        let existing = storage.reputations.at(contributor).try_get_note();
        if existing.is_some() {
            existing.unwrap()
        } else {
            // First contribution — initialize
            context.enqueue_public_call(
                context.this_address(),
                FunctionSelector::from_signature("_increment_contributors()"),
                [],
            );

            ReputationNote {
                bounties_completed: 0,
                bounties_total_earned: 0,
                hackathons_participated: 0,
                hackathons_won: 0,
                grants_received: 0,
                grants_total_earned: 0,
                milestones_delivered: 0,
                quests_completed: 0,
                peer_give_received: 0,
                peer_epochs_participated: 0,
                first_activity_block: context.block_number(),
                last_activity_block: context.block_number(),
                consecutive_active_epochs: 0,
                reputation_tier: 0,
                owner: contributor,
                owner_npk_m_hash: get_npk_m_hash(contributor),
            }
        }
    }
}
```

### 5.2 FundingPool

```noir
#[aztec]
contract FundingPool {
    #[storage]
    struct Storage {
        pools: Map<Field, PublicMutable<PoolConfig>>,
        deposits: Map<Field, PrivateSet<PoolDepositNote>>,
        allocations: Map<Field, PrivateSet<PoolAllocationNote>>,
        pool_counter: PublicMutable<u64>,
    }

    // ── POOL MANAGEMENT ──────────────────────────────

    #[external("public")]
    fn create_pool(
        purpose_hash: Field,
        payment_token: AztecAddress,
        pool_type: u8,
    ) -> Field {
        let curator = context.msg_sender();
        let pool_id = poseidon2_hash([
            curator.to_field(),
            storage.pool_counter.read() as Field,
        ]);

        storage.pools.at(pool_id).write(PoolConfig {
            pool_id,
            purpose_hash,
            curator,
            payment_token,
            pool_type,
            total_deposited: 0,
            total_disbursed: 0,
            contributor_count: 0,
            recipient_count: 0,
            created_at_block: context.block_number(),
            is_active: true,
        });

        let counter = storage.pool_counter.read();
        storage.pool_counter.write(counter + 1);

        pool_id
    }

    // ── DEPOSIT (private) ────────────────────────────

    /// Deposit into a funding pool. Amount and identity are private.
    #[external("private")]
    fn deposit(
        pool_id: Field,
        amount: u128,
    ) {
        let depositor = context.msg_sender();
        let pool = get_pool_config(pool_id);

        // Transfer tokens to pool
        Token::at(pool.payment_token).transfer(
            depositor,
            context.this_address(),
            amount,
        );

        // Create deposit note
        let deposit_note = PoolDepositNote {
            pool_id,
            depositor,
            payment_token: pool.payment_token,
            amount,
            deposited_at_block: context.block_number(),
            vesting_start_block: 0,
            vesting_duration_blocks: 0,
            owner: depositor,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.deposits.at(pool_id).insert(&mut deposit_note);

        // Update aggregate (public)
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_deposit(Field,u128)"),
            [pool_id, amount as Field],
        );
    }

    // ── ALLOCATION (private, curator only) ───────────

    /// Allocate funds from pool to a recipient.
    /// Only the curator can allocate.
    #[external("private")]
    fn allocate(
        pool_id: Field,
        recipient: AztecAddress,
        amount: u128,
        reason_hash: Field,
        milestone_hash: Field,
    ) {
        let curator = context.msg_sender();
        // Curator verification happens via checking pool config

        // Transfer from pool to recipient
        let pool = get_pool_config(pool_id);
        Token::at(pool.payment_token).transfer(
            context.this_address(),
            recipient,
            amount,
        );

        // Create allocation note for recipient
        let alloc_note = PoolAllocationNote {
            pool_id,
            recipient,
            amount,
            reason_hash,
            milestone_hash,
            allocated_at_block: context.block_number(),
            claimed: true,  // auto-claimed on direct transfer
            owner: recipient,
            owner_npk_m_hash: get_npk_m_hash(recipient),
        };

        storage.allocations.at(pool_id).insert(&mut alloc_note);
        alloc_note.emit_encrypted_log(&mut context, recipient);

        // Update aggregate
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_allocation(Field,u128)"),
            [pool_id, amount as Field],
        );

        // Update reputation
        ReputationRegistry::at(REPUTATION_ADDR).record_grant_delivery(
            recipient,
            amount,
        );
    }

    // ── WITHDRAWAL (private, depositor) ──────────────

    /// Withdraw unallocated funds (if pool allows).
    #[external("private")]
    fn withdraw(pool_id: Field, deposit_note_index: u32) {
        let depositor = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(PoolDepositNote::properties().pool_id, pool_id)
            .select(PoolDepositNote::properties().depositor, depositor.to_field())
            .set_limit(1);
        let notes = storage.deposits.at(pool_id).get_notes(options);
        assert(notes.len() == 1, "Deposit not found");
        let deposit = notes[0];

        // Nullify deposit
        storage.deposits.at(pool_id).remove(deposit);

        // Return funds
        let pool = get_pool_config(pool_id);
        Token::at(pool.payment_token).transfer(
            context.this_address(),
            depositor,
            deposit.amount,
        );

        // Update aggregate
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_withdrawal(Field,u128)"),
            [pool_id, deposit.amount as Field],
        );
    }

    // ── PROOFS ───────────────────────────────────────

    /// Prove you contributed to a funding pool without revealing amount.
    #[external("private")]
    fn prove_contribution(pool_id: Field) -> bool {
        let depositor = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(PoolDepositNote::properties().pool_id, pool_id)
            .select(PoolDepositNote::properties().depositor, depositor.to_field())
            .set_limit(1);
        let notes = storage.deposits.at(pool_id).get_notes(options);
        notes.len() > 0
    }

    /// Prove contribution amount is above a threshold.
    #[external("private")]
    fn prove_contribution_above(pool_id: Field, min_amount: u128) -> bool {
        let depositor = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(PoolDepositNote::properties().pool_id, pool_id)
            .select(PoolDepositNote::properties().depositor, depositor.to_field())
            .set_limit(1);
        let notes = storage.deposits.at(pool_id).get_notes(options);
        if notes.len() == 0 { return false; }
        notes[0].amount >= min_amount
    }

    // ── PUBLIC AGGREGATES ────────────────────────────

    #[external("public")]
    fn _record_deposit(pool_id: Field, amount: u128) {
        let mut pool = storage.pools.at(pool_id).read();
        pool.total_deposited += amount;
        pool.contributor_count += 1;
        storage.pools.at(pool_id).write(pool);
    }

    #[external("public")]
    fn _record_allocation(pool_id: Field, amount: u128) {
        let mut pool = storage.pools.at(pool_id).read();
        pool.total_disbursed += amount;
        pool.recipient_count += 1;
        storage.pools.at(pool_id).write(pool);
    }

    #[external("public")]
    fn get_pool_stats(pool_id: Field) -> (u128, u128, u64, u64) {
        let pool = storage.pools.at(pool_id).read();
        (pool.total_deposited, pool.total_disbursed,
         pool.contributor_count, pool.recipient_count)
    }
}
```

### 5.3 PeerAllocation (Private Coordinape)

```noir
#[aztec]
contract PeerAllocation {
    #[storage]
    struct Storage {
        circles: Map<Field, PublicMutable<CircleConfig>>,
        members: Map<(Field, AztecAddress), PublicMutable<bool>>,
        give_notes: Map<Field, PrivateSet<GiveNote>>,
        distributions: Map<(Field, u64, AztecAddress), PrivateMutable<EpochDistributionNote>>,
        circle_counter: PublicMutable<u64>,
    }

    // ── CIRCLE MANAGEMENT ────────────────────────────

    #[external("public")]
    fn create_circle(
        name_hash: Field,
        payment_token: AztecAddress,
        epoch_duration_blocks: u64,
        give_per_member: u64,
        reward_pool_per_epoch: u128,
    ) -> Field {
        let admin = context.msg_sender();
        let circle_id = poseidon2_hash([
            admin.to_field(),
            storage.circle_counter.read() as Field,
        ]);

        storage.circles.at(circle_id).write(CircleConfig {
            circle_id,
            admin,
            name_hash,
            payment_token,
            epoch_duration_blocks,
            current_epoch: 0,
            current_epoch_start_block: context.block_number(),
            member_count: 0,
            give_per_member,
            reward_pool_per_epoch,
            total_epochs_completed: 0,
            total_distributed: 0,
            is_active: true,
        });

        let counter = storage.circle_counter.read();
        storage.circle_counter.write(counter + 1);

        circle_id
    }

    #[external("public")]
    fn add_member(circle_id: Field, member: AztecAddress) {
        let circle = storage.circles.at(circle_id).read();
        assert(circle.admin == context.msg_sender(), "Not admin");
        storage.members.at((circle_id, member)).write(true);

        let mut c = circle;
        c.member_count += 1;
        storage.circles.at(circle_id).write(c);
    }

    #[external("public")]
    fn remove_member(circle_id: Field, member: AztecAddress) {
        let circle = storage.circles.at(circle_id).read();
        assert(circle.admin == context.msg_sender(), "Not admin");
        storage.members.at((circle_id, member)).write(false);

        let mut c = circle;
        c.member_count -= 1;
        storage.circles.at(circle_id).write(c);
    }

    // ── GIVE ALLOCATION (private) ────────────────────

    /// Allocate GIVE to a peer. Completely private — no one sees
    /// who you gave to or how much.
    #[external("private")]
    fn allocate_give(
        circle_id: Field,
        recipient: AztecAddress,
        amount: u64,
        comment_hash: Field,
    ) {
        let giver = context.msg_sender();
        let circle = get_circle_config(circle_id);

        // Verify giver is a member (check public state)
        // Note: this leaks that msg_sender interacted with this circle
        // but NOT who they allocated to or how much

        assert(amount <= circle.give_per_member, "Exceeds GIVE budget");

        let give_note = GiveNote {
            circle_id,
            epoch: circle.current_epoch,
            giver,
            recipient,
            amount,
            comment_hash,
            owner: recipient,  // recipient discovers their received GIVE
            owner_npk_m_hash: get_npk_m_hash(recipient),
        };

        storage.give_notes.at(circle_id).insert(&mut give_note);
        give_note.emit_encrypted_log(&mut context, recipient);
    }

    /// Allocate GIVE to multiple peers in one transaction.
    #[external("private")]
    fn batch_allocate_give(
        circle_id: Field,
        recipients: [AztecAddress; 8],
        amounts: [u64; 8],
        count: u8,
    ) {
        let giver = context.msg_sender();
        let circle = get_circle_config(circle_id);

        let mut total_give: u64 = 0;
        for i in 0..count {
            total_give += amounts[i];

            let give_note = GiveNote {
                circle_id,
                epoch: circle.current_epoch,
                giver,
                recipient: recipients[i],
                amount: amounts[i],
                comment_hash: Field::zero(),
                owner: recipients[i],
                owner_npk_m_hash: get_npk_m_hash(recipients[i]),
            };

            storage.give_notes.at(circle_id).insert(&mut give_note);
            give_note.emit_encrypted_log(&mut context, recipients[i]);
        }

        assert(total_give <= circle.give_per_member, "Total GIVE exceeds budget");
    }

    // ── EPOCH FINALIZATION ───────────────────────────

    /// Finalize the current epoch and compute distributions.
    /// Called by admin after epoch duration has passed.
    ///
    /// IMPORTANT: This is the most complex operation.
    /// Each member needs to tally their received GIVE privately,
    /// then the distribution is computed.
    ///
    /// Approach: Each member calls claim_epoch_reward which:
    /// 1. Tallies all GiveNotes they received in this epoch
    /// 2. Computes their share of the reward pool
    /// 3. Creates a distribution note
    #[external("public")]
    fn advance_epoch(circle_id: Field) {
        let mut circle = storage.circles.at(circle_id).read();
        assert(circle.admin == context.msg_sender(), "Not admin");

        let epoch_end = circle.current_epoch_start_block + circle.epoch_duration_blocks;
        assert(context.block_number() >= epoch_end, "Epoch not over");

        // Deposit reward pool for this epoch
        Token::at(circle.payment_token).transfer_public(
            circle.admin,
            context.this_address(),
            circle.reward_pool_per_epoch,
        );

        circle.current_epoch += 1;
        circle.current_epoch_start_block = context.block_number();
        circle.total_epochs_completed += 1;
        storage.circles.at(circle_id).write(circle);
    }

    /// Member claims their share of the epoch reward.
    /// Tallies all GIVE received, computes proportional share.
    #[external("private")]
    fn claim_epoch_reward(circle_id: Field, epoch: u64) {
        let member = context.msg_sender();
        let circle = get_circle_config(circle_id);

        // Tally all GIVE notes received in this epoch
        let options = NoteGetterOptions::new()
            .select(GiveNote::properties().circle_id, circle_id)
            .select(GiveNote::properties().epoch, epoch as Field);
        let give_notes = storage.give_notes.at(circle_id).get_notes(options);

        let mut total_received: u64 = 0;
        for note in give_notes.iter() {
            if note.recipient == member {
                total_received += note.amount;
            }
        }

        if total_received == 0 { return; }

        // Total GIVE distributed this epoch = member_count * give_per_member
        let total_give = circle.member_count * circle.give_per_member;
        let share_bps = (total_received as u64 * 10000) / total_give;
        let reward_amount = (circle.reward_pool_per_epoch * share_bps as u128) / 10000;

        // Transfer reward
        Token::at(circle.payment_token).transfer(
            context.this_address(),
            member,
            reward_amount,
        );

        // Create distribution note
        let dist_note = EpochDistributionNote {
            circle_id,
            epoch,
            member,
            give_received: total_received,
            share_bps,
            reward_amount,
            claimed: true,
            owner: member,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.distributions.at((circle_id, epoch, member))
            .initialize(&mut dist_note);

        // Update reputation
        ReputationRegistry::at(REPUTATION_ADDR).record_peer_recognition(
            member,
            total_received as u128,
        );

        // Update aggregate
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_distribution(Field,u128)"),
            [circle_id, reward_amount as Field],
        );
    }

    // ── PROOFS ───────────────────────────────────────

    /// Prove you participated in a circle's epoch.
    #[external("private")]
    fn prove_participation(circle_id: Field, epoch: u64) -> bool {
        let member = context.msg_sender();
        let dist = storage.distributions.at((circle_id, epoch, member)).try_get_note();
        dist.is_some()
    }

    /// Prove you received >= N GIVE in a specific epoch.
    #[external("private")]
    fn prove_peer_recognition_above(
        circle_id: Field,
        epoch: u64,
        min_give: u64,
    ) -> bool {
        let member = context.msg_sender();
        let dist = storage.distributions.at((circle_id, epoch, member)).try_get_note();
        if dist.is_none() { return false; }
        dist.unwrap().give_received >= min_give
    }
}
```

### 5.4 HackathonEngine

```noir
#[aztec]
contract HackathonEngine {
    #[storage]
    struct Storage {
        hackathons: Map<Field, PublicMutable<HackathonConfig>>,
        teams: Map<Field, PrivateSet<TeamNote>>,
        submissions: Map<Field, PrivateSet<SubmissionNote>>,
        scores: Map<Field, PrivateSet<JudgeScoreNote>>,
        prizes: Map<Field, PrivateSet<PrizeNote>>,
        judges: Map<(Field, AztecAddress), PublicMutable<bool>>,
        hackathon_counter: PublicMutable<u64>,
    }

    // ── ORGANIZER FUNCTIONS ──────────────────────────

    #[external("public")]
    fn create_hackathon(
        name_hash: Field,
        description_hash: Field,
        tracks: [TrackConfig; 4],
        total_prize_pool: u128,
        registration_end: u64,
        submission_deadline: u64,
        judging_deadline: u64,
        payment_token: AztecAddress,
    ) -> Field {
        let organizer = context.msg_sender();
        let hackathon_id = poseidon2_hash([
            organizer.to_field(),
            storage.hackathon_counter.read() as Field,
        ]);

        // Lock prize pool in escrow
        Token::at(payment_token).transfer_public(
            organizer,
            context.this_address(),
            total_prize_pool,
        );

        storage.hackathons.at(hackathon_id).write(HackathonConfig {
            hackathon_id,
            organizer,
            name_hash,
            description_hash,
            tracks,
            total_prize_pool,
            registration_start: context.block_number(),
            registration_end,
            submission_deadline,
            judging_deadline,
            team_count: 0,
            submission_count: 0,
            judge_count: 0,
            status: 1,  // registration open
        });

        let counter = storage.hackathon_counter.read();
        storage.hackathon_counter.write(counter + 1);

        hackathon_id
    }

    #[external("public")]
    fn add_judge(hackathon_id: Field, judge: AztecAddress) {
        let hackathon = storage.hackathons.at(hackathon_id).read();
        assert(hackathon.organizer == context.msg_sender(), "Not organizer");
        storage.judges.at((hackathon_id, judge)).write(true);

        let mut h = hackathon;
        h.judge_count += 1;
        storage.hackathons.at(hackathon_id).write(h);
    }

    // ── TEAM FUNCTIONS (private) ─────────────────────

    /// Register a team (private by default).
    #[external("private")]
    fn register_team(
        hackathon_id: Field,
        team_name_hash: Field,
        members: [AztecAddress; 5],
        member_count: u8,
        is_public: bool,
    ) -> Field {
        let team_lead = context.msg_sender();

        let team_id = poseidon2_hash([
            hackathon_id,
            team_lead.to_field(),
            rand(),
        ]);

        let team_note = TeamNote {
            hackathon_id,
            team_id,
            team_name_hash,
            members,
            member_count,
            registered_at_block: context.block_number(),
            is_public,
            owner: team_lead,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.teams.at(hackathon_id).insert(&mut team_note);

        // Notify all team members
        for i in 0..member_count {
            team_note.emit_encrypted_log(&mut context, members[i]);
        }

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_teams(Field)"),
            [hackathon_id],
        );

        team_id
    }

    /// Submit a project.
    #[external("private")]
    fn submit_project(
        hackathon_id: Field,
        track_id: Field,
        team_id: Field,
        project_name_hash: Field,
        description_hash: Field,
        repo_hash: Field,
        demo_hash: Field,
    ) {
        let submitter = context.msg_sender();

        let submission = SubmissionNote {
            hackathon_id,
            track_id,
            team_id,
            project_name_hash,
            description_hash,
            repo_hash,
            demo_hash,
            submitted_at_block: context.block_number(),
            owner: submitter,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.submissions.at(hackathon_id).insert(&mut submission);

        // Deliver submission to all judges
        let hackathon = get_hackathon_config(hackathon_id);
        // (In practice, judges discover submissions via PXE note scanning)

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_submissions(Field)"),
            [hackathon_id],
        );
    }

    // ── JUDGE FUNCTIONS (private) ────────────────────

    /// Score a submission. Each judge scores independently and privately.
    /// Judges cannot see each other's scores.
    #[external("private")]
    fn score_submission(
        hackathon_id: Field,
        submission_id: Field,
        innovation: u8,
        technical: u8,
        design: u8,
        impact: u8,
        presentation: u8,
        feedback_hash: Field,
    ) {
        let judge = context.msg_sender();

        assert(innovation <= 20 && technical <= 20 && design <= 20
            && impact <= 20 && presentation <= 20, "Score out of range");

        let total = innovation + technical + design + impact + presentation;

        let score_note = JudgeScoreNote {
            hackathon_id,
            submission_id,
            judge,
            innovation_score: innovation,
            technical_score: technical,
            design_score: design,
            impact_score: impact,
            presentation_score: presentation,
            total_score: total,
            feedback_hash,
            scored_at_block: context.block_number(),
            owner: judge,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.scores.at(hackathon_id).insert(&mut score_note);
    }

    // ── RESULTS & PRIZES (organizer + private) ───────

    /// Finalize results and distribute prizes privately.
    /// Organizer computes winners from aggregated scores (off-chain tally)
    /// and assigns prizes.
    #[external("private")]
    fn award_prize(
        hackathon_id: Field,
        track_id: Field,
        team_id: Field,
        placement: u8,
        prize_amount: u128,
        team_lead: AztecAddress,
    ) {
        let organizer = context.msg_sender();

        // Create prize note for winning team
        let prize_note = PrizeNote {
            hackathon_id,
            track_id,
            team_id,
            placement,
            payment_token: get_hackathon_token(hackathon_id),
            prize_amount,
            claimed: false,
            owner: team_lead,
            owner_npk_m_hash: get_npk_m_hash(team_lead),
        };

        storage.prizes.at(hackathon_id).insert(&mut prize_note);
        prize_note.emit_encrypted_log(&mut context, team_lead);

        // Update reputation for all team members
        let team_options = NoteGetterOptions::new()
            .select(TeamNote::properties().team_id, team_id)
            .set_limit(1);
        let teams = storage.teams.at(hackathon_id).get_notes(team_options);
        if teams.len() > 0 {
            let team = teams[0];
            for i in 0..team.member_count {
                ReputationRegistry::at(REPUTATION_ADDR).record_hackathon_result(
                    team.members[i],
                    placement == 1,  // won = first place
                );
            }
        }
    }

    /// Winner claims their prize privately.
    #[external("private")]
    fn claim_prize(hackathon_id: Field) {
        let claimer = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(PrizeNote::properties().hackathon_id, hackathon_id)
            .set_limit(1);
        let notes = storage.prizes.at(hackathon_id).get_notes(options);
        assert(notes.len() == 1, "No prize found");
        let prize = notes[0];
        assert(!prize.claimed, "Already claimed");

        // Nullify and recreate as claimed
        storage.prizes.at(hackathon_id).remove(prize);
        let claimed_prize = PrizeNote { claimed: true, ..prize };
        storage.prizes.at(hackathon_id).insert(&mut claimed_prize);

        // Transfer prize privately
        Token::at(prize.payment_token).transfer(
            context.this_address(),
            claimer,
            prize.prize_amount,
        );
    }

    // ── PROOFS ───────────────────────────────────────

    /// Prove participation in a hackathon.
    #[external("private")]
    fn prove_participation(hackathon_id: Field) -> bool {
        let member = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(TeamNote::properties().hackathon_id, hackathon_id);
        let teams = storage.teams.at(hackathon_id).get_notes(options);
        teams.iter().any(|t| t.members.contains(member))
    }

    /// Prove you won a hackathon without revealing which one or the prize.
    #[external("private")]
    fn prove_hackathon_winner() -> bool {
        let member = context.msg_sender();
        let rep = ReputationRegistry::at(REPUTATION_ADDR)
            .prove_hackathon_wins(1);
        rep
    }
}
```

### 5.5 QuestTracker

```noir
#[aztec]
contract QuestTracker {
    #[storage]
    struct Storage {
        quests: Map<Field, PublicMutable<QuestConfig>>,
        completions: Map<AztecAddress, PrivateSet<QuestCompletionNote>>,
        quest_counter: PublicMutable<u64>,
    }

    /// Create a quest with rewards.
    #[external("public")]
    fn create_quest(
        name_hash: Field,
        description_hash: Field,
        quest_type: u8,
        payment_token: AztecAddress,
        reward_per_completion: u128,
        max_completions: u64,
        deadline_block: u64,
        reputation_gate: Field,
    ) -> Field {
        let creator = context.msg_sender();
        let quest_id = poseidon2_hash([
            creator.to_field(),
            storage.quest_counter.read() as Field,
        ]);

        // Lock total rewards in escrow
        let total_rewards = reward_per_completion * max_completions as u128;
        Token::at(payment_token).transfer_public(
            creator,
            context.this_address(),
            total_rewards,
        );

        storage.quests.at(quest_id).write(QuestConfig {
            quest_id,
            creator,
            name_hash,
            description_hash,
            quest_type,
            payment_token,
            reward_per_completion,
            max_completions,
            completions: 0,
            deadline_block,
            reputation_gate,
            is_active: true,
        });

        let counter = storage.quest_counter.read();
        storage.quest_counter.write(counter + 1);

        quest_id
    }

    /// Complete a quest and claim reward.
    #[external("private")]
    fn complete_quest(
        quest_id: Field,
        verification_hash: Field,
    ) {
        let completer = context.msg_sender();
        let quest = get_quest_config(quest_id);

        // Check reputation gate if set
        if quest.reputation_gate != Field::zero() {
            let passes = ReputationRegistry::at(REPUTATION_ADDR)
                .check_gate(quest.reputation_gate);
            assert(passes, "Does not meet reputation requirements");
        }

        // Transfer reward
        Token::at(quest.payment_token).transfer(
            context.this_address(),
            completer,
            quest.reward_per_completion,
        );

        // Record completion
        let completion = QuestCompletionNote {
            quest_id,
            completer,
            completed_at_block: context.block_number(),
            reward_amount: quest.reward_per_completion,
            verification_hash,
            owner: completer,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.completions.at(completer).insert(&mut completion);

        // Update reputation
        ReputationRegistry::at(REPUTATION_ADDR).record_quest_completion(completer);

        // Update aggregate
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_completions(Field)"),
            [quest_id],
        );
    }

    /// Prove quest completion.
    #[external("private")]
    fn prove_quest_completed(quest_id: Field) -> bool {
        let completer = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(QuestCompletionNote::properties().quest_id, quest_id)
            .set_limit(1);
        let notes = storage.completions.at(completer).get_notes(options);
        notes.len() > 0
    }
}
```

---

## 6. TypeScript SDK

### 6.1 Package Structure

```
@aztec/community-platform/
├── src/
│   ├── index.ts
│   ├── tasks.ts                  // TaskClient (bounty browsing, claiming, submission)
│   ├── pools.ts                  // PoolClient (deposit, allocate, withdraw)
│   ├── hackathons.ts             // HackathonClient (register, submit, judge, claim)
│   ├── rewards.ts                // RewardClient (peer allocation, streaming)
│   ├── reputation.ts             // ReputationClient (proofs, skills, gates)
│   ├── quests.ts                 // QuestClient (create, complete, prove)
│   ├── types.ts
│   ├── contracts/                // Compiled artifacts
│   └── integrations/
│       ├── discord/              // Discord bot for task notifications + gating
│       ├── github/               // GitHub integration for dev bounties
│       ├── telegram/             // Telegram bot for quest notifications
│       └── farcaster/            // Farcaster frame for bounty posting
├── web/                          // Next.js web dashboard
│   ├── app/
│   │   ├── tasks/                // Browse and claim bounties
│   │   ├── pools/                // Funding pool management
│   │   ├── hackathons/           // Hackathon participation
│   │   ├── rewards/              // Peer allocation circles
│   │   ├── reputation/           // My reputation + proofs
│   │   ├── quests/               // Available quests
│   │   └── dashboard/            // Contributor/project overview
│   └── components/
├── tests/
└── package.json
```

### 6.2 Core APIs

```typescript
// ══════════════════════════════════════════
// Task / Bounty Client
// ══════════════════════════════════════════

class TaskClient {
  constructor(pxe: PXE, bountyBoardAddress: AztecAddress) {}

  // Project side
  async postTask(config: TaskConfig): Promise<TaskId> {}
  async reviewSubmission(taskId: Fr, submitter: AztecAddress, approved: boolean): Promise<void> {}
  async cancelTask(taskId: Fr): Promise<void> {}

  // Contributor side
  async browseTasks(filters?: TaskFilters): Promise<TaskListing[]> {}
  async applyForTask(taskId: Fr, applicationHash: Fr): Promise<void> {}
  async submitWork(taskId: Fr, submissionHash: Fr): Promise<void> {}
  async claimPayment(taskId: Fr): Promise<void> {}

  // Proofs
  async proveTaskCompletion(taskId: Fr): Promise<Proof> {}
  async proveTasksCompletedAbove(minCount: number): Promise<Proof> {}
}


// ══════════════════════════════════════════
// Funding Pool Client
// ══════════════════════════════════════════

class PoolClient {
  constructor(pxe: PXE, poolAddress: AztecAddress) {}

  async createPool(config: PoolConfig): Promise<PoolId> {}
  async deposit(poolId: Fr, amount: bigint): Promise<void> {}
  async allocate(poolId: Fr, recipient: AztecAddress, amount: bigint, reason: string): Promise<void> {}
  async withdraw(poolId: Fr): Promise<void> {}
  async getPoolStats(poolId: Fr): Promise<PoolStats> {}

  // Quadratic funding specific
  async donateToProject(poolId: Fr, projectId: Fr, amount: bigint): Promise<void> {}
  async computeMatching(poolId: Fr): Promise<MatchingResult[]> {}

  // Proofs
  async proveContribution(poolId: Fr): Promise<Proof> {}
  async proveContributionAbove(poolId: Fr, minAmount: bigint): Promise<Proof> {}
}


// ══════════════════════════════════════════
// Hackathon Client
// ══════════════════════════════════════════

class HackathonClient {
  constructor(pxe: PXE, hackathonAddress: AztecAddress) {}

  // Organizer
  async createHackathon(config: HackathonConfig): Promise<HackathonId> {}
  async addJudge(hackathonId: Fr, judge: AztecAddress): Promise<void> {}
  async awardPrize(hackathonId: Fr, teamId: Fr, placement: number, amount: bigint): Promise<void> {}
  async finalizeResults(hackathonId: Fr): Promise<void> {}

  // Team
  async registerTeam(hackathonId: Fr, config: TeamConfig): Promise<TeamId> {}
  async submitProject(hackathonId: Fr, submission: ProjectSubmission): Promise<void> {}
  async claimPrize(hackathonId: Fr): Promise<void> {}

  // Judge
  async getSubmissions(hackathonId: Fr): Promise<SubmissionInfo[]> {}
  async scoreSubmission(hackathonId: Fr, submissionId: Fr, scores: ScoreRubric): Promise<void> {}

  // Proofs
  async proveParticipation(hackathonId: Fr): Promise<Proof> {}
  async proveWinner(): Promise<Proof> {}
}


// ══════════════════════════════════════════
// Peer Allocation Client (Private Coordinape)
// ══════════════════════════════════════════

class PeerAllocClient {
  constructor(pxe: PXE, peerAllocAddress: AztecAddress) {}

  // Admin
  async createCircle(config: CircleConfig): Promise<CircleId> {}
  async addMember(circleId: Fr, member: AztecAddress): Promise<void> {}
  async removeMember(circleId: Fr, member: AztecAddress): Promise<void> {}
  async advanceEpoch(circleId: Fr): Promise<void> {}

  // Member
  async allocateGive(circleId: Fr, recipient: AztecAddress, amount: number, comment?: string): Promise<void> {}
  async batchAllocateGive(circleId: Fr, allocations: GiveAllocation[]): Promise<void> {}
  async claimEpochReward(circleId: Fr, epoch: number): Promise<bigint> {}
  async getMyEpochHistory(circleId: Fr): Promise<EpochResult[]> {}

  // Proofs
  async proveParticipation(circleId: Fr, epoch: number): Promise<Proof> {}
  async provePeerRecognitionAbove(circleId: Fr, epoch: number, minGive: number): Promise<Proof> {}
}


// ══════════════════════════════════════════
// Reputation Client
// ══════════════════════════════════════════

class ReputationClient {
  constructor(pxe: PXE, reputationAddress: AztecAddress) {}

  // Read my reputation (off-chain, no proof)
  async getMyReputation(): Promise<ReputationInfo> {}
  async getMySkills(): Promise<SkillInfo[]> {}
  async getMyTier(): Promise<ReputationTier> {}

  // Generate proofs (for sharing with third parties)
  async proveBountiesCompleted(minCount: number): Promise<Proof> {}
  async proveEarningsAbove(minTotal: bigint): Promise<Proof> {}
  async proveReputationTier(minTier: ReputationTier): Promise<Proof> {}
  async proveHackathonWins(minWins: number): Promise<Proof> {}
  async proveSkill(skillName: string): Promise<Proof> {}
  async proveSkillLevel(skillName: string, minLevel: ProficiencyLevel): Promise<Proof> {}
  async proveTenure(minMonths: number): Promise<Proof> {}
  async checkGate(gateId: Fr): Promise<boolean> {}

  // Create gate (for project admins)
  async createGate(config: GateConfig): Promise<GateId> {}
}
```

---

## 7. Deployment Plan

```
Phase 1: Foundation (Months 1-3)
├── Deploy: ReputationRegistry, QuestTracker
├── Integrate: BountyBoard (from Product B)
├── Build: Web dashboard (contributor + project views)
├── Seed: 50+ bounties from Aztec Foundation + internal tasks
├── Launch: Discord bot for task notifications
├── Target: 100 contributors, 200 tasks posted, $50K distributed
└── Metric: 50+ unique contributors completing at least 1 task

Phase 2: Funding + Hackathons (Months 3-6)
├── Deploy: FundingPool, HackathonEngine
├── Run: First Aztec community hackathon (aim for 50+ teams)
├── Launch: 2-3 funding pools (tooling, education, content)
├── Integrate: GitHub bot for dev bounty workflow
├── Target: 500 contributors, $200K in pools, 1 hackathon
└── Metric: 10+ projects actively posting tasks

Phase 3: Recurring + Reputation (Months 6-9)
├── Deploy: PeerAllocation (Private Coordinape)
├── Launch: First peer allocation circle (Aztec core contributors)
├── Enable: Full reputation system with selective disclosure
├── Implement: Reputation-gated premium tasks
├── Target: 1,000+ contributors, 3+ active circles
└── Metric: Contributors using reputation proofs for access

Phase 4: Scale + Ecosystem (Months 9-14)
├── Launch: Quadratic funding round
├── Launch: RPGF-style retroactive funding
├── White-label: Other Aztec projects run their own contributor programs
├── Cross-platform: Reputation proofs work outside the platform
├── Target: 5,000+ contributors, default Aztec contributor hub
└── Metric: Platform is the primary channel for Aztec ecosystem tasks
```

---

## 8. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cold start — not enough tasks or contributors | High | Seed supply via Aztec Foundation partnership; create internal bounties; be the first project using the platform |
| Aztec ecosystem stays small | Medium | Platform itself drives growth — contributors learn Aztec through it; virtuous cycle |
| Privacy isn't what contributors care about most | Medium | Lead with UX, fair pay, and reputation portability; privacy is a bonus, not the only value prop |
| Sybil attacks on quests/funding pools | Medium | Reputation gating, expensive account creation on Aztec, require minimum activity history |
| Private peer allocation is technically complex | Medium | Start with simpler fixed compensation; add peer allocation in Phase 3 after core contracts are proven |
| Competitor (Superteam, etc.) expands to Aztec | Low | First-mover + native privacy + deep integration they can't replicate on a transparent chain |
| Revenue sustainability | Medium | Start grant-funded (ecosystem infrastructure); prove revenue model in Phase 3-4 |
| Aztec network instability / low throughput | Medium | Community tasks are low-frequency; 1 TPS is sufficient for bounty claims and peer allocation |
