use aztec::macros::aztec;

/// QuestTracker contract for AztecForge.
///
/// Manages quests -- predefined tasks with fixed rewards that anyone can complete.
/// Quests can be gated by reputation requirements.
///
/// Quest types:
///   0 = on-chain action (verified by contract callback)
///   1 = content creation (verified by admin/oracle)
///   2 = development task (verified by admin/oracle)
///   3 = community task (verified by admin/oracle)
///
/// All quest details and rewards are public. Completions are public
/// (portfolio credit for the contributor).
#[aztec]
pub contract QuestTracker {
    use aztec::{
        macros::{
            functions::{external, initializer, view},
            storage::storage,
        },
        protocol::{address::AztecAddress, hash::poseidon2_hash, traits::ToField},
        state_vars::{Map, PublicMutable, PublicImmutable},
    };

    #[storage]
    struct Storage<Context> {
        admin: PublicImmutable<AztecAddress, Context>,

        // Quest counter
        quest_count: PublicMutable<u64, Context>,

        // Per-quest config (keyed by quest_id)
        quest_creators: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        quest_name_hashes: Map<u64, PublicMutable<Field, Context>, Context>,
        quest_description_hashes: Map<u64, PublicMutable<Field, Context>, Context>,
        quest_types: Map<u64, PublicMutable<u8, Context>, Context>,
        quest_tokens: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        quest_rewards: Map<u64, PublicMutable<u128, Context>, Context>,
        quest_max_completions: Map<u64, PublicMutable<u64, Context>, Context>,
        quest_completion_counts: Map<u64, PublicMutable<u64, Context>, Context>,
        quest_deadlines: Map<u64, PublicMutable<u64, Context>, Context>,
        quest_statuses: Map<u64, PublicMutable<u8, Context>, Context>,

        // Reputation gate for quests: 0 = no gate
        quest_reputation_gates: Map<u64, PublicMutable<u64, Context>, Context>,

        // Verifiers: addresses authorized to verify quest completions
        // key = hash(quest_id, verifier_address)
        quest_verifiers: Map<Field, PublicMutable<bool, Context>, Context>,

        // Completions: key = hash(quest_id, completer)
        quest_completed_by: Map<Field, PublicMutable<bool, Context>, Context>,
        quest_completion_proofs: Map<Field, PublicMutable<Field, Context>, Context>,

        // Global aggregates
        total_quests_created: PublicMutable<u64, Context>,
        total_quests_completed: PublicMutable<u64, Context>,
        total_rewards_paid: PublicMutable<u128, Context>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
        self.storage.quest_count.write(0);
        self.storage.total_quests_created.write(0);
        self.storage.total_quests_completed.write(0);
        self.storage.total_rewards_paid.write(0);
    }

    // -----------------------------------------
    // QUEST CREATION
    // -----------------------------------------

    /// Create a new quest with rewards locked in escrow.
    #[external("public")]
    fn create_quest(
        name_hash: Field,
        description_hash: Field,
        quest_type: u8,
        payment_token: AztecAddress,
        reward_per_completion: u128,
        max_completions: u64,
        deadline_block: u64,
        reputation_gate_id: u64,
    ) -> pub u64 {
        assert(quest_type <= 3, "Invalid quest type");
        let creator = self.msg_sender();
        let quest_id = self.storage.quest_count.read();

        self.storage.quest_creators.at(quest_id).write(creator);
        self.storage.quest_name_hashes.at(quest_id).write(name_hash);
        self.storage.quest_description_hashes.at(quest_id).write(description_hash);
        self.storage.quest_types.at(quest_id).write(quest_type);
        self.storage.quest_tokens.at(quest_id).write(payment_token);
        self.storage.quest_rewards.at(quest_id).write(reward_per_completion);
        self.storage.quest_max_completions.at(quest_id).write(max_completions);
        self.storage.quest_completion_counts.at(quest_id).write(0);
        self.storage.quest_deadlines.at(quest_id).write(deadline_block);
        self.storage.quest_statuses.at(quest_id).write(0); // 0 = active
        self.storage.quest_reputation_gates.at(quest_id).write(reputation_gate_id);

        // Creator is default verifier
        let verifier_key = poseidon2_hash([quest_id as Field, creator.to_field()]);
        self.storage.quest_verifiers.at(verifier_key).write(true);

        self.storage.quest_count.write(quest_id + 1);
        let total = self.storage.total_quests_created.read();
        self.storage.total_quests_created.write(total + 1);

        // TODO: Lock total_rewards (reward_per_completion * max_completions) in escrow

        quest_id
    }

    /// Add a verifier for a quest.
    #[external("public")]
    fn add_verifier(quest_id: u64, verifier: AztecAddress) {
        let caller = self.msg_sender();
        let creator = self.storage.quest_creators.at(quest_id).read();
        assert(caller.eq(creator), "Not the creator");

        let key = poseidon2_hash([quest_id as Field, verifier.to_field()]);
        self.storage.quest_verifiers.at(key).write(true);
    }

    /// Deactivate a quest.
    #[external("public")]
    fn deactivate_quest(quest_id: u64) {
        let caller = self.msg_sender();
        let creator = self.storage.quest_creators.at(quest_id).read();
        assert(caller.eq(creator), "Not the creator");
        self.storage.quest_statuses.at(quest_id).write(1); // 1 = inactive
    }

    // -----------------------------------------
    // QUEST COMPLETION
    // -----------------------------------------

    /// Complete a quest (self-submit). Only type 0 (on-chain) can self-complete.
    #[external("public")]
    fn complete_quest(quest_id: u64, verification_hash: Field) {
        let completer = self.msg_sender();
        let quest_type = self.storage.quest_types.at(quest_id).read();
        assert(quest_type == 0, "Requires verifier approval");

        let status = self.storage.quest_statuses.at(quest_id).read();
        assert(status == 0, "Quest not active");
        let completion_key = poseidon2_hash([quest_id as Field, completer.to_field()]);
        assert(!self.storage.quest_completed_by.at(completion_key).read(), "Already completed");
        let current = self.storage.quest_completion_counts.at(quest_id).read();
        let max = self.storage.quest_max_completions.at(quest_id).read();
        if max > 0 { assert(current < max, "Max completions reached"); }
        self.storage.quest_completed_by.at(completion_key).write(true);
        self.storage.quest_completion_proofs.at(completion_key).write(verification_hash);
        self.storage.quest_completion_counts.at(quest_id).write(current + 1);
        if max > 0 { if current + 1 >= max { self.storage.quest_statuses.at(quest_id).write(1); } }
        let tc = self.storage.total_quests_completed.read();
        self.storage.total_quests_completed.write(tc + 1);
        let reward = self.storage.quest_rewards.at(quest_id).read();
        let tp = self.storage.total_rewards_paid.read();
        self.storage.total_rewards_paid.write(tp + reward);
    }

    /// Verify and approve a quest completion. Only authorized verifiers.
    #[external("public")]
    fn verify_completion(quest_id: u64, completer: AztecAddress, verification_hash: Field) {
        let verifier = self.msg_sender();
        let verifier_key = poseidon2_hash([quest_id as Field, verifier.to_field()]);
        assert(self.storage.quest_verifiers.at(verifier_key).read(), "Not a verifier");

        let status = self.storage.quest_statuses.at(quest_id).read();
        assert(status == 0, "Quest not active");
        let completion_key = poseidon2_hash([quest_id as Field, completer.to_field()]);
        assert(!self.storage.quest_completed_by.at(completion_key).read(), "Already completed");
        let current = self.storage.quest_completion_counts.at(quest_id).read();
        let max = self.storage.quest_max_completions.at(quest_id).read();
        if max > 0 { assert(current < max, "Max completions reached"); }
        self.storage.quest_completed_by.at(completion_key).write(true);
        self.storage.quest_completion_proofs.at(completion_key).write(verification_hash);
        self.storage.quest_completion_counts.at(quest_id).write(current + 1);
        if max > 0 { if current + 1 >= max { self.storage.quest_statuses.at(quest_id).write(1); } }
        let tc = self.storage.total_quests_completed.read();
        self.storage.total_quests_completed.write(tc + 1);
        let reward = self.storage.quest_rewards.at(quest_id).read();
        let tp = self.storage.total_rewards_paid.read();
        self.storage.total_rewards_paid.write(tp + reward);
    }

    // -----------------------------------------
    // READ FUNCTIONS
    // -----------------------------------------

    #[external("public")]
    #[view]
    fn get_quest_count() -> pub u64 {
        self.storage.quest_count.read()
    }

    #[external("public")]
    #[view]
    fn get_quest_status(quest_id: u64) -> pub u8 {
        self.storage.quest_statuses.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_creator(quest_id: u64) -> pub AztecAddress {
        self.storage.quest_creators.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_reward(quest_id: u64) -> pub u128 {
        self.storage.quest_rewards.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_completion_count(quest_id: u64) -> pub u64 {
        self.storage.quest_completion_counts.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_max_completions(quest_id: u64) -> pub u64 {
        self.storage.quest_max_completions.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn has_completed_quest(quest_id: u64, completer: AztecAddress) -> pub bool {
        let key = poseidon2_hash([quest_id as Field, completer.to_field()]);
        self.storage.quest_completed_by.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_type(quest_id: u64) -> pub u8 {
        self.storage.quest_types.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_deadline(quest_id: u64) -> pub u64 {
        self.storage.quest_deadlines.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn get_quest_reputation_gate(quest_id: u64) -> pub u64 {
        self.storage.quest_reputation_gates.at(quest_id).read()
    }

    #[external("public")]
    #[view]
    fn is_verifier(quest_id: u64, verifier: AztecAddress) -> pub bool {
        let key = poseidon2_hash([quest_id as Field, verifier.to_field()]);
        self.storage.quest_verifiers.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_total_quests_created() -> pub u64 {
        self.storage.total_quests_created.read()
    }

    #[external("public")]
    #[view]
    fn get_total_quests_completed() -> pub u64 {
        self.storage.total_quests_completed.read()
    }

    #[external("public")]
    #[view]
    fn get_total_rewards_paid() -> pub u128 {
        self.storage.total_rewards_paid.read()
    }
}
