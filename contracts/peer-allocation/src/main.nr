use aztec::macros::aztec;

/// PeerAllocation contract for AztecForge (Private Coordinape).
///
/// Manages peer-based reward allocation circles where members allocate GIVE
/// tokens to each other. GIVE votes are stored on-chain but individual
/// allocations are only visible to the recipient (future: private notes).
///
/// At epoch end, the reward pool is distributed proportionally based on
/// total GIVE received by each member.
///
/// Flow:
///   1. Admin creates a circle with members, epoch duration, reward pool
///   2. Each epoch, members allocate their GIVE budget to peers
///   3. When epoch ends, admin advances it; members claim rewards proportionally
///   4. Reputation is updated based on GIVE received
#[aztec]
pub contract PeerAllocation {
    use aztec::{
        macros::{
            functions::{external, initializer, view},
            storage::storage,
        },
        protocol::{address::AztecAddress, hash::poseidon2_hash, traits::ToField},
        state_vars::{Map, PublicMutable, PublicImmutable},
    };
    use token::Token;

    #[storage]
    struct Storage<Context> {
        admin: PublicImmutable<AztecAddress, Context>,

        // Circle counter
        circle_count: PublicMutable<u64, Context>,

        // Per-circle config (keyed by circle_id)
        circle_admins: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        circle_tokens: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        circle_epoch_durations: Map<u64, PublicMutable<u64, Context>, Context>,
        circle_current_epochs: Map<u64, PublicMutable<u64, Context>, Context>,
        circle_member_counts: Map<u64, PublicMutable<u64, Context>, Context>,
        circle_give_per_member: Map<u64, PublicMutable<u64, Context>, Context>,
        circle_reward_pools: Map<u64, PublicMutable<u128, Context>, Context>,
        circle_total_distributed: Map<u64, PublicMutable<u128, Context>, Context>,
        circle_statuses: Map<u64, PublicMutable<u8, Context>, Context>,

        // Membership: key = hash(circle_id, member)
        is_member: Map<Field, PublicMutable<bool, Context>, Context>,

        // GIVE allocations: key = hash(circle_id, epoch, giver, recipient)
        give_amounts: Map<Field, PublicMutable<u64, Context>, Context>,

        // Total GIVE spent by a giver in an epoch: key = hash(circle_id, epoch, giver)
        give_spent: Map<Field, PublicMutable<u64, Context>, Context>,

        // Total GIVE received by a member in an epoch: key = hash(circle_id, epoch, member)
        give_received: Map<Field, PublicMutable<u64, Context>, Context>,

        // Total GIVE distributed in an epoch: key = hash(circle_id, epoch)
        epoch_total_give: Map<Field, PublicMutable<u64, Context>, Context>,

        // Whether a member has claimed rewards for an epoch: key = hash(circle_id, epoch, member)
        epoch_claimed: Map<Field, PublicMutable<bool, Context>, Context>,

        // Epoch reward pool deposited: key = hash(circle_id, epoch)
        epoch_reward_deposited: Map<Field, PublicMutable<u128, Context>, Context>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
        self.storage.circle_count.write(0);
    }

    // -----------------------------------------
    // CIRCLE MANAGEMENT
    // -----------------------------------------

    /// Create a new peer allocation circle.
    #[external("public")]
    fn create_circle(
        payment_token: AztecAddress,
        epoch_duration_blocks: u64,
        give_per_member: u64,
        reward_pool_per_epoch: u128,
    ) -> pub u64 {
        let circle_admin = self.msg_sender();
        let circle_id = self.storage.circle_count.read();

        self.storage.circle_admins.at(circle_id).write(circle_admin);
        self.storage.circle_tokens.at(circle_id).write(payment_token);
        self.storage.circle_epoch_durations.at(circle_id).write(epoch_duration_blocks);
        self.storage.circle_current_epochs.at(circle_id).write(0);
        self.storage.circle_member_counts.at(circle_id).write(0);
        self.storage.circle_give_per_member.at(circle_id).write(give_per_member);
        self.storage.circle_reward_pools.at(circle_id).write(reward_pool_per_epoch);
        self.storage.circle_total_distributed.at(circle_id).write(0);
        self.storage.circle_statuses.at(circle_id).write(0); // 0 = active

        self.storage.circle_count.write(circle_id + 1);
        circle_id
    }

    /// Add a member to a circle.
    #[external("public")]
    fn add_member(circle_id: u64, member: AztecAddress) {
        let caller = self.msg_sender();
        let circle_admin = self.storage.circle_admins.at(circle_id).read();
        assert(caller.eq(circle_admin), "Not circle admin");

        let member_key = poseidon2_hash([circle_id as Field, member.to_field()]);
        let already = self.storage.is_member.at(member_key).read();
        assert(!already, "Already a member");

        self.storage.is_member.at(member_key).write(true);
        let count = self.storage.circle_member_counts.at(circle_id).read();
        self.storage.circle_member_counts.at(circle_id).write(count + 1);
    }

    /// Remove a member from a circle.
    #[external("public")]
    fn remove_member(circle_id: u64, member: AztecAddress) {
        let caller = self.msg_sender();
        let circle_admin = self.storage.circle_admins.at(circle_id).read();
        assert(caller.eq(circle_admin), "Not circle admin");

        let member_key = poseidon2_hash([circle_id as Field, member.to_field()]);
        let is_mem = self.storage.is_member.at(member_key).read();
        assert(is_mem, "Not a member");

        self.storage.is_member.at(member_key).write(false);
        let count = self.storage.circle_member_counts.at(circle_id).read();
        self.storage.circle_member_counts.at(circle_id).write(count - 1);
    }

    // -----------------------------------------
    // GIVE ALLOCATION
    // -----------------------------------------

    /// Allocate GIVE to a peer in the current epoch.
    #[external("public")]
    fn allocate_give(circle_id: u64, recipient: AztecAddress, amount: u64) {
        let giver = self.msg_sender();
        let epoch = self.storage.circle_current_epochs.at(circle_id).read();

        // Verify giver is a member
        let giver_key = poseidon2_hash([circle_id as Field, giver.to_field()]);
        assert(self.storage.is_member.at(giver_key).read(), "Not a member");

        // Verify recipient is a member
        let recipient_key = poseidon2_hash([circle_id as Field, recipient.to_field()]);
        assert(self.storage.is_member.at(recipient_key).read(), "Recipient not a member");

        // Cannot give to yourself
        assert(!giver.eq(recipient), "Cannot give to yourself");

        // Check GIVE budget
        let budget = self.storage.circle_give_per_member.at(circle_id).read();
        let spent_key = poseidon2_hash([circle_id as Field, epoch as Field, giver.to_field()]);
        let already_spent = self.storage.give_spent.at(spent_key).read();
        assert(already_spent + amount <= budget, "Exceeds GIVE budget");

        // Record allocation
        let alloc_key = poseidon2_hash([circle_id as Field, epoch as Field, giver.to_field(), recipient.to_field()]);
        let existing = self.storage.give_amounts.at(alloc_key).read();
        self.storage.give_amounts.at(alloc_key).write(existing + amount);

        // Update spent
        self.storage.give_spent.at(spent_key).write(already_spent + amount);

        // Update received
        let recv_key = poseidon2_hash([circle_id as Field, epoch as Field, recipient.to_field()]);
        let received = self.storage.give_received.at(recv_key).read();
        self.storage.give_received.at(recv_key).write(received + amount);

        // Update epoch total
        let epoch_key = poseidon2_hash([circle_id as Field, epoch as Field]);
        let epoch_total = self.storage.epoch_total_give.at(epoch_key).read();
        self.storage.epoch_total_give.at(epoch_key).write(epoch_total + amount);
    }

    // -----------------------------------------
    // EPOCH MANAGEMENT
    // -----------------------------------------

    /// Advance to the next epoch. Deposits the reward pool for the completed epoch.
    #[external("public")]
    fn advance_epoch(circle_id: u64) {
        let caller = self.msg_sender();
        let circle_admin = self.storage.circle_admins.at(circle_id).read();
        assert(caller.eq(circle_admin), "Not circle admin");

        let current_epoch = self.storage.circle_current_epochs.at(circle_id).read();
        let reward_pool = self.storage.circle_reward_pools.at(circle_id).read();

        // Record reward pool for this epoch
        let epoch_key = poseidon2_hash([circle_id as Field, current_epoch as Field]);
        self.storage.epoch_reward_deposited.at(epoch_key).write(reward_pool);

        // Advance epoch
        self.storage.circle_current_epochs.at(circle_id).write(current_epoch + 1);

        // Transfer reward pool from admin to this contract
        let token = self.storage.circle_tokens.at(circle_id).read();
        let _ = self.call(Token::at(token).transfer_in_public(circle_admin, self.address, reward_pool, 0));
    }

    /// Claim reward for a completed epoch based on GIVE received.
    #[external("public")]
    fn claim_epoch_reward(circle_id: u64, epoch: u64) {
        let member = self.msg_sender();

        // Verify not already claimed
        let claim_key = poseidon2_hash([circle_id as Field, epoch as Field, member.to_field()]);
        assert(!self.storage.epoch_claimed.at(claim_key).read(), "Already claimed");

        // Verify epoch has ended
        let current_epoch = self.storage.circle_current_epochs.at(circle_id).read();
        assert(epoch < current_epoch, "Epoch not ended");

        // Get GIVE received by this member
        let recv_key = poseidon2_hash([circle_id as Field, epoch as Field, member.to_field()]);
        let received = self.storage.give_received.at(recv_key).read();

        // Get total GIVE in this epoch
        let epoch_key = poseidon2_hash([circle_id as Field, epoch as Field]);
        let total_give = self.storage.epoch_total_give.at(epoch_key).read();
        let reward_pool = self.storage.epoch_reward_deposited.at(epoch_key).read();

        // Calculate proportional reward
        let reward: u128 = if total_give > 0 {
            (reward_pool * received as u128) / total_give as u128
        } else {
            0
        };

        // Mark as claimed
        self.storage.epoch_claimed.at(claim_key).write(true);

        // Update total distributed
        let total_dist = self.storage.circle_total_distributed.at(circle_id).read();
        self.storage.circle_total_distributed.at(circle_id).write(total_dist + reward);

        // Transfer reward tokens to member
        let token = self.storage.circle_tokens.at(circle_id).read();
        let _ = self.call(Token::at(token).transfer_in_public(self.address, member, reward, 0));
    }

    // -----------------------------------------
    // READ FUNCTIONS
    // -----------------------------------------

    #[external("public")]
    #[view]
    fn get_circle_count() -> pub u64 {
        self.storage.circle_count.read()
    }

    #[external("public")]
    #[view]
    fn get_circle_admin(circle_id: u64) -> pub AztecAddress {
        self.storage.circle_admins.at(circle_id).read()
    }

    #[external("public")]
    #[view]
    fn get_circle_current_epoch(circle_id: u64) -> pub u64 {
        self.storage.circle_current_epochs.at(circle_id).read()
    }

    #[external("public")]
    #[view]
    fn get_circle_member_count(circle_id: u64) -> pub u64 {
        self.storage.circle_member_counts.at(circle_id).read()
    }

    #[external("public")]
    #[view]
    fn get_circle_reward_pool(circle_id: u64) -> pub u128 {
        self.storage.circle_reward_pools.at(circle_id).read()
    }

    #[external("public")]
    #[view]
    fn get_circle_total_distributed(circle_id: u64) -> pub u128 {
        self.storage.circle_total_distributed.at(circle_id).read()
    }

    #[external("public")]
    #[view]
    fn is_circle_member(circle_id: u64, member: AztecAddress) -> pub bool {
        let key = poseidon2_hash([circle_id as Field, member.to_field()]);
        self.storage.is_member.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_give_received(circle_id: u64, epoch: u64, member: AztecAddress) -> pub u64 {
        let key = poseidon2_hash([circle_id as Field, epoch as Field, member.to_field()]);
        self.storage.give_received.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_give_spent(circle_id: u64, epoch: u64, member: AztecAddress) -> pub u64 {
        let key = poseidon2_hash([circle_id as Field, epoch as Field, member.to_field()]);
        self.storage.give_spent.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_epoch_total_give(circle_id: u64, epoch: u64) -> pub u64 {
        let key = poseidon2_hash([circle_id as Field, epoch as Field]);
        self.storage.epoch_total_give.at(key).read()
    }

    #[external("public")]
    #[view]
    fn has_claimed(circle_id: u64, epoch: u64, member: AztecAddress) -> pub bool {
        let key = poseidon2_hash([circle_id as Field, epoch as Field, member.to_field()]);
        self.storage.epoch_claimed.at(key).read()
    }
}
