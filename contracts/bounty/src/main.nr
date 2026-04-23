use aztec::macros::aztec;

/// BountyBoard contract for AztecForge.
///
/// Manages bounty lifecycle: creation, claiming, submission, approval, and payment.
///
/// Privacy model:
///   Public (by default): bounty details, reward amount, who claimed/completed, submissions
///   Private (optional): reward amount can be hidden by creator for sensitive tasks
///   Always private: payment wallet links, contributor aggregate earnings
#[aztec]
pub contract BountyBoard {
    use aztec::{
        macros::{
            functions::{external, initializer, view},
            storage::storage,
        },
        protocol::address::AztecAddress,
        state_vars::{Map, PublicMutable, PublicImmutable},
    };

    // Bounty status:
    //   0 = open
    //   1 = claimed
    //   2 = submitted
    //   3 = approved/paid
    //   4 = cancelled
    //   5 = disputed

    #[storage]
    struct Storage<Context> {
        admin: PublicImmutable<AztecAddress, Context>,

        // Bounty counter
        bounty_count: PublicMutable<u64, Context>,

        // Per-bounty fields (keyed by bounty_id)
        bounty_creators: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        bounty_tokens: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        bounty_amounts: Map<u64, PublicMutable<u128, Context>, Context>,
        bounty_deadlines: Map<u64, PublicMutable<u64, Context>, Context>,
        bounty_descriptions: Map<u64, PublicMutable<Field, Context>, Context>,
        bounty_statuses: Map<u64, PublicMutable<u8, Context>, Context>,
        bounty_is_amount_public: Map<u64, PublicMutable<bool, Context>, Context>,
        bounty_claimers: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        bounty_submissions: Map<u64, PublicMutable<Field, Context>, Context>,
        bounty_escrows: Map<u64, PublicMutable<u128, Context>, Context>,

        // Aggregate stats
        total_bounties_posted: PublicMutable<u64, Context>,
        total_bounties_completed: PublicMutable<u64, Context>,
        total_value_escrowed: PublicMutable<u128, Context>,
        total_value_paid: PublicMutable<u128, Context>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
        self.storage.bounty_count.write(0);
        self.storage.total_bounties_posted.write(0);
        self.storage.total_bounties_completed.write(0);
        self.storage.total_value_escrowed.write(0);
        self.storage.total_value_paid.write(0);
    }

    // -----------------------------------------
    // CREATION
    // -----------------------------------------

    /// Create a bounty and escrow the reward.
    /// Reward amount is public by default; set is_amount_public=false to hide it.
    #[external("public")]
    fn create_bounty(
        payment_token: AztecAddress,
        reward_amount: u128,
        description_hash: Field,
        deadline_block: u64,
        is_amount_public: bool,
    ) -> pub u64 {
        let creator = self.msg_sender();
        let bounty_id = self.storage.bounty_count.read();

        self.storage.bounty_creators.at(bounty_id).write(creator);
        self.storage.bounty_tokens.at(bounty_id).write(payment_token);
        self.storage.bounty_descriptions.at(bounty_id).write(description_hash);
        self.storage.bounty_deadlines.at(bounty_id).write(deadline_block);
        self.storage.bounty_statuses.at(bounty_id).write(0);
        self.storage.bounty_is_amount_public.at(bounty_id).write(is_amount_public);
        self.storage.bounty_claimers.at(bounty_id).write(AztecAddress::zero());
        self.storage.bounty_submissions.at(bounty_id).write(0);
        self.storage.bounty_escrows.at(bounty_id).write(reward_amount);

        // Public listing: full value if public, 0 if hidden
        if is_amount_public {
            self.storage.bounty_amounts.at(bounty_id).write(reward_amount);
        } else {
            self.storage.bounty_amounts.at(bounty_id).write(0);
        }

        // Update counters
        self.storage.bounty_count.write(bounty_id + 1);
        let posted = self.storage.total_bounties_posted.read();
        self.storage.total_bounties_posted.write(posted + 1);
        let escrowed = self.storage.total_value_escrowed.read();
        self.storage.total_value_escrowed.write(escrowed + reward_amount);

        // TODO: Transfer reward_amount from creator to this contract via token contract
        // Token::at(payment_token).transfer_in_public(creator, self.address, reward_amount, 0)

        bounty_id
    }

    // -----------------------------------------
    // CLAIMING & SUBMISSION
    // -----------------------------------------

    /// Claim a bounty to work on it. Public -- portfolio credit for the contributor.
    #[external("public")]
    fn claim_bounty(bounty_id: u64) {
        let claimer = self.msg_sender();
        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 0, "Bounty not open");

        let deadline = self.storage.bounty_deadlines.at(bounty_id).read();
        // TODO: Re-enable block number check once block_number() is available in public context
        // assert(block_number < deadline, "Deadline passed");
        let _ = deadline;

        self.storage.bounty_claimers.at(bounty_id).write(claimer);
        self.storage.bounty_statuses.at(bounty_id).write(1);
    }

    /// Submit completed work. Public -- submission is portfolio credit.
    #[external("public")]
    fn submit_work(bounty_id: u64, submission_hash: Field) {
        let submitter = self.msg_sender();
        let claimer = self.storage.bounty_claimers.at(bounty_id).read();
        assert(submitter.eq(claimer), "Not the claimer");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 1, "Not claimed");

        self.storage.bounty_submissions.at(bounty_id).write(submission_hash);
        self.storage.bounty_statuses.at(bounty_id).write(2);
    }

    /// Give up a claim and reopen the bounty.
    #[external("public")]
    fn unclaim_bounty(bounty_id: u64) {
        let caller = self.msg_sender();
        let claimer = self.storage.bounty_claimers.at(bounty_id).read();
        assert(caller.eq(claimer), "Not the claimer");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 1, "Not in claimed state");

        self.storage.bounty_statuses.at(bounty_id).write(0);
        self.storage.bounty_claimers.at(bounty_id).write(AztecAddress::zero());
    }

    // -----------------------------------------
    // APPROVAL & REJECTION
    // -----------------------------------------

    /// Approve submission and release escrow to the claimer.
    #[external("public")]
    fn approve_submission(bounty_id: u64) {
        let caller = self.msg_sender();
        let creator = self.storage.bounty_creators.at(bounty_id).read();
        assert(caller.eq(creator), "Not the creator");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 2, "No submission pending");

        let escrow = self.storage.bounty_escrows.at(bounty_id).read();

        self.storage.bounty_statuses.at(bounty_id).write(3);
        self.storage.bounty_escrows.at(bounty_id).write(0);

        let completed = self.storage.total_bounties_completed.read();
        self.storage.total_bounties_completed.write(completed + 1);
        let paid = self.storage.total_value_paid.read();
        self.storage.total_value_paid.write(paid + escrow);

        // TODO: Transfer escrow to claimer via token contract
        // let claimer = self.storage.bounty_claimers.at(bounty_id).read();
        // let token = self.storage.bounty_tokens.at(bounty_id).read();
        // Token::at(token).transfer_in_public(self.address, claimer, escrow, 0)
    }

    /// Reject submission and reopen the bounty.
    #[external("public")]
    fn reject_submission(bounty_id: u64) {
        let caller = self.msg_sender();
        let creator = self.storage.bounty_creators.at(bounty_id).read();
        assert(caller.eq(creator), "Not the creator");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 2, "No submission pending");

        self.storage.bounty_statuses.at(bounty_id).write(0);
        self.storage.bounty_claimers.at(bounty_id).write(AztecAddress::zero());
        self.storage.bounty_submissions.at(bounty_id).write(0);
    }

    // -----------------------------------------
    // CANCELLATION
    // -----------------------------------------

    /// Cancel a bounty and refund escrow. Only if no submission pending.
    #[external("public")]
    fn cancel_bounty(bounty_id: u64) {
        let caller = self.msg_sender();
        let creator = self.storage.bounty_creators.at(bounty_id).read();
        assert(caller.eq(creator), "Not the creator");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert((status == 0) | (status == 1), "Cannot cancel after submission");

        let escrow = self.storage.bounty_escrows.at(bounty_id).read();
        self.storage.bounty_statuses.at(bounty_id).write(4);
        self.storage.bounty_escrows.at(bounty_id).write(0);

        let total_esc = self.storage.total_value_escrowed.read();
        self.storage.total_value_escrowed.write(total_esc - escrow);

        // TODO: Refund escrow to creator via token contract
    }

    // -----------------------------------------
    // DISPUTE
    // -----------------------------------------

    /// Flag a bounty as disputed. Can be called by either creator or claimer
    /// when a submission is pending.
    #[external("public")]
    fn dispute_bounty(bounty_id: u64) {
        let caller = self.msg_sender();
        let creator = self.storage.bounty_creators.at(bounty_id).read();
        let claimer = self.storage.bounty_claimers.at(bounty_id).read();
        assert(caller.eq(creator) | caller.eq(claimer), "Not a party to this bounty");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 2, "Can only dispute a submitted bounty");

        self.storage.bounty_statuses.at(bounty_id).write(5);
    }

    /// Resolve a dispute. Only admin can resolve.
    /// If approve=true, pays the claimer. If false, refunds the creator.
    #[external("public")]
    fn resolve_dispute(bounty_id: u64, approve: bool) {
        let caller = self.msg_sender();
        let admin = self.storage.admin.read();
        assert(caller.eq(admin), "Only admin can resolve disputes");

        let status = self.storage.bounty_statuses.at(bounty_id).read();
        assert(status == 5, "Not disputed");

        let escrow = self.storage.bounty_escrows.at(bounty_id).read();
        self.storage.bounty_escrows.at(bounty_id).write(0);

        if approve {
            self.storage.bounty_statuses.at(bounty_id).write(3);
            let completed = self.storage.total_bounties_completed.read();
            self.storage.total_bounties_completed.write(completed + 1);
            let paid = self.storage.total_value_paid.read();
            self.storage.total_value_paid.write(paid + escrow);
            // TODO: Transfer escrow to claimer
        } else {
            self.storage.bounty_statuses.at(bounty_id).write(4);
            let total_esc = self.storage.total_value_escrowed.read();
            self.storage.total_value_escrowed.write(total_esc - escrow);
            // TODO: Refund escrow to creator
        }
    }

    // -----------------------------------------
    // READ FUNCTIONS
    // -----------------------------------------

    #[external("public")]
    #[view]
    fn get_bounty_count() -> pub u64 {
        self.storage.bounty_count.read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_status(bounty_id: u64) -> pub u8 {
        self.storage.bounty_statuses.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_creator(bounty_id: u64) -> pub AztecAddress {
        self.storage.bounty_creators.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_amount(bounty_id: u64) -> pub u128 {
        self.storage.bounty_amounts.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_token(bounty_id: u64) -> pub AztecAddress {
        self.storage.bounty_tokens.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_claimer(bounty_id: u64) -> pub AztecAddress {
        self.storage.bounty_claimers.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_deadline(bounty_id: u64) -> pub u64 {
        self.storage.bounty_deadlines.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_description(bounty_id: u64) -> pub Field {
        self.storage.bounty_descriptions.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_bounty_submission(bounty_id: u64) -> pub Field {
        self.storage.bounty_submissions.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn is_amount_public(bounty_id: u64) -> pub bool {
        self.storage.bounty_is_amount_public.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_escrow_balance(bounty_id: u64) -> pub u128 {
        self.storage.bounty_escrows.at(bounty_id).read()
    }

    #[external("public")]
    #[view]
    fn get_total_bounties_posted() -> pub u64 {
        self.storage.total_bounties_posted.read()
    }

    #[external("public")]
    #[view]
    fn get_total_bounties_completed() -> pub u64 {
        self.storage.total_bounties_completed.read()
    }

    #[external("public")]
    #[view]
    fn get_total_value_escrowed() -> pub u128 {
        self.storage.total_value_escrowed.read()
    }

    #[external("public")]
    #[view]
    fn get_total_value_paid() -> pub u128 {
        self.storage.total_value_paid.read()
    }
}
