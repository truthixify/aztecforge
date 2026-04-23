use aztec::macros::aztec;

/// ReputationRegistry contract for AztecForge.
///
/// Tracks contributor reputation across the platform.
/// All reputation data is public so other contracts can gate on it.
///
/// Tier system (score thresholds):
///   0 = newcomer (< 10), 1 = contributor (10-49), 2 = builder (50-199),
///   3 = expert (200-499), 4 = core (>= 500)
#[aztec]
pub contract ReputationRegistry {
    use aztec::{
        macros::{
            functions::{external, initializer, view},
            storage::storage,
        },
        protocol::{address::AztecAddress, traits::ToField},
        state_vars::{Map, PublicMutable, PublicImmutable},
    };
    use aztec::protocol::hash::poseidon2_hash;

    #[storage]
    struct Storage<Context> {
        admin: PublicImmutable<AztecAddress, Context>,

        // Per-contributor metrics (keyed by contributor address as Field)
        bounties_completed: Map<Field, PublicMutable<u64, Context>, Context>,
        bounties_total_earned: Map<Field, PublicMutable<u128, Context>, Context>,
        hackathons_participated: Map<Field, PublicMutable<u64, Context>, Context>,
        hackathons_won: Map<Field, PublicMutable<u64, Context>, Context>,
        grants_received: Map<Field, PublicMutable<u64, Context>, Context>,
        grants_total_earned: Map<Field, PublicMutable<u128, Context>, Context>,
        milestones_delivered: Map<Field, PublicMutable<u64, Context>, Context>,
        quests_completed: Map<Field, PublicMutable<u64, Context>, Context>,
        peer_give_received: Map<Field, PublicMutable<u128, Context>, Context>,
        peer_epochs_participated: Map<Field, PublicMutable<u64, Context>, Context>,

        // Computed
        reputation_scores: Map<Field, PublicMutable<u64, Context>, Context>,
        reputation_tiers: Map<Field, PublicMutable<u8, Context>, Context>,
        first_activity_blocks: Map<Field, PublicMutable<u64, Context>, Context>,
        last_activity_blocks: Map<Field, PublicMutable<u64, Context>, Context>,

        // Skill attestations: key = poseidon2(contributor, skill_hash)
        skill_attestation_counts: Map<Field, PublicMutable<u64, Context>, Context>,
        skill_highest_levels: Map<Field, PublicMutable<u8, Context>, Context>,

        // Reputation gates: key = gate_id
        gate_count: PublicMutable<u64, Context>,
        gate_min_bounties: Map<u64, PublicMutable<u64, Context>, Context>,
        gate_min_hackathon_wins: Map<u64, PublicMutable<u64, Context>, Context>,
        gate_min_tier: Map<u64, PublicMutable<u8, Context>, Context>,
        gate_min_tenure_blocks: Map<u64, PublicMutable<u64, Context>, Context>,
        gate_active: Map<u64, PublicMutable<bool, Context>, Context>,

        // Authorized updaters
        authorized_updaters: Map<Field, PublicMutable<bool, Context>, Context>,

        total_contributors: PublicMutable<u64, Context>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
        self.storage.gate_count.write(0);
        self.storage.total_contributors.write(0);
    }

    // -----------------------------------------
    // ADMIN
    // -----------------------------------------

    #[external("public")]
    fn authorize_updater(contract_address: AztecAddress) {
        let caller = self.msg_sender();
        let admin = self.storage.admin.read();
        assert(caller.eq(admin), "Only admin");
        self.storage.authorized_updaters.at(contract_address.to_field()).write(true);
    }

    #[external("public")]
    fn revoke_updater(contract_address: AztecAddress) {
        let caller = self.msg_sender();
        let admin = self.storage.admin.read();
        assert(caller.eq(admin), "Only admin");
        self.storage.authorized_updaters.at(contract_address.to_field()).write(false);
    }

    // -----------------------------------------
    // REPUTATION UPDATES
    // -----------------------------------------

    #[external("public")]
    fn record_bounty_completion(contributor: AztecAddress, earned_amount: u128) {
        let caller = self.msg_sender();
        let is_auth = self.storage.authorized_updaters.at(caller.to_field()).read();
        assert(is_auth, "Not authorized updater");

        let key = contributor.to_field();
        let count = self.storage.bounties_completed.at(key).read();
        self.storage.bounties_completed.at(key).write(count + 1);
        let total = self.storage.bounties_total_earned.at(key).read();
        self.storage.bounties_total_earned.at(key).write(total + earned_amount);

        // Recompute score and tier
        let b = self.storage.bounties_completed.at(key).read();
        let hw = self.storage.hackathons_won.at(key).read();
        let g = self.storage.grants_received.at(key).read();
        let m = self.storage.milestones_delivered.at(key).read();
        let q = self.storage.quests_completed.at(key).read();
        let pe = self.storage.peer_epochs_participated.at(key).read();
        let score = b * 10 + hw * 50 + g * 30 + m * 20 + q * 5 + pe * 15;
        self.storage.reputation_scores.at(key).write(score);
        let tier: u8 = if score >= 500 { 4 } else if score >= 200 { 3 } else if score >= 50 { 2 } else if score >= 10 { 1 } else { 0 };
        self.storage.reputation_tiers.at(key).write(tier);
        // Track new contributors
        let first = self.storage.first_activity_blocks.at(key).read();
        if first == 0 {
            self.storage.first_activity_blocks.at(key).write(1);
            let tc = self.storage.total_contributors.read();
            self.storage.total_contributors.write(tc + 1);
        }
        self.storage.last_activity_blocks.at(key).write(1);
    }

    #[external("public")]
    fn record_hackathon_result(contributor: AztecAddress, won: bool) {
        let caller = self.msg_sender();
        let is_auth = self.storage.authorized_updaters.at(caller.to_field()).read();
        assert(is_auth, "Not authorized updater");

        let key = contributor.to_field();
        let participated = self.storage.hackathons_participated.at(key).read();
        self.storage.hackathons_participated.at(key).write(participated + 1);
        if won {
            let wins = self.storage.hackathons_won.at(key).read();
            self.storage.hackathons_won.at(key).write(wins + 1);
        }

        let b = self.storage.bounties_completed.at(key).read();
        let hw = self.storage.hackathons_won.at(key).read();
        let g = self.storage.grants_received.at(key).read();
        let m = self.storage.milestones_delivered.at(key).read();
        let q = self.storage.quests_completed.at(key).read();
        let pe = self.storage.peer_epochs_participated.at(key).read();
        let score = b * 10 + hw * 50 + g * 30 + m * 20 + q * 5 + pe * 15;
        self.storage.reputation_scores.at(key).write(score);
        let tier: u8 = if score >= 500 { 4 } else if score >= 200 { 3 } else if score >= 50 { 2 } else if score >= 10 { 1 } else { 0 };
        self.storage.reputation_tiers.at(key).write(tier);
        let first = self.storage.first_activity_blocks.at(key).read();
        if first == 0 {
            self.storage.first_activity_blocks.at(key).write(1);
            let tc = self.storage.total_contributors.read();
            self.storage.total_contributors.write(tc + 1);
        }
        self.storage.last_activity_blocks.at(key).write(1);
    }

    #[external("public")]
    fn record_grant_delivery(contributor: AztecAddress, grant_amount: u128) {
        let caller = self.msg_sender();
        let is_auth = self.storage.authorized_updaters.at(caller.to_field()).read();
        assert(is_auth, "Not authorized updater");

        let key = contributor.to_field();
        let grants = self.storage.grants_received.at(key).read();
        self.storage.grants_received.at(key).write(grants + 1);
        let total = self.storage.grants_total_earned.at(key).read();
        self.storage.grants_total_earned.at(key).write(total + grant_amount);
        let ms = self.storage.milestones_delivered.at(key).read();
        self.storage.milestones_delivered.at(key).write(ms + 1);

        let b = self.storage.bounties_completed.at(key).read();
        let hw = self.storage.hackathons_won.at(key).read();
        let g = self.storage.grants_received.at(key).read();
        let m2 = self.storage.milestones_delivered.at(key).read();
        let q = self.storage.quests_completed.at(key).read();
        let pe = self.storage.peer_epochs_participated.at(key).read();
        let score = b * 10 + hw * 50 + g * 30 + m2 * 20 + q * 5 + pe * 15;
        self.storage.reputation_scores.at(key).write(score);
        let tier: u8 = if score >= 500 { 4 } else if score >= 200 { 3 } else if score >= 50 { 2 } else if score >= 10 { 1 } else { 0 };
        self.storage.reputation_tiers.at(key).write(tier);
        let first = self.storage.first_activity_blocks.at(key).read();
        if first == 0 {
            self.storage.first_activity_blocks.at(key).write(1);
            let tc = self.storage.total_contributors.read();
            self.storage.total_contributors.write(tc + 1);
        }
        self.storage.last_activity_blocks.at(key).write(1);
    }

    #[external("public")]
    fn record_peer_recognition(contributor: AztecAddress, give_amount: u128) {
        let caller = self.msg_sender();
        let is_auth = self.storage.authorized_updaters.at(caller.to_field()).read();
        assert(is_auth, "Not authorized updater");

        let key = contributor.to_field();
        let total_give = self.storage.peer_give_received.at(key).read();
        self.storage.peer_give_received.at(key).write(total_give + give_amount);
        let epochs = self.storage.peer_epochs_participated.at(key).read();
        self.storage.peer_epochs_participated.at(key).write(epochs + 1);

        let b = self.storage.bounties_completed.at(key).read();
        let hw = self.storage.hackathons_won.at(key).read();
        let g = self.storage.grants_received.at(key).read();
        let m = self.storage.milestones_delivered.at(key).read();
        let q = self.storage.quests_completed.at(key).read();
        let pe = self.storage.peer_epochs_participated.at(key).read();
        let score = b * 10 + hw * 50 + g * 30 + m * 20 + q * 5 + pe * 15;
        self.storage.reputation_scores.at(key).write(score);
        let tier: u8 = if score >= 500 { 4 } else if score >= 200 { 3 } else if score >= 50 { 2 } else if score >= 10 { 1 } else { 0 };
        self.storage.reputation_tiers.at(key).write(tier);
        let first = self.storage.first_activity_blocks.at(key).read();
        if first == 0 {
            self.storage.first_activity_blocks.at(key).write(1);
            let tc = self.storage.total_contributors.read();
            self.storage.total_contributors.write(tc + 1);
        }
        self.storage.last_activity_blocks.at(key).write(1);
    }

    #[external("public")]
    fn record_quest_completion(contributor: AztecAddress) {
        let caller = self.msg_sender();
        let is_auth = self.storage.authorized_updaters.at(caller.to_field()).read();
        assert(is_auth, "Not authorized updater");

        let key = contributor.to_field();
        let quests = self.storage.quests_completed.at(key).read();
        self.storage.quests_completed.at(key).write(quests + 1);

        let b = self.storage.bounties_completed.at(key).read();
        let hw = self.storage.hackathons_won.at(key).read();
        let g = self.storage.grants_received.at(key).read();
        let m = self.storage.milestones_delivered.at(key).read();
        let q2 = self.storage.quests_completed.at(key).read();
        let pe = self.storage.peer_epochs_participated.at(key).read();
        let score = b * 10 + hw * 50 + g * 30 + m * 20 + q2 * 5 + pe * 15;
        self.storage.reputation_scores.at(key).write(score);
        let tier: u8 = if score >= 500 { 4 } else if score >= 200 { 3 } else if score >= 50 { 2 } else if score >= 10 { 1 } else { 0 };
        self.storage.reputation_tiers.at(key).write(tier);
        let first = self.storage.first_activity_blocks.at(key).read();
        if first == 0 {
            self.storage.first_activity_blocks.at(key).write(1);
            let tc = self.storage.total_contributors.read();
            self.storage.total_contributors.write(tc + 1);
        }
        self.storage.last_activity_blocks.at(key).write(1);
    }

    // -----------------------------------------
    // SKILL ATTESTATION
    // -----------------------------------------

    #[external("public")]
    fn attest_skill(contributor: AztecAddress, skill_hash: Field, proficiency_level: u8) {
        let caller = self.msg_sender();
        let admin = self.storage.admin.read();
        let is_auth = self.storage.authorized_updaters.at(caller.to_field()).read();
        assert(caller.eq(admin) | is_auth, "Not authorized");
        assert(proficiency_level <= 3, "Level must be 0-3");

        let attestation_key = poseidon2_hash([contributor.to_field(), skill_hash]);
        let count = self.storage.skill_attestation_counts.at(attestation_key).read();
        self.storage.skill_attestation_counts.at(attestation_key).write(count + 1);

        let current_level = self.storage.skill_highest_levels.at(attestation_key).read();
        if proficiency_level > current_level {
            self.storage.skill_highest_levels.at(attestation_key).write(proficiency_level);
        }
    }

    // -----------------------------------------
    // GATES
    // -----------------------------------------

    #[external("public")]
    fn create_gate(
        min_bounties: u64,
        min_hackathon_wins: u64,
        min_tier: u8,
        min_tenure_blocks: u64,
    ) -> pub u64 {
        let gate_id = self.storage.gate_count.read();
        self.storage.gate_min_bounties.at(gate_id).write(min_bounties);
        self.storage.gate_min_hackathon_wins.at(gate_id).write(min_hackathon_wins);
        self.storage.gate_min_tier.at(gate_id).write(min_tier);
        self.storage.gate_min_tenure_blocks.at(gate_id).write(min_tenure_blocks);
        self.storage.gate_active.at(gate_id).write(true);
        self.storage.gate_count.write(gate_id + 1);
        gate_id
    }

    #[external("public")]
    fn deactivate_gate(gate_id: u64) {
        let caller = self.msg_sender();
        let admin = self.storage.admin.read();
        assert(caller.eq(admin), "Only admin");
        self.storage.gate_active.at(gate_id).write(false);
    }

    // Score/tier computation and contributor tracking are inlined in each
    // update function because Aztec requires all contract functions to have
    // #[external], #[internal], or #[test] annotations.

    // -----------------------------------------
    // READ FUNCTIONS
    // -----------------------------------------

    #[external("public")]
    #[view]
    fn get_reputation_score(contributor: AztecAddress) -> pub u64 {
        self.storage.reputation_scores.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_reputation_tier(contributor: AztecAddress) -> pub u8 {
        self.storage.reputation_tiers.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_bounties_completed(contributor: AztecAddress) -> pub u64 {
        self.storage.bounties_completed.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_hackathons_won(contributor: AztecAddress) -> pub u64 {
        self.storage.hackathons_won.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_grants_received(contributor: AztecAddress) -> pub u64 {
        self.storage.grants_received.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_quests_completed(contributor: AztecAddress) -> pub u64 {
        self.storage.quests_completed.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_peer_give_received(contributor: AztecAddress) -> pub u128 {
        self.storage.peer_give_received.at(contributor.to_field()).read()
    }

    #[external("public")]
    #[view]
    fn get_skill_level(contributor: AztecAddress, skill_hash: Field) -> pub u8 {
        let key = poseidon2_hash([contributor.to_field(), skill_hash]);
        self.storage.skill_highest_levels.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_total_contributors() -> pub u64 {
        self.storage.total_contributors.read()
    }

    #[external("public")]
    #[view]
    fn check_gate(contributor: AztecAddress, gate_id: u64) -> pub bool {
        let active = self.storage.gate_active.at(gate_id).read();
        if !active {
            false
        } else {
            let key = contributor.to_field();
            let bounties = self.storage.bounties_completed.at(key).read();
            let hack_wins = self.storage.hackathons_won.at(key).read();
            let tier = self.storage.reputation_tiers.at(key).read();
            let min_bounties = self.storage.gate_min_bounties.at(gate_id).read();
            let min_wins = self.storage.gate_min_hackathon_wins.at(gate_id).read();
            let min_tier = self.storage.gate_min_tier.at(gate_id).read();
            (bounties >= min_bounties) & (hack_wins >= min_wins) & (tier >= min_tier)
        }
    }
}
