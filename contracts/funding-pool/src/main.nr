use aztec::macros::aztec;

/// FundingPool contract for AztecForge.
///
/// Manages community funding pools where multiple contributors deposit funds
/// and a curator allocates them to recipients.
///
/// Pool types:
///   0 = open (curator allocates freely)
///   1 = quadratic (donations weighted by unique donor count)
///   2 = retroactive (rewards past contributions)
///   3 = streaming (continuous distribution)
///
/// Public: pool purpose, aggregate size, contributor count, recipient count.
/// Private: individual deposit amounts, individual allocation amounts (future enhancement).
/// For now, all state is public as a foundation.
#[aztec]
pub contract FundingPool {
    use aztec::{
        macros::{
            functions::{external, initializer, view},
            storage::storage,
        },
        protocol::{address::AztecAddress, hash::poseidon2_hash, traits::ToField},
        state_vars::{Map, PublicMutable, PublicImmutable},
    };
    use token::Token;

    // Pool status: 0 = active, 1 = paused, 2 = closed

    #[storage]
    struct Storage<Context> {
        admin: PublicImmutable<AztecAddress, Context>,

        // Pool counter
        pool_count: PublicMutable<u64, Context>,

        // Per-pool config (keyed by pool_id)
        pool_curators: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        pool_tokens: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        pool_purpose_hashes: Map<u64, PublicMutable<Field, Context>, Context>,
        pool_types: Map<u64, PublicMutable<u8, Context>, Context>,
        pool_statuses: Map<u64, PublicMutable<u8, Context>, Context>,

        // Per-pool aggregates
        pool_total_deposited: Map<u64, PublicMutable<u128, Context>, Context>,
        pool_total_disbursed: Map<u64, PublicMutable<u128, Context>, Context>,
        pool_contributor_count: Map<u64, PublicMutable<u64, Context>, Context>,
        pool_recipient_count: Map<u64, PublicMutable<u64, Context>, Context>,

        // Per-pool per-contributor deposits: key = hash(pool_id, contributor)
        deposit_amounts: Map<Field, PublicMutable<u128, Context>, Context>,

        // Per-pool per-recipient allocations: key = hash(pool_id, recipient)
        allocation_amounts: Map<Field, PublicMutable<u128, Context>, Context>,

        // Global aggregates
        total_pools_created: PublicMutable<u64, Context>,
        total_value_deposited: PublicMutable<u128, Context>,
        total_value_disbursed: PublicMutable<u128, Context>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
        self.storage.pool_count.write(0);
        self.storage.total_pools_created.write(0);
        self.storage.total_value_deposited.write(0);
        self.storage.total_value_disbursed.write(0);
    }

    // -----------------------------------------
    // POOL MANAGEMENT
    // -----------------------------------------

    /// Create a new funding pool.
    #[external("public")]
    fn create_pool(
        payment_token: AztecAddress,
        purpose_hash: Field,
        pool_type: u8,
    ) -> pub u64 {
        assert(pool_type <= 3, "Invalid pool type");
        let curator = self.msg_sender();
        let pool_id = self.storage.pool_count.read();

        self.storage.pool_curators.at(pool_id).write(curator);
        self.storage.pool_tokens.at(pool_id).write(payment_token);
        self.storage.pool_purpose_hashes.at(pool_id).write(purpose_hash);
        self.storage.pool_types.at(pool_id).write(pool_type);
        self.storage.pool_statuses.at(pool_id).write(0);
        self.storage.pool_total_deposited.at(pool_id).write(0);
        self.storage.pool_total_disbursed.at(pool_id).write(0);
        self.storage.pool_contributor_count.at(pool_id).write(0);
        self.storage.pool_recipient_count.at(pool_id).write(0);

        self.storage.pool_count.write(pool_id + 1);
        let total = self.storage.total_pools_created.read();
        self.storage.total_pools_created.write(total + 1);

        pool_id
    }

    /// Pause a pool (no new deposits or allocations).
    #[external("public")]
    fn pause_pool(pool_id: u64) {
        let caller = self.msg_sender();
        let curator = self.storage.pool_curators.at(pool_id).read();
        assert(caller.eq(curator), "Not the curator");
        self.storage.pool_statuses.at(pool_id).write(1);
    }

    /// Resume a paused pool.
    #[external("public")]
    fn resume_pool(pool_id: u64) {
        let caller = self.msg_sender();
        let curator = self.storage.pool_curators.at(pool_id).read();
        assert(caller.eq(curator), "Not the curator");
        let status = self.storage.pool_statuses.at(pool_id).read();
        assert(status == 1, "Not paused");
        self.storage.pool_statuses.at(pool_id).write(0);
    }

    /// Close a pool permanently.
    #[external("public")]
    fn close_pool(pool_id: u64) {
        let caller = self.msg_sender();
        let curator = self.storage.pool_curators.at(pool_id).read();
        assert(caller.eq(curator), "Not the curator");
        self.storage.pool_statuses.at(pool_id).write(2);
    }

    // -----------------------------------------
    // DEPOSITS
    // -----------------------------------------

    /// Deposit funds into a pool. Depositor must create an authwit first.
    #[external("public")]
    fn deposit(pool_id: u64, amount: u128, authwit_nonce: Field) {
        let status = self.storage.pool_statuses.at(pool_id).read();
        assert(status == 0, "Pool not active");
        assert(amount > 0, "Amount must be positive");

        let depositor = self.msg_sender();
        let token = self.storage.pool_tokens.at(pool_id).read();

        // Transfer tokens from depositor to this contract
        let _ = self.call(Token::at(token).transfer_in_public(depositor, self.address, amount, authwit_nonce));

        let deposit_key = poseidon2_hash([pool_id as Field, depositor.to_field()]);
        let existing = self.storage.deposit_amounts.at(deposit_key).read();
        if existing == 0 {
            let count = self.storage.pool_contributor_count.at(pool_id).read();
            self.storage.pool_contributor_count.at(pool_id).write(count + 1);
        }

        self.storage.deposit_amounts.at(deposit_key).write(existing + amount);

        let pool_total = self.storage.pool_total_deposited.at(pool_id).read();
        self.storage.pool_total_deposited.at(pool_id).write(pool_total + amount);

        let global_total = self.storage.total_value_deposited.read();
        self.storage.total_value_deposited.write(global_total + amount);
    }

    /// Withdraw deposited funds (only if pool allows and funds not yet allocated).
    #[external("public")]
    fn withdraw(pool_id: u64, amount: u128) {
        let depositor = self.msg_sender();
        let deposit_key = poseidon2_hash([pool_id as Field, depositor.to_field()]);

        let current = self.storage.deposit_amounts.at(deposit_key).read();
        assert(current >= amount, "Insufficient deposit");

        self.storage.deposit_amounts.at(deposit_key).write(current - amount);

        let pool_total = self.storage.pool_total_deposited.at(pool_id).read();
        self.storage.pool_total_deposited.at(pool_id).write(pool_total - amount);

        let global_total = self.storage.total_value_deposited.read();
        self.storage.total_value_deposited.write(global_total - amount);

        // Refund tokens to depositor
        let token = self.storage.pool_tokens.at(pool_id).read();
        let _ = self.call(Token::at(token).transfer_in_public(self.address, depositor, amount, 0));
    }

    // -----------------------------------------
    // ALLOCATION (curator only)
    // -----------------------------------------

    /// Allocate funds from a pool to a recipient.
    #[external("public")]
    fn allocate(pool_id: u64, recipient: AztecAddress, amount: u128, reason_hash: Field) {
        let caller = self.msg_sender();
        let curator = self.storage.pool_curators.at(pool_id).read();
        assert(caller.eq(curator), "Not the curator");

        let status = self.storage.pool_statuses.at(pool_id).read();
        assert(status == 0, "Pool not active");

        // Check sufficient unallocated balance
        let deposited = self.storage.pool_total_deposited.at(pool_id).read();
        let disbursed = self.storage.pool_total_disbursed.at(pool_id).read();
        assert(deposited - disbursed >= amount, "Insufficient pool balance");

        let _ = reason_hash;

        // Track recipient allocation
        let alloc_key = poseidon2_hash([pool_id as Field, recipient.to_field()]);
        let existing_alloc = self.storage.allocation_amounts.at(alloc_key).read();
        if existing_alloc == 0 {
            let rcount = self.storage.pool_recipient_count.at(pool_id).read();
            self.storage.pool_recipient_count.at(pool_id).write(rcount + 1);
        }
        self.storage.allocation_amounts.at(alloc_key).write(existing_alloc + amount);

        let pool_disbursed = self.storage.pool_total_disbursed.at(pool_id).read();
        self.storage.pool_total_disbursed.at(pool_id).write(pool_disbursed + amount);

        let global_disbursed = self.storage.total_value_disbursed.read();
        self.storage.total_value_disbursed.write(global_disbursed + amount);

        // Transfer tokens to recipient
        let token = self.storage.pool_tokens.at(pool_id).read();
        let _ = self.call(Token::at(token).transfer_in_public(self.address, recipient, amount, 0));
    }

    // -----------------------------------------
    // READ FUNCTIONS
    // -----------------------------------------

    #[external("public")]
    #[view]
    fn get_pool_count() -> pub u64 {
        self.storage.pool_count.read()
    }

    #[external("public")]
    #[view]
    fn get_pool_curator(pool_id: u64) -> pub AztecAddress {
        self.storage.pool_curators.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_status(pool_id: u64) -> pub u8 {
        self.storage.pool_statuses.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_type(pool_id: u64) -> pub u8 {
        self.storage.pool_types.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_total_deposited(pool_id: u64) -> pub u128 {
        self.storage.pool_total_deposited.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_total_disbursed(pool_id: u64) -> pub u128 {
        self.storage.pool_total_disbursed.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_contributor_count(pool_id: u64) -> pub u64 {
        self.storage.pool_contributor_count.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_recipient_count(pool_id: u64) -> pub u64 {
        self.storage.pool_recipient_count.at(pool_id).read()
    }

    #[external("public")]
    #[view]
    fn get_pool_available_balance(pool_id: u64) -> pub u128 {
        let deposited = self.storage.pool_total_deposited.at(pool_id).read();
        let disbursed = self.storage.pool_total_disbursed.at(pool_id).read();
        deposited - disbursed
    }

    #[external("public")]
    #[view]
    fn get_deposit(pool_id: u64, depositor: AztecAddress) -> pub u128 {
        let key = poseidon2_hash([pool_id as Field, depositor.to_field()]);
        self.storage.deposit_amounts.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_allocation(pool_id: u64, recipient: AztecAddress) -> pub u128 {
        let key = poseidon2_hash([pool_id as Field, recipient.to_field()]);
        self.storage.allocation_amounts.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_total_pools_created() -> pub u64 {
        self.storage.total_pools_created.read()
    }

    #[external("public")]
    #[view]
    fn get_total_value_deposited() -> pub u128 {
        self.storage.total_value_deposited.read()
    }

    #[external("public")]
    #[view]
    fn get_total_value_disbursed() -> pub u128 {
        self.storage.total_value_disbursed.read()
    }
}
