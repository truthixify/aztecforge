# Private Commerce Layer — Detailed Specification

## 1. Executive Summary

A comprehensive private commerce protocol on Aztec Network covering **every type of payment and commercial relationship that benefits from privacy**: subscriptions, memberships, loyalty programs, token gating, payroll, fundraising, grants disbursement, invoicing, tipping, bounties, and one-time purchases.

Every transaction hides sender, receiver, amount, and purpose by default. Merchants see aggregate revenue. Employees see their own salary. Auditors get selective disclosure via view keys. The public sees nothing.

This is the **payment privacy layer that doesn't exist anywhere** — not on Ethereum, not on Monero, not on any L2.

---

## 2. Problem Statement

### 2.1 The Transparency Tax on Blockchain Commerce

Blockchain commerce is growing — 25M+ merchants accept crypto, Shopify/Stripe USDC integration serves 34 countries, stablecoin payment volume exceeds $6.3B on Shopify alone. But every payment is a public confession.

**Category-by-category breakdown of what transparency exposes:**

| Payment Type | What's Exposed Today | Real-World Harm |
|-------------|---------------------|-----------------|
| **Subscriptions** | Which services you pay for, how much, how long | A stream to a therapy app tells the world about your mental health |
| **Payroll** | Every employee's salary, bonuses, equity | Competitors poach top earners; morale collapses when pay gaps are visible |
| **Fundraising** | Every investor, their allocation, valuation | Competitors see your runway; investors' portfolios are exposed |
| **Grants** | Grant amounts, recipients, timing | Political pressure on grant-makers; recipient stigma |
| **Invoicing** | Vendor pricing, client relationships, margins | Competitors reverse-engineer your cost structure |
| **Memberships** | Which orgs you belong to, tier, dues | Political associations, religious groups, professional bodies — all public |
| **Loyalty** | Purchase history, frequency, spending patterns | Complete consumer surveillance via on-chain purchase records |
| **Tipping/Donations** | Who supports whom, how much | Donors to controversial causes face retaliation |
| **Bounties** | Payment wallet links, contributor aggregate earnings | Wallet tracing, total income calculation |
| **Token Gating** | Entire wallet portfolio exposed for one verification | Collab.Land exposes all holdings to verify one token |

### 2.2 What Exists Today (And Why It's Not Enough)

**Transparent payment rails (no privacy):**
- Superfluid: real-time streaming — all streams visible
- Sablier: token streaming — all streams visible
- LlamaPay: streaming payroll — all streams visible
- Unlock Protocol: membership NFTs — visible in wallet
- Collab.Land: token gating — requires wallet scan
- Request Finance: invoicing — $1.3B+ volume, all transparent (except Aleo payroll pilot)
- Gitcoin: grants — all grant amounts and recipients public
- Juicebox: fundraising — all contributions and treasury movements public
- Mirror: crowdfunding — all backers and amounts public

**Privacy transfer layers (no commerce logic):**
- Railgun: $140M+ shielded — transfers only, no subscriptions/payroll/etc.
- Monero: 1,600+ merchants — private transfers but no smart contracts
- Zcash: ~900 merchants — optional shielding, no commerce tooling
- Tornado Cash / Privacy Pools: mixing only, no commerce

**The gap:** Privacy exists at the transfer layer. Commerce logic exists at the transparent layer. Nobody has combined them.

### 2.3 Consumer and Business Demand

| Signal | Data Point |
|--------|-----------|
| Consumers want payment privacy | 58% concerned about digital payment privacy (ECB SPACE 2024) |
| Cash persists because of privacy | 41% cite anonymity as cash's #1 advantage; 52% of POS transactions still cash |
| Businesses need confidentiality | B2B stablecoin payments: $226B/year, growing 733% YoY — all transparent |
| Payroll privacy is a legal requirement | GDPR, many US state laws prohibit salary disclosure without consent |
| Fundraising confidentiality is standard | Traditional VC rounds are private; on-chain fundraising exposes everything |
| Grant privacy protects recipients | Political/controversial research grants expose recipients to pressure |

---

## 3. Protocol Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVATE COMMERCE PROTOCOL                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PAYMENT MODULES                        │   │
│  │                                                           │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐   │   │
│  │  │Subscriptions│ │   Payroll    │ │  Fundraising    │   │   │
│  │  │             │ │              │ │                 │   │   │
│  │  │ - subscribe │ │ - add_emp   │ │ - create_round  │   │   │
│  │  │ - pay       │ │ - pay_salary│ │ - invest        │   │   │
│  │  │ - cancel    │ │ - pay_bonus │ │ - vest          │   │   │
│  │  │ - upgrade   │ │ - terminate │ │ - refund        │   │   │
│  │  └─────────────┘ └──────────────┘ └─────────────────┘   │   │
│  │                                                           │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐   │   │
│  │  │   Grants    │ │  Invoicing   │ │   Bounties      │   │   │
│  │  │             │ │              │ │                 │   │   │
│  │  │ - create    │ │ - create_inv│ │ - create_bounty │   │   │
│  │  │ - apply     │ │ - pay_inv   │ │ - submit_work   │   │   │
│  │  │ - disburse  │ │ - dispute   │ │ - approve_claim │   │   │
│  │  │ - milestone │ │ - receipt   │ │ - pay_bounty    │   │   │
│  │  └─────────────┘ └──────────────┘ └─────────────────┘   │   │
│  │                                                           │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐   │   │
│  │  │  Tipping /  │ │ One-Time    │ │   Escrow        │   │   │
│  │  │  Donations  │ │ Purchases   │ │                 │   │   │
│  │  │             │ │              │ │ - create        │   │   │
│  │  │ - tip       │ │ - pay       │ │ - release       │   │   │
│  │  │ - donate    │ │ - receipt   │ │ - dispute       │   │   │
│  │  │ - recurring │ │ - refund    │ │ - refund        │   │   │
│  │  └─────────────┘ └──────────────┘ └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ACCESS MODULES                          │   │
│  │                                                           │   │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │  Memberships    │  │  Private Gate (Token Gating) │   │   │
│  │  │                 │  │                              │   │   │
│  │  │ - issue         │  │ - prove_access              │   │   │
│  │  │ - prove         │  │ - prove_nft                 │   │   │
│  │  │ - renew         │  │ - prove_balance             │   │   │
│  │  │ - revoke        │  │ - prove_multi               │   │   │
│  │  └─────────────────┘  └──────────────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │            Loyalty Engine                            │ │   │
│  │  │                                                      │ │   │
│  │  │ - earn_points    - redeem    - prove_status          │ │   │
│  │  │ - transfer       - tier_up   - prove_balance         │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  SHARED INFRASTRUCTURE                     │   │
│  │                                                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐ │   │
│  │  │ Payment  │ │ Receipt  │ │Compliance│ │  Merchant   │ │   │
│  │  │ Router   │ │ Registry │ │  Layer   │ │  Registry   │ │   │
│  │  └──────────┘ └──────────┘ └─────────┘ └─────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Privacy Model

Every module follows the same privacy pattern:

```
PRIVATE (only visible to participants):
  - Who is paying / receiving
  - How much
  - What for
  - Payment history
  - Relationship duration
  - Individual terms (salary, price, tier)

PUBLIC (visible to everyone):
  - That a service/organization/program exists
  - Aggregate statistics (total members, total revenue, total grants)
  - Verification endpoints ("is this proof valid?" → yes/no)
  - Protocol rules and configurations
  - Compliance attestations (if opted in)

SELECTIVELY DISCLOSED (via view keys):
  - Auditors can see specific records with user permission
  - Tax authorities can verify income without seeing employer
  - Regulators can verify compliance without seeing individuals
```

---

## 4. Data Models

### 4.1 Core Note Types

All private state is stored as notes. Each module has its own note type.

```noir
// ════════════════════════════════════
// PAYMENT NOTES
// ════════════════════════════════════

/// Represents an active subscription relationship.
#[note]
struct SubscriptionNote {
    plan_id: Field,                   // which plan (references public PlanConfig)
    merchant: AztecAddress,           // who receives payment
    payment_token: AztecAddress,      // which token (USDC, ETH, etc.)
    amount: u128,                     // payment amount per cycle
    frequency_blocks: u64,            // blocks between payments
    next_payment_block: u64,          // when next payment is due
    auto_renew: bool,                 // auto-pay or manual renewal
    started_at_block: u64,            // when subscription began
    payments_made: u32,               // count of successful payments
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Represents an employment/contractor payment relationship.
#[note]
struct PayrollNote {
    employer: AztecAddress,           // the paying entity
    employee: AztecAddress,           // the receiving individual
    payment_token: AztecAddress,
    salary_amount: u128,              // per pay period
    pay_period_blocks: u64,           // blocks per pay period
    next_pay_block: u64,              // when next payment is due
    role_hash: Field,                 // hash of role/title (private metadata)
    start_block: u64,                 // employment start
    vesting_schedule_hash: Field,     // hash of vesting terms (if any)
    tax_withholding_bps: u64,         // basis points withheld for tax (configurable)
    status: u8,                       // 0=active, 1=paused, 2=terminated
    owner: AztecAddress,              // employee owns the note
    owner_npk_m_hash: Field,
}

/// Represents a contribution to a fundraising round.
#[note]
struct InvestmentNote {
    round_id: Field,                  // which fundraising round
    investor: AztecAddress,
    project: AztecAddress,            // the entity raising funds
    payment_token: AztecAddress,
    amount_invested: u128,            // how much was invested
    token_allocation: u128,           // tokens/equity received
    valuation_at_invest: u128,        // implied valuation at time of investment
    vesting_cliff_blocks: u64,        // cliff period in blocks
    vesting_duration_blocks: u64,     // total vesting in blocks
    vested_amount: u128,              // currently vested
    invested_at_block: u64,
    owner: AztecAddress,              // investor owns the note
    owner_npk_m_hash: Field,
}

/// Represents a grant award and its disbursement schedule.
#[note]
struct GrantNote {
    program_id: Field,                // which grant program
    grantor: AztecAddress,            // who is funding
    recipient: AztecAddress,          // who receives
    payment_token: AztecAddress,
    total_amount: u128,               // total grant value
    disbursed_amount: u128,           // how much has been paid out
    milestones_total: u8,             // total number of milestones
    milestones_completed: u8,         // milestones approved
    per_milestone_amount: u128,       // payment per milestone (can be non-uniform via hash)
    milestone_schedule_hash: Field,   // hash of detailed milestone schedule
    application_hash: Field,          // hash of the grant application
    awarded_at_block: u64,
    status: u8,                       // 0=active, 1=paused, 2=completed, 3=cancelled
    owner: AztecAddress,              // recipient owns the note
    owner_npk_m_hash: Field,
}

/// Represents a private invoice.
#[note]
struct InvoiceNote {
    invoice_id: Field,
    issuer: AztecAddress,             // who sent the invoice
    payer: AztecAddress,              // who should pay
    payment_token: AztecAddress,
    amount: u128,
    due_block: u64,                   // payment deadline
    description_hash: Field,          // hash of line items/description
    status: u8,                       // 0=pending, 1=paid, 2=overdue, 3=disputed, 4=cancelled
    paid_at_block: u64,               // 0 if unpaid
    issued_at_block: u64,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Represents a bounty (open or assigned).
#[note]
struct BountyNote {
    bounty_id: Field,
    creator: AztecAddress,            // who posted the bounty
    payment_token: AztecAddress,
    reward_amount: u128,
    description_hash: Field,          // hash of bounty requirements
    deadline_block: u64,              // submission deadline
    claimer: AztecAddress,            // who claimed it (zero if open)
    submission_hash: Field,           // hash of submitted work
    status: u8,                       // 0=open, 1=claimed, 2=submitted, 3=approved, 4=paid, 5=disputed
    is_amount_public: bool,           // creator chooses: true = amount visible in public listing, false = hidden
    created_at_block: u64,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}
// NOTE: When is_amount_public is true, the reward_amount is also stored in the
// public BountyListing so contributors can see what they're working for.
// When false, only the creator and eventual claimer see the amount.
// Default should be PUBLIC — contributors need to know the reward to avoid wasting effort.

/// Represents a private tip or donation.
#[note]
struct TipNote {
    sender: AztecAddress,
    recipient: AztecAddress,
    payment_token: AztecAddress,
    amount: u128,
    message_hash: Field,              // optional encrypted message hash
    is_recurring: bool,
    frequency_blocks: u64,            // 0 if one-time
    next_tip_block: u64,              // 0 if one-time
    category: u8,                     // 0=tip, 1=donation, 2=patronage
    sent_at_block: u64,
    owner: AztecAddress,              // recipient owns the note
    owner_npk_m_hash: Field,
}

/// Generic private payment receipt.
#[note]
struct ReceiptNote {
    payment_type: u8,                 // enum: subscription, payroll, invoice, etc.
    payment_id: Field,                // reference to the source note
    payer: AztecAddress,
    payee: AztecAddress,
    payment_token: AztecAddress,
    amount: u128,
    paid_at_block: u64,
    receipt_hash: Field,              // hash of detailed receipt data
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Represents an escrow arrangement.
#[note]
struct EscrowNote {
    escrow_id: Field,
    depositor: AztecAddress,          // who put money in
    beneficiary: AztecAddress,        // who gets it on release
    arbiter: AztecAddress,            // who resolves disputes (can be a contract)
    payment_token: AztecAddress,
    amount: u128,
    release_conditions_hash: Field,   // hash of conditions for release
    expiry_block: u64,                // auto-refund after this block
    status: u8,                       // 0=locked, 1=released, 2=refunded, 3=disputed
    created_at_block: u64,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}


// ════════════════════════════════════
// ACCESS NOTES
// ════════════════════════════════════

/// Represents membership in an organization.
#[note]
struct MembershipNote {
    org_id: Field,
    tier: u8,                         // 0=basic, 1=silver, 2=gold, 3=platinum, etc.
    issued_at: u64,
    valid_until: u64,
    metadata_hash: Field,             // hash of additional membership data
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}

/// Represents loyalty program balance.
#[note]
struct LoyaltyNote {
    program_id: Field,
    points_balance: u128,
    lifetime_points: u128,            // total ever earned (for tier calculation)
    status_tier: u8,
    last_activity_block: u64,
    owner: AztecAddress,
    owner_npk_m_hash: Field,
}
```

### 4.2 Public Configuration Types

```noir
// These live in public state — visible to all.
// They define the "menu" that private notes reference.

struct PlanConfig {
    plan_id: Field,
    merchant: AztecAddress,
    name_hash: Field,                 // hash of plan name
    payment_token: AztecAddress,
    price: u128,                      // price per period
    period_blocks: u64,               // billing period in blocks
    is_active: bool,
    max_subscribers: u64,             // 0 = unlimited
    created_at_block: u64,
}

struct PayrollConfig {
    employer: AztecAddress,
    payment_token: AztecAddress,
    pay_period_blocks: u64,
    is_active: bool,
    total_employees: u64,             // aggregate count only
    total_paid_out: u128,             // aggregate only
}

struct FundraisingRound {
    round_id: Field,
    project: AztecAddress,
    payment_token: AztecAddress,
    target_amount: u128,              // fundraising goal
    raised_amount: u128,              // current total raised (aggregate)
    min_investment: u128,
    max_investment: u128,
    token_price: u128,                // price per token/unit
    start_block: u64,
    end_block: u64,
    investor_count: u64,              // aggregate count
    is_active: bool,
    is_finalized: bool,
}

struct GrantProgram {
    program_id: Field,
    grantor: AztecAddress,
    payment_token: AztecAddress,
    total_budget: u128,
    disbursed: u128,                  // aggregate total disbursed
    grants_awarded: u64,              // aggregate count
    application_deadline: u64,
    is_active: bool,
}

struct BountyBoard {
    board_id: Field,
    creator: AztecAddress,
    total_bounties: u64,              // aggregate count
    total_value_posted: u128,         // aggregate
    total_paid_out: u128,             // aggregate
    is_active: bool,
}

struct LoyaltyProgramConfig {
    program_id: Field,
    merchant: AztecAddress,
    points_per_unit: u128,            // points earned per token spent
    tier_thresholds: [u128; 4],       // points needed for each tier
    is_active: bool,
    total_members: u64,               // aggregate
    total_points_issued: u128,        // aggregate
    total_redemptions: u64,           // aggregate
}

struct OrgConfig {
    org_id: Field,
    admin: AztecAddress,
    name_hash: Field,
    total_members: u64,               // aggregate
    is_active: bool,
}

struct GateConfig {
    gate_id: Field,
    gate_type: u8,                    // 0=token, 1=nft, 2=subscription, 3=membership, 4=loyalty_tier
    required_token: AztecAddress,     // for type 0,1
    required_plan_id: Field,          // for type 2
    required_org_id: Field,           // for type 3
    required_program_id: Field,       // for type 4
    min_balance: u128,                // for type 0
    min_tier: u8,                     // for type 3,4
    is_active: bool,
}
```

---

## 5. Contract Specifications

### 5.1 SubscriptionManager

```noir
#[aztec]
contract SubscriptionManager {
    #[storage]
    struct Storage {
        // Private: subscriber notes
        subscriptions: Map<AztecAddress, PrivateSet<SubscriptionNote>>,
        // Private: receipts
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        // Public: plan definitions
        plans: Map<Field, PublicMutable<PlanConfig>>,
        // Public: aggregate stats per merchant
        merchant_stats: Map<AztecAddress, PublicMutable<MerchantStats>>,
        // Public: next plan_id counter
        plan_counter: PublicMutable<u64>,
    }

    // ── MERCHANT FUNCTIONS (PUBLIC) ──────────────────

    /// Create a new subscription plan.
    #[external("public")]
    fn create_plan(
        name_hash: Field,
        payment_token: AztecAddress,
        price: u128,
        period_blocks: u64,
        max_subscribers: u64,
    ) -> Field {
        let plan_id = poseidon2_hash([
            context.msg_sender().to_field(),
            storage.plan_counter.read() as Field,
        ]);

        storage.plans.at(plan_id).write(PlanConfig {
            plan_id,
            merchant: context.msg_sender(),
            name_hash,
            payment_token,
            price,
            period_blocks,
            is_active: true,
            max_subscribers,
            created_at_block: context.block_number(),
        });

        let counter = storage.plan_counter.read();
        storage.plan_counter.write(counter + 1);

        plan_id
    }

    /// Update plan pricing (affects new subscribers only).
    #[external("public")]
    fn update_plan_price(plan_id: Field, new_price: u128) {
        let mut plan = storage.plans.at(plan_id).read();
        assert(plan.merchant == context.msg_sender(), "Not plan owner");
        plan.price = new_price;
        storage.plans.at(plan_id).write(plan);
    }

    /// Deactivate a plan (no new subscribers, existing ones continue).
    #[external("public")]
    fn deactivate_plan(plan_id: Field) {
        let mut plan = storage.plans.at(plan_id).read();
        assert(plan.merchant == context.msg_sender(), "Not plan owner");
        plan.is_active = false;
        storage.plans.at(plan_id).write(plan);
    }

    // ── SUBSCRIBER FUNCTIONS (PRIVATE) ───────────────

    /// Subscribe to a plan. Creates private SubscriptionNote,
    /// transfers first payment to merchant.
    #[external("private")]
    fn subscribe(plan_id: Field, payment_token: AztecAddress) {
        let subscriber = context.msg_sender();

        // Read plan config via SharedMutable or enqueued public call
        // (private can't read public synchronously, so plan details
        //  must be passed as args and verified later in public)
        let plan = get_plan_config(plan_id);  // utility function

        // Transfer first payment privately
        Token::at(payment_token).transfer(
            subscriber,           // from
            plan.merchant,        // to
            plan.price,           // amount
        );

        // Create subscription note
        let sub_note = SubscriptionNote {
            plan_id,
            merchant: plan.merchant,
            payment_token,
            amount: plan.price,
            frequency_blocks: plan.period_blocks,
            next_payment_block: context.block_number() + plan.period_blocks,
            auto_renew: true,
            started_at_block: context.block_number(),
            payments_made: 1,
            owner: subscriber,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.subscriptions.at(subscriber).insert(&mut sub_note);

        // Create receipt
        create_receipt(subscriber, plan.merchant, payment_token, plan.price, 0, plan_id);

        // Update aggregate stats (public)
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_subscribers(Field)"),
            [plan_id],
        );
    }

    /// Pay the next billing cycle.
    /// Called by subscriber or an automated keeper.
    #[external("private")]
    fn pay_subscription(plan_id: Field) {
        let subscriber = context.msg_sender();

        // Get and nullify current subscription note
        let options = NoteGetterOptions::new()
            .select(SubscriptionNote::properties().plan_id, plan_id)
            .set_limit(1);
        let notes = storage.subscriptions.at(subscriber).get_notes(options);
        assert(notes.len() == 1, "Subscription not found");
        let old_note = notes[0];

        // Verify payment is due
        assert(
            context.block_number() >= old_note.next_payment_block,
            "Payment not yet due"
        );

        // Remove old note
        storage.subscriptions.at(subscriber).remove(old_note);

        // Transfer payment
        Token::at(old_note.payment_token).transfer(
            subscriber,
            old_note.merchant,
            old_note.amount,
        );

        // Create new note with updated schedule
        let new_note = SubscriptionNote {
            plan_id: old_note.plan_id,
            merchant: old_note.merchant,
            payment_token: old_note.payment_token,
            amount: old_note.amount,
            frequency_blocks: old_note.frequency_blocks,
            next_payment_block: old_note.next_payment_block + old_note.frequency_blocks,
            auto_renew: old_note.auto_renew,
            started_at_block: old_note.started_at_block,
            payments_made: old_note.payments_made + 1,
            owner: subscriber,
            owner_npk_m_hash: old_note.owner_npk_m_hash,
        };

        storage.subscriptions.at(subscriber).insert(&mut new_note);

        // Create receipt
        create_receipt(
            subscriber, old_note.merchant, old_note.payment_token,
            old_note.amount, 0, plan_id
        );
    }

    /// Cancel a subscription.
    /// Nullifies the note — no public trace.
    #[external("private")]
    fn cancel_subscription(plan_id: Field) {
        let subscriber = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(SubscriptionNote::properties().plan_id, plan_id)
            .set_limit(1);
        let notes = storage.subscriptions.at(subscriber).get_notes(options);
        assert(notes.len() == 1, "Subscription not found");

        storage.subscriptions.at(subscriber).remove(notes[0]);

        // Decrement aggregate (public)
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_decrement_subscribers(Field)"),
            [plan_id],
        );
    }

    /// Prove you have an active subscription without revealing identity.
    #[external("private")]
    fn prove_active_subscription(plan_id: Field) -> bool {
        let subscriber = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(SubscriptionNote::properties().plan_id, plan_id)
            .set_limit(1);
        let notes = storage.subscriptions.at(subscriber).get_notes(options);

        if notes.len() == 0 { return false; }

        let note = notes[0];
        // Active = next payment block hasn't passed (with grace period)
        let grace_period = note.frequency_blocks / 10;  // 10% grace
        context.block_number() < note.next_payment_block + grace_period
    }

    /// Upgrade/downgrade to a different plan.
    #[external("private")]
    fn change_plan(old_plan_id: Field, new_plan_id: Field) {
        let subscriber = context.msg_sender();

        // Cancel old
        let options = NoteGetterOptions::new()
            .select(SubscriptionNote::properties().plan_id, old_plan_id)
            .set_limit(1);
        let old_notes = storage.subscriptions.at(subscriber).get_notes(options);
        assert(old_notes.len() == 1, "Old subscription not found");
        storage.subscriptions.at(subscriber).remove(old_notes[0]);

        // Subscribe to new (internal call)
        self.subscribe(new_plan_id, old_notes[0].payment_token);
    }

    // ── UTILITY (UNCONSTRAINED) ──────────────────────

    #[external("utility")]
    unconstrained fn list_subscriptions(owner: AztecAddress) -> [SubscriptionNote] {
        storage.subscriptions.at(owner).get_notes(NoteGetterOptions::new())
    }

    #[external("utility")]
    unconstrained fn get_next_payment_date(
        owner: AztecAddress,
        plan_id: Field
    ) -> u64 {
        let options = NoteGetterOptions::new()
            .select(SubscriptionNote::properties().plan_id, plan_id)
            .set_limit(1);
        let notes = storage.subscriptions.at(owner).get_notes(options);
        if notes.len() == 0 { 0 } else { notes[0].next_payment_block }
    }
}
```

### 5.2 PayrollManager

```noir
#[aztec]
contract PayrollManager {
    #[storage]
    struct Storage {
        // Private: payroll notes (owned by employees)
        payroll_records: Map<AztecAddress, PrivateSet<PayrollNote>>,
        // Private: receipts
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        // Public: employer configs
        employers: Map<AztecAddress, PublicMutable<PayrollConfig>>,
        // Public: tax withholding treasury
        tax_treasury: Map<AztecAddress, PublicMutable<u128>>,
    }

    // ── EMPLOYER FUNCTIONS ───────────────────────────

    /// Register as an employer with payroll configuration.
    #[external("public")]
    fn register_employer(payment_token: AztecAddress, pay_period_blocks: u64) {
        storage.employers.at(context.msg_sender()).write(PayrollConfig {
            employer: context.msg_sender(),
            payment_token,
            pay_period_blocks,
            is_active: true,
            total_employees: 0,
            total_paid_out: 0,
        });
    }

    /// Add an employee to the payroll.
    /// Creates a PayrollNote owned by the employee.
    #[external("private")]
    fn add_employee(
        employee: AztecAddress,
        payment_token: AztecAddress,
        salary_amount: u128,
        role_hash: Field,
        tax_withholding_bps: u64,
        vesting_schedule_hash: Field,
    ) {
        let employer = context.msg_sender();

        let payroll_note = PayrollNote {
            employer,
            employee,
            payment_token,
            salary_amount,
            pay_period_blocks: get_employer_pay_period(employer),
            next_pay_block: context.block_number() + get_employer_pay_period(employer),
            role_hash,
            start_block: context.block_number(),
            vesting_schedule_hash,
            tax_withholding_bps,
            status: 0,  // active
            owner: employee,
            owner_npk_m_hash: get_npk_m_hash(employee),
        };

        storage.payroll_records.at(employee).insert(&mut payroll_note);

        // Deliver note to employee (encrypted)
        payroll_note.emit_encrypted_log(&mut context, employee);

        // Update aggregate count
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_employees(AztecAddress)"),
            [employer.to_field()],
        );
    }

    /// Process salary payment for an employee.
    /// Can be called by employer or by an automated keeper.
    #[external("private")]
    fn pay_salary(employee: AztecAddress) {
        let employer = context.msg_sender();

        // Get employee's payroll note
        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().employer, employer.to_field())
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        assert(notes.len() == 1, "Employee not found");
        let old_note = notes[0];

        assert(old_note.status == 0, "Employee not active");
        assert(
            context.block_number() >= old_note.next_pay_block,
            "Pay period not reached"
        );

        // Calculate net pay after tax withholding
        let tax_amount = (old_note.salary_amount * old_note.tax_withholding_bps as u128) / 10000;
        let net_pay = old_note.salary_amount - tax_amount;

        // Remove old note
        storage.payroll_records.at(employee).remove(old_note);

        // Transfer net salary to employee (private)
        Token::at(old_note.payment_token).transfer(
            employer,
            employee,
            net_pay,
        );

        // Transfer tax withholding to tax treasury (enqueue public)
        if tax_amount > 0 {
            Token::at(old_note.payment_token).transfer(
                employer,
                context.this_address(),  // protocol holds tax temporarily
                tax_amount,
            );
            context.enqueue_public_call(
                context.this_address(),
                FunctionSelector::from_signature("_record_tax_withholding(AztecAddress,u128)"),
                [employer.to_field(), tax_amount as Field],
            );
        }

        // Create updated payroll note
        let new_note = PayrollNote {
            employer: old_note.employer,
            employee: old_note.employee,
            payment_token: old_note.payment_token,
            salary_amount: old_note.salary_amount,
            pay_period_blocks: old_note.pay_period_blocks,
            next_pay_block: old_note.next_pay_block + old_note.pay_period_blocks,
            role_hash: old_note.role_hash,
            start_block: old_note.start_block,
            vesting_schedule_hash: old_note.vesting_schedule_hash,
            tax_withholding_bps: old_note.tax_withholding_bps,
            status: 0,
            owner: employee,
            owner_npk_m_hash: old_note.owner_npk_m_hash,
        };

        storage.payroll_records.at(employee).insert(&mut new_note);

        // Create receipt for employee
        create_receipt(employer, employee, old_note.payment_token, net_pay, 1, Field::zero());

        // Update aggregate stats
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_payment(AztecAddress,u128)"),
            [employer.to_field(), old_note.salary_amount as Field],
        );
    }

    /// Pay a one-time bonus privately.
    #[external("private")]
    fn pay_bonus(
        employee: AztecAddress,
        payment_token: AztecAddress,
        amount: u128,
        reason_hash: Field,
    ) {
        let employer = context.msg_sender();

        // Verify employment relationship exists
        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().employer, employer.to_field())
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        assert(notes.len() == 1, "Employee not found");

        // Transfer bonus
        Token::at(payment_token).transfer(employer, employee, amount);

        // Create receipt
        create_receipt(employer, employee, payment_token, amount, 1, reason_hash);
    }

    /// Adjust employee salary.
    #[external("private")]
    fn adjust_salary(employee: AztecAddress, new_salary: u128) {
        let employer = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().employer, employer.to_field())
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        assert(notes.len() == 1, "Employee not found");
        let old_note = notes[0];

        // Nullify old, create new with updated salary
        storage.payroll_records.at(employee).remove(old_note);

        let new_note = PayrollNote {
            salary_amount: new_salary,
            ..old_note  // keep everything else
        };

        storage.payroll_records.at(employee).insert(&mut new_note);
        new_note.emit_encrypted_log(&mut context, employee);
    }

    /// Terminate employment.
    #[external("private")]
    fn terminate_employee(employee: AztecAddress) {
        let employer = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().employer, employer.to_field())
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        assert(notes.len() == 1, "Employee not found");
        let old_note = notes[0];

        storage.payroll_records.at(employee).remove(old_note);

        // Create terminated note (employee keeps proof of employment)
        let terminated_note = PayrollNote {
            status: 2,  // terminated
            ..old_note
        };
        storage.payroll_records.at(employee).insert(&mut terminated_note);

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_decrement_employees(AztecAddress)"),
            [employer.to_field()],
        );
    }

    // ── EMPLOYEE FUNCTIONS ───────────────────────────

    /// Prove employment status without revealing salary or employer.
    #[external("private")]
    fn prove_employment() -> bool {
        let employee = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().status, 0 as Field)  // active
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        notes.len() > 0
    }

    /// Prove salary is above a threshold (for loan applications, etc.)
    /// without revealing exact salary or employer.
    #[external("private")]
    fn prove_salary_above(min_salary: u128) -> bool {
        let employee = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().status, 0 as Field)
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        if notes.len() == 0 { return false; }
        notes[0].salary_amount >= min_salary
    }

    /// Prove tenure (employment duration) without revealing employer.
    #[external("private")]
    fn prove_tenure_above(min_blocks: u64) -> bool {
        let employee = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(PayrollNote::properties().status, 0 as Field)
            .set_limit(1);
        let notes = storage.payroll_records.at(employee).get_notes(options);
        if notes.len() == 0 { return false; }
        (context.block_number() - notes[0].start_block) >= min_blocks
    }
}
```

### 5.3 FundraisingManager

```noir
#[aztec]
contract FundraisingManager {
    #[storage]
    struct Storage {
        // Private: investment notes (owned by investors)
        investments: Map<AztecAddress, PrivateSet<InvestmentNote>>,
        // Private: receipts
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        // Public: round definitions
        rounds: Map<Field, PublicMutable<FundraisingRound>>,
        // Public: round counter
        round_counter: PublicMutable<u64>,
    }

    // ── PROJECT FUNCTIONS ────────────────────────────

    /// Create a new fundraising round.
    #[external("public")]
    fn create_round(
        payment_token: AztecAddress,
        target_amount: u128,
        min_investment: u128,
        max_investment: u128,
        token_price: u128,
        duration_blocks: u64,
    ) -> Field {
        let project = context.msg_sender();
        let round_id = poseidon2_hash([
            project.to_field(),
            storage.round_counter.read() as Field,
        ]);

        storage.rounds.at(round_id).write(FundraisingRound {
            round_id,
            project,
            payment_token,
            target_amount,
            raised_amount: 0,
            min_investment,
            max_investment,
            token_price,
            start_block: context.block_number(),
            end_block: context.block_number() + duration_blocks,
            investor_count: 0,
            is_active: true,
            is_finalized: false,
        });

        let counter = storage.round_counter.read();
        storage.round_counter.write(counter + 1);

        round_id
    }

    /// Finalize a round (no more investments accepted).
    #[external("public")]
    fn finalize_round(round_id: Field) {
        let mut round = storage.rounds.at(round_id).read();
        assert(round.project == context.msg_sender(), "Not project owner");
        round.is_active = false;
        round.is_finalized = true;
        storage.rounds.at(round_id).write(round);
    }

    // ── INVESTOR FUNCTIONS (PRIVATE) ─────────────────

    /// Invest in a fundraising round.
    /// The investment amount, investor identity, and terms are all private.
    /// Only the aggregate raised_amount is updated publicly.
    #[external("private")]
    fn invest(
        round_id: Field,
        amount: u128,
        vesting_cliff_blocks: u64,
        vesting_duration_blocks: u64,
    ) {
        let investor = context.msg_sender();
        let round = get_round_config(round_id);  // utility lookup

        // Validate investment bounds
        assert(amount >= round.min_investment, "Below minimum investment");
        assert(amount <= round.max_investment, "Above maximum investment");

        // Calculate token allocation
        let token_allocation = (amount * 10u128.pow(18)) / round.token_price;

        // Transfer investment amount privately
        Token::at(round.payment_token).transfer(
            investor,
            round.project,
            amount,
        );

        // Create investment note
        let inv_note = InvestmentNote {
            round_id,
            investor,
            project: round.project,
            payment_token: round.payment_token,
            amount_invested: amount,
            token_allocation,
            valuation_at_invest: round.token_price * round.target_amount / 10u128.pow(18),
            vesting_cliff_blocks,
            vesting_duration_blocks,
            vested_amount: 0,
            invested_at_block: context.block_number(),
            owner: investor,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.investments.at(investor).insert(&mut inv_note);

        // Create receipt
        create_receipt(investor, round.project, round.payment_token, amount, 5, round_id);

        // Update aggregate raised amount (public)
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_investment(Field,u128)"),
            [round_id, amount as Field],
        );
    }

    /// Claim vested tokens.
    #[external("private")]
    fn claim_vested(round_id: Field) {
        let investor = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(InvestmentNote::properties().round_id, round_id)
            .set_limit(1);
        let notes = storage.investments.at(investor).get_notes(options);
        assert(notes.len() == 1, "Investment not found");
        let old_note = notes[0];

        // Calculate vested amount
        let blocks_since_invest = context.block_number() - old_note.invested_at_block;

        // Check cliff
        assert(
            blocks_since_invest >= old_note.vesting_cliff_blocks,
            "Cliff not reached"
        );

        // Linear vesting after cliff
        let vesting_elapsed = blocks_since_invest - old_note.vesting_cliff_blocks;
        let vesting_fraction = if vesting_elapsed >= old_note.vesting_duration_blocks {
            10000u64  // 100% vested
        } else {
            (vesting_elapsed * 10000) / old_note.vesting_duration_blocks
        };

        let total_vested = (old_note.token_allocation * vesting_fraction as u128) / 10000;
        let claimable = total_vested - old_note.vested_amount;
        assert(claimable > 0, "Nothing to claim");

        // Nullify old note, create updated one
        storage.investments.at(investor).remove(old_note);

        let new_note = InvestmentNote {
            vested_amount: total_vested,
            ..old_note
        };
        storage.investments.at(investor).insert(&mut new_note);

        // Transfer vested tokens to investor
        // (assumes project has deposited tokens into a vesting contract)
        Token::at(old_note.payment_token).transfer(
            context.this_address(),
            investor,
            claimable,
        );
    }

    /// Prove you invested in a specific round without revealing amount.
    #[external("private")]
    fn prove_investment(round_id: Field) -> bool {
        let investor = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(InvestmentNote::properties().round_id, round_id)
            .set_limit(1);
        let notes = storage.investments.at(investor).get_notes(options);
        notes.len() > 0
    }

    /// Prove investment amount is above a threshold.
    #[external("private")]
    fn prove_investment_above(round_id: Field, min_amount: u128) -> bool {
        let investor = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(InvestmentNote::properties().round_id, round_id)
            .set_limit(1);
        let notes = storage.investments.at(investor).get_notes(options);
        if notes.len() == 0 { return false; }
        notes[0].amount_invested >= min_amount
    }

    // ── PUBLIC AGGREGATE FUNCTIONS ───────────────────

    #[external("public")]
    fn _record_investment(round_id: Field, amount: u128) {
        let mut round = storage.rounds.at(round_id).read();
        round.raised_amount += amount;
        round.investor_count += 1;
        storage.rounds.at(round_id).write(round);
    }

    #[external("public")]
    fn get_round_progress(round_id: Field) -> (u128, u128, u64) {
        let round = storage.rounds.at(round_id).read();
        (round.raised_amount, round.target_amount, round.investor_count)
    }
}
```

### 5.4 GrantsManager

```noir
#[aztec]
contract GrantsManager {
    #[storage]
    struct Storage {
        // Private: grant award notes (owned by recipients)
        grants: Map<AztecAddress, PrivateSet<GrantNote>>,
        // Private: grant applications (before award)
        applications: Map<Field, PrivateSet<ApplicationNote>>,
        // Private: receipts
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        // Public: grant program configs
        programs: Map<Field, PublicMutable<GrantProgram>>,
        program_counter: PublicMutable<u64>,
    }

    // ── GRANTOR FUNCTIONS ────────────────────────────

    /// Create a new grant program.
    #[external("public")]
    fn create_program(
        payment_token: AztecAddress,
        total_budget: u128,
        application_deadline: u64,
    ) -> Field {
        let grantor = context.msg_sender();
        let program_id = poseidon2_hash([
            grantor.to_field(),
            storage.program_counter.read() as Field,
        ]);

        storage.programs.at(program_id).write(GrantProgram {
            program_id,
            grantor,
            payment_token,
            total_budget,
            disbursed: 0,
            grants_awarded: 0,
            application_deadline,
            is_active: true,
        });

        let counter = storage.program_counter.read();
        storage.program_counter.write(counter + 1);

        program_id
    }

    /// Award a grant to an applicant.
    /// The recipient, amount, and terms are all private.
    #[external("private")]
    fn award_grant(
        program_id: Field,
        recipient: AztecAddress,
        total_amount: u128,
        milestones_total: u8,
        per_milestone_amount: u128,
        milestone_schedule_hash: Field,
        application_hash: Field,
    ) {
        let grantor = context.msg_sender();

        let grant_note = GrantNote {
            program_id,
            grantor,
            recipient,
            payment_token: get_program_token(program_id),
            total_amount,
            disbursed_amount: 0,
            milestones_total,
            milestones_completed: 0,
            per_milestone_amount,
            milestone_schedule_hash,
            application_hash,
            awarded_at_block: context.block_number(),
            status: 0,  // active
            owner: recipient,
            owner_npk_m_hash: get_npk_m_hash(recipient),
        };

        storage.grants.at(recipient).insert(&mut grant_note);
        grant_note.emit_encrypted_log(&mut context, recipient);

        // Update aggregate
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_grant_award(Field,u128)"),
            [program_id, total_amount as Field],
        );
    }

    /// Approve a milestone and disburse payment.
    #[external("private")]
    fn approve_milestone(
        program_id: Field,
        recipient: AztecAddress,
        milestone_proof_hash: Field,
    ) {
        let grantor = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(GrantNote::properties().program_id, program_id)
            .set_limit(1);
        let notes = storage.grants.at(recipient).get_notes(options);
        assert(notes.len() == 1, "Grant not found");
        let old_note = notes[0];

        assert(old_note.grantor == grantor, "Not the grantor");
        assert(old_note.status == 0, "Grant not active");
        assert(
            old_note.milestones_completed < old_note.milestones_total,
            "All milestones already completed"
        );

        // Nullify old note
        storage.grants.at(recipient).remove(old_note);

        // Disburse milestone payment
        let payment_amount = old_note.per_milestone_amount;
        Token::at(old_note.payment_token).transfer(
            grantor,
            recipient,
            payment_amount,
        );

        // Create updated grant note
        let new_milestones = old_note.milestones_completed + 1;
        let new_status = if new_milestones == old_note.milestones_total { 2 } else { 0 };

        let new_note = GrantNote {
            disbursed_amount: old_note.disbursed_amount + payment_amount,
            milestones_completed: new_milestones,
            status: new_status,
            ..old_note
        };
        storage.grants.at(recipient).insert(&mut new_note);

        // Receipt
        create_receipt(
            grantor, recipient, old_note.payment_token,
            payment_amount, 3, program_id
        );

        // Update aggregate disbursement
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_disbursement(Field,u128)"),
            [program_id, payment_amount as Field],
        );
    }

    // ── RECIPIENT FUNCTIONS ──────────────────────────

    /// Submit a grant application (private).
    #[external("private")]
    fn apply_for_grant(
        program_id: Field,
        application_hash: Field,
        requested_amount: u128,
    ) {
        let applicant = context.msg_sender();

        let app_note = ApplicationNote {
            program_id,
            applicant,
            application_hash,
            requested_amount,
            submitted_at_block: context.block_number(),
            status: 0,  // pending
            owner: applicant,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.applications.at(program_id).insert(&mut app_note);

        // Deliver to grantor for review
        let program = get_program_config(program_id);
        app_note.emit_encrypted_log(&mut context, program.grantor);
    }

    /// Prove you received a grant without revealing amount or grantor.
    #[external("private")]
    fn prove_grant_recipient(program_id: Field) -> bool {
        let recipient = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(GrantNote::properties().program_id, program_id)
            .set_limit(1);
        let notes = storage.grants.at(recipient).get_notes(options);
        notes.len() > 0
    }

    /// Prove total grants received is above a threshold.
    #[external("private")]
    fn prove_grants_above(min_total: u128) -> bool {
        let recipient = context.msg_sender();
        let all_grants = storage.grants.at(recipient).get_notes(NoteGetterOptions::new());
        let total: u128 = all_grants.iter().map(|g| g.total_amount).sum();
        total >= min_total
    }

    // ── PUBLIC AGGREGATES ────────────────────────────

    #[external("public")]
    fn _record_grant_award(program_id: Field, amount: u128) {
        let mut program = storage.programs.at(program_id).read();
        program.grants_awarded += 1;
        storage.programs.at(program_id).write(program);
    }

    #[external("public")]
    fn _record_disbursement(program_id: Field, amount: u128) {
        let mut program = storage.programs.at(program_id).read();
        program.disbursed += amount;
        storage.programs.at(program_id).write(program);
    }

    #[external("public")]
    fn get_program_stats(program_id: Field) -> (u128, u128, u64) {
        let program = storage.programs.at(program_id).read();
        (program.total_budget, program.disbursed, program.grants_awarded)
    }
}
```

### 5.5 InvoiceManager

```noir
#[aztec]
contract InvoiceManager {
    #[storage]
    struct Storage {
        // Private: invoices (owned by both issuer and payer)
        invoices_issued: Map<AztecAddress, PrivateSet<InvoiceNote>>,
        invoices_received: Map<AztecAddress, PrivateSet<InvoiceNote>>,
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        // Public: aggregate stats
        total_invoices: PublicMutable<u64>,
        total_paid_volume: PublicMutable<u128>,
    }

    /// Create and send a private invoice.
    #[external("private")]
    fn create_invoice(
        payer: AztecAddress,
        payment_token: AztecAddress,
        amount: u128,
        due_block: u64,
        description_hash: Field,
    ) -> Field {
        let issuer = context.msg_sender();
        let invoice_id = poseidon2_hash([
            issuer.to_field(),
            payer.to_field(),
            amount as Field,
            context.block_number() as Field,
            rand(),
        ]);

        let invoice = InvoiceNote {
            invoice_id,
            issuer,
            payer,
            payment_token,
            amount,
            due_block,
            description_hash,
            status: 0,  // pending
            paid_at_block: 0,
            issued_at_block: context.block_number(),
            owner: issuer,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        // Store for issuer
        storage.invoices_issued.at(issuer).insert(&mut invoice);

        // Create a copy for payer (different owner)
        let payer_invoice = InvoiceNote {
            owner: payer,
            owner_npk_m_hash: get_npk_m_hash(payer),
            ..invoice
        };
        storage.invoices_received.at(payer).insert(&mut payer_invoice);

        // Deliver to payer
        payer_invoice.emit_encrypted_log(&mut context, payer);

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_increment_invoice_count()"),
            [],
        );

        invoice_id
    }

    /// Pay an invoice.
    #[external("private")]
    fn pay_invoice(invoice_id: Field) {
        let payer = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(InvoiceNote::properties().invoice_id, invoice_id)
            .set_limit(1);
        let notes = storage.invoices_received.at(payer).get_notes(options);
        assert(notes.len() == 1, "Invoice not found");
        let invoice = notes[0];

        assert(invoice.status == 0, "Invoice not pending");

        // Transfer payment
        Token::at(invoice.payment_token).transfer(
            payer,
            invoice.issuer,
            invoice.amount,
        );

        // Update payer's copy
        storage.invoices_received.at(payer).remove(invoice);
        let paid_invoice = InvoiceNote {
            status: 1,  // paid
            paid_at_block: context.block_number(),
            ..invoice
        };
        storage.invoices_received.at(payer).insert(&mut paid_invoice);

        // Create receipts for both parties
        create_receipt(payer, invoice.issuer, invoice.payment_token, invoice.amount, 2, invoice_id);

        // Notify issuer (update their copy)
        // Issuer's PXE will pick up the payment event
        paid_invoice.emit_encrypted_log(&mut context, invoice.issuer);

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_payment_volume(u128)"),
            [invoice.amount as Field],
        );
    }

    /// Dispute an invoice.
    #[external("private")]
    fn dispute_invoice(invoice_id: Field, reason_hash: Field) {
        let payer = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(InvoiceNote::properties().invoice_id, invoice_id)
            .set_limit(1);
        let notes = storage.invoices_received.at(payer).get_notes(options);
        assert(notes.len() == 1, "Invoice not found");
        let invoice = notes[0];

        storage.invoices_received.at(payer).remove(invoice);
        let disputed = InvoiceNote {
            status: 3,  // disputed
            ..invoice
        };
        storage.invoices_received.at(payer).insert(&mut disputed);

        // Notify issuer
        disputed.emit_encrypted_log(&mut context, invoice.issuer);
    }

    /// Prove you paid an invoice (for expense reports, tax, etc.)
    #[external("private")]
    fn prove_invoice_paid(invoice_id: Field) -> bool {
        let payer = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(InvoiceNote::properties().invoice_id, invoice_id)
            .set_limit(1);
        let notes = storage.invoices_received.at(payer).get_notes(options);
        if notes.len() == 0 { return false; }
        notes[0].status == 1
    }
}
```

### 5.6 BountyBoard

```noir
#[aztec]
contract BountyBoard {
    #[storage]
    struct Storage {
        bounties: Map<AztecAddress, PrivateSet<BountyNote>>,
        escrows: Map<Field, PrivateMutable<EscrowNote>>,
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        boards: Map<Field, PublicMutable<BountyBoard>>,
        board_counter: PublicMutable<u64>,
        // Public listings — browsable by contributors
        // reward_amount is 0 when creator chose private amount
        public_listings: Map<Field, PublicMutable<BountyListing>>,
    }

    // Public listing struct — what contributors see when browsing
    struct BountyListing {
        bounty_id: Field,
        board_id: Field,
        payment_token: AztecAddress,
        reward_amount: u128,       // 0 means "private amount" — UI shows "Reward: Hidden"
        deadline_block: u64,
        description_hash: Field,
        is_amount_public: bool,
        status: u8,                // mirrors bounty status
    }

    /// Post a bounty with funds locked in escrow.
    /// Creator chooses whether the reward amount is publicly visible.
    /// Default: public (is_amount_public = true) — contributors need to
    /// see what they're working for to avoid wasting effort.
    /// Private amounts are for sensitive tasks where the project doesn't
    /// want competitors to see what they pay for specific work.
    #[external("private")]
    fn create_bounty(
        board_id: Field,
        payment_token: AztecAddress,
        reward_amount: u128,
        description_hash: Field,
        deadline_block: u64,
        is_amount_public: bool,
    ) -> Field {
        let creator = context.msg_sender();
        let bounty_id = poseidon2_hash([
            creator.to_field(),
            description_hash,
            context.block_number() as Field,
            rand(),
        ]);

        // Lock funds in escrow
        Token::at(payment_token).transfer(
            creator,
            context.this_address(),  // protocol holds escrow
            reward_amount,
        );

        // Create escrow note
        let escrow = EscrowNote {
            escrow_id: bounty_id,
            depositor: creator,
            beneficiary: AztecAddress::zero(),  // TBD — whoever claims
            arbiter: creator,                     // creator approves submissions
            payment_token,
            amount: reward_amount,
            release_conditions_hash: description_hash,
            expiry_block: deadline_block,
            status: 0,  // locked
            created_at_block: context.block_number(),
            owner: creator,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };
        storage.escrows.at(bounty_id).initialize(&mut escrow);

        // Create bounty note (private — tracks full details)
        let bounty_note = BountyNote {
            bounty_id,
            creator,
            payment_token,
            reward_amount,
            description_hash,
            deadline_block,
            claimer: AztecAddress::zero(),
            submission_hash: Field::zero(),
            status: 0,  // open
            is_amount_public,
            created_at_block: context.block_number(),
            owner: creator,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };
        storage.bounties.at(creator).insert(&mut bounty_note);

        // Create public listing with reward amount visible (if creator chose public)
        // This lets contributors browse bounties and see what they pay
        if is_amount_public {
            context.enqueue_public_call(
                context.this_address(),
                FunctionSelector::from_signature(
                    "_create_public_listing(Field,Field,AztecAddress,u128,u64,Field)"
                ),
                [bounty_id, board_id, payment_token.to_field(),
                 reward_amount as Field, deadline_block as Field,
                 description_hash],
            );
        } else {
            // Private amount — still create a listing but with amount = 0
            // UI shows "Reward: Private" so contributors know it's hidden
            context.enqueue_public_call(
                context.this_address(),
                FunctionSelector::from_signature(
                    "_create_public_listing(Field,Field,AztecAddress,u128,u64,Field)"
                ),
                [bounty_id, board_id, payment_token.to_field(),
                 0 as Field, deadline_block as Field,
                 description_hash],
            );
        }

        // Update aggregate stats
        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_bounty(Field,u128)"),
            [board_id, reward_amount as Field],
        );

        bounty_id
    }

    /// Submit work for a bounty.
    #[external("private")]
    fn submit_work(bounty_id: Field, submission_hash: Field) {
        let claimer = context.msg_sender();

        // Notify bounty creator via encrypted log
        let escrow = storage.escrows.at(bounty_id).get_note();

        let submission_note = BountyNote {
            bounty_id,
            creator: escrow.depositor,
            payment_token: escrow.payment_token,
            reward_amount: escrow.amount,
            description_hash: escrow.release_conditions_hash,
            deadline_block: escrow.expiry_block,
            claimer,
            submission_hash,
            status: 2,  // submitted
            created_at_block: context.block_number(),
            owner: claimer,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.bounties.at(claimer).insert(&mut submission_note);
        submission_note.emit_encrypted_log(&mut context, escrow.depositor);
    }

    /// Approve a submission and release escrow payment.
    #[external("private")]
    fn approve_and_pay(bounty_id: Field, claimer: AztecAddress) {
        let creator = context.msg_sender();

        let escrow = storage.escrows.at(bounty_id).get_note();
        assert(escrow.depositor == creator, "Not bounty creator");
        assert(escrow.status == 0, "Escrow not locked");

        // Release escrow to claimer
        storage.escrows.at(bounty_id).replace(&mut EscrowNote {
            beneficiary: claimer,
            status: 1,  // released
            ..escrow
        });

        Token::at(escrow.payment_token).transfer(
            context.this_address(),
            claimer,
            escrow.amount,
        );

        create_receipt(
            creator, claimer, escrow.payment_token,
            escrow.amount, 4, bounty_id
        );

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_bounty_payment(Field,u128)"),
            [Field::zero(), escrow.amount as Field],  // board_id lookup needed
        );
    }

    // ── PUBLIC FUNCTIONS ─────────────────────────────

    /// Create a public bounty listing that contributors can browse.
    /// Called internally by create_bounty via enqueued public call.
    #[external("public")]
    fn _create_public_listing(
        bounty_id: Field,
        board_id: Field,
        payment_token: AztecAddress,
        reward_amount: u128,       // 0 if creator chose private amount
        deadline_block: u64,
        description_hash: Field,
    ) {
        storage.public_listings.at(bounty_id).write(BountyListing {
            bounty_id,
            board_id,
            payment_token,
            reward_amount,
            deadline_block,
            description_hash,
            is_amount_public: reward_amount > 0,
            status: 0,  // open
        });
    }

    /// Read a public bounty listing.
    /// Contributors call this to see bounty details including reward amount
    /// (if the creator made it public).
    #[external("public")]
    fn get_listing(bounty_id: Field) -> BountyListing {
        storage.public_listings.at(bounty_id).read()
    }

    /// Update listing status (e.g., when bounty is claimed or completed).
    #[external("public")]
    fn _update_listing_status(bounty_id: Field, new_status: u8) {
        let mut listing = storage.public_listings.at(bounty_id).read();
        listing.status = new_status;
        storage.public_listings.at(bounty_id).write(listing);
    }
}
```

### 5.7 TippingManager

```noir
#[aztec]
contract TippingManager {
    #[storage]
    struct Storage {
        tips_received: Map<AztecAddress, PrivateSet<TipNote>>,
        tips_sent: Map<AztecAddress, PrivateSet<TipNote>>,
        receipts: Map<AztecAddress, PrivateSet<ReceiptNote>>,
        total_tips: PublicMutable<u128>,
        total_tip_count: PublicMutable<u64>,
    }

    /// Send a private tip or donation.
    #[external("private")]
    fn tip(
        recipient: AztecAddress,
        payment_token: AztecAddress,
        amount: u128,
        message_hash: Field,
        category: u8,  // 0=tip, 1=donation, 2=patronage
    ) {
        let sender = context.msg_sender();

        Token::at(payment_token).transfer(sender, recipient, amount);

        let tip_note = TipNote {
            sender,
            recipient,
            payment_token,
            amount,
            message_hash,
            is_recurring: false,
            frequency_blocks: 0,
            next_tip_block: 0,
            category,
            sent_at_block: context.block_number(),
            owner: recipient,
            owner_npk_m_hash: get_npk_m_hash(recipient),
        };

        storage.tips_received.at(recipient).insert(&mut tip_note);
        tip_note.emit_encrypted_log(&mut context, recipient);

        // Sender keeps a copy
        let sender_copy = TipNote {
            owner: sender,
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
            ..tip_note
        };
        storage.tips_sent.at(sender).insert(&mut sender_copy);

        context.enqueue_public_call(
            context.this_address(),
            FunctionSelector::from_signature("_record_tip(u128)"),
            [amount as Field],
        );
    }

    /// Set up recurring tip/patronage.
    #[external("private")]
    fn setup_recurring_tip(
        recipient: AztecAddress,
        payment_token: AztecAddress,
        amount: u128,
        frequency_blocks: u64,
        message_hash: Field,
    ) {
        let sender = context.msg_sender();

        // First payment
        Token::at(payment_token).transfer(sender, recipient, amount);

        let tip_note = TipNote {
            sender,
            recipient,
            payment_token,
            amount,
            message_hash,
            is_recurring: true,
            frequency_blocks,
            next_tip_block: context.block_number() + frequency_blocks,
            category: 2,  // patronage
            sent_at_block: context.block_number(),
            owner: sender,  // sender owns recurring notes (they trigger payments)
            owner_npk_m_hash: context.msg_sender_npk_m_hash(),
        };

        storage.tips_sent.at(sender).insert(&mut tip_note);
    }

    /// Process next recurring tip payment.
    #[external("private")]
    fn pay_recurring_tip(recipient: AztecAddress) {
        let sender = context.msg_sender();

        let options = NoteGetterOptions::new()
            .select(TipNote::properties().recipient, recipient.to_field())
            .select(TipNote::properties().is_recurring, true as Field)
            .set_limit(1);
        let notes = storage.tips_sent.at(sender).get_notes(options);
        assert(notes.len() == 1, "Recurring tip not found");
        let old_note = notes[0];

        assert(
            context.block_number() >= old_note.next_tip_block,
            "Not yet due"
        );

        Token::at(old_note.payment_token).transfer(sender, recipient, old_note.amount);

        storage.tips_sent.at(sender).remove(old_note);
        let new_note = TipNote {
            next_tip_block: old_note.next_tip_block + old_note.frequency_blocks,
            sent_at_block: context.block_number(),
            ..old_note
        };
        storage.tips_sent.at(sender).insert(&mut new_note);
    }

    /// Prove you've received at least X in tips (for credibility/social proof).
    #[external("private")]
    fn prove_tips_received_above(min_total: u128) -> bool {
        let recipient = context.msg_sender();
        let all_tips = storage.tips_received.at(recipient)
            .get_notes(NoteGetterOptions::new());
        let total: u128 = all_tips.iter().map(|t| t.amount).sum();
        total >= min_total
    }
}
```

### 5.8 PrivateGate & MembershipRegistry & LoyaltyEngine

These follow the same patterns established in the overview spec. Key additions:

```noir
#[aztec]
contract PrivateGate {
    #[storage]
    struct Storage {
        gates: Map<Field, PublicMutable<GateConfig>>,
        gate_counter: PublicMutable<u64>,
    }

    /// Prove access to a gate.
    /// Supports multiple gate types: token balance, NFT ownership,
    /// active subscription, membership, loyalty tier.
    #[external("private")]
    fn prove_access(gate_id: Field) -> bool {
        let user = context.msg_sender();
        let gate = get_gate_config(gate_id);

        match gate.gate_type {
            0 => {
                // Token balance gate
                let balance = Token::at(gate.required_token)
                    .balance_of_private(user);
                balance >= gate.min_balance
            },
            1 => {
                // NFT ownership gate
                NFT::at(gate.required_token).is_owner(user)
            },
            2 => {
                // Subscription gate
                SubscriptionManager::at(SUBSCRIPTION_ADDR)
                    .prove_active_subscription(gate.required_plan_id)
            },
            3 => {
                // Membership gate
                MembershipRegistry::at(MEMBERSHIP_ADDR)
                    .prove_membership_tier(gate.required_org_id, gate.min_tier)
            },
            4 => {
                // Loyalty tier gate
                LoyaltyEngine::at(LOYALTY_ADDR)
                    .prove_status(gate.required_program_id, gate.min_tier)
            },
            _ => false
        }
    }

    /// Prove access to multiple gates at once (compound access control).
    #[external("private")]
    fn prove_multi_access(gate_ids: [Field; 4], count: u8) -> bool {
        for i in 0..count {
            if !self.prove_access(gate_ids[i]) {
                return false;
            }
        }
        true
    }
}
```

---

## 6. Compliance Layer

### 6.1 Selective Disclosure Architecture

Every commerce module supports optional compliance through Aztec's viewing key mechanism.

```noir
#[aztec]
contract ComplianceLayer {
    #[storage]
    struct Storage {
        // Maps user -> auditor -> scope of disclosure
        disclosure_grants: Map<AztecAddress, PrivateSet<DisclosureNote>>,
    }

    /// Grant an auditor view access to specific commerce data.
    #[external("private")]
    fn grant_disclosure(
        auditor: AztecAddress,
        scope: u8,              // 0=payroll, 1=subscriptions, 2=investments, etc.
        time_range_start: u64,  // view data from this block
        time_range_end: u64,    // view data until this block
    ) {
        let user = context.msg_sender();

        let disclosure = DisclosureNote {
            user,
            auditor,
            scope,
            time_range_start,
            time_range_end,
            granted_at_block: context.block_number(),
            owner: auditor,
            owner_npk_m_hash: get_npk_m_hash(auditor),
        };

        storage.disclosure_grants.at(user).insert(&mut disclosure);
        disclosure.emit_encrypted_log(&mut context, auditor);
    }

    /// Revoke disclosure access.
    #[external("private")]
    fn revoke_disclosure(auditor: AztecAddress, scope: u8) {
        let user = context.msg_sender();
        let options = NoteGetterOptions::new()
            .select(DisclosureNote::properties().auditor, auditor.to_field())
            .select(DisclosureNote::properties().scope, scope as Field)
            .set_limit(1);
        let notes = storage.disclosure_grants.at(user).get_notes(options);
        if notes.len() > 0 {
            storage.disclosure_grants.at(user).remove(notes[0]);
        }
    }
}
```

### 6.2 Compliance Use Cases

| Scenario | What Auditor Sees | What Stays Private |
|----------|------------------|--------------------|
| Tax audit of employee | Salary amount, pay dates, tax withholding | Employer name, other employees' data |
| Tax audit of employer | Total payroll expense, headcount, tax compliance | Individual salaries, employee identities |
| Investor reporting | Investment amounts, vesting schedules | Other investors, round details |
| Grant compliance | Milestone completion, disbursement amounts | Other grants, application details |
| Subscription audit | Active subscriptions, payment amounts | Subscriber identity, other subscriptions |

---

## 7. TypeScript SDK

### 7.1 Package Structure

```
@aztec/private-commerce/
├── src/
│   ├── index.ts
│   ├── subscriptions.ts          // SubscriptionClient
│   ├── payroll.ts                // PayrollClient
│   ├── fundraising.ts            // FundraisingClient
│   ├── grants.ts                 // GrantsClient
│   ├── invoicing.ts              // InvoiceClient
│   ├── bounties.ts               // BountyClient
│   ├── tipping.ts                // TippingClient
│   ├── memberships.ts            // MembershipClient
│   ├── loyalty.ts                // LoyaltyClient
│   ├── gate.ts                   // PrivateGateClient
│   ├── compliance.ts             // ComplianceClient
│   ├── receipts.ts               // ReceiptClient
│   ├── types.ts
│   ├── contracts/                // Compiled artifacts
│   └── integrations/
│       ├── discord-bot/          // Private token gating bot
│       ├── shopify/              // Shopify payment plugin
│       ├── request-finance/      // Request Finance adapter
│       └── web-widget/           // Embeddable "Subscribe Privately" button
├── tests/
├── package.json
└── README.md
```

### 7.2 Core APIs

```typescript
// ══════════════════════════════════════════
// Subscription API
// ══════════════════════════════════════════

class SubscriptionClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  // Merchant
  async createPlan(config: PlanConfig): Promise<PlanId> {}
  async updatePlanPrice(planId: Fr, newPrice: bigint): Promise<void> {}
  async deactivatePlan(planId: Fr): Promise<void> {}
  async getMerchantStats(): Promise<MerchantStats> {}

  // Subscriber
  async subscribe(planId: Fr, paymentToken: AztecAddress): Promise<void> {}
  async paySubscription(planId: Fr): Promise<void> {}
  async cancelSubscription(planId: Fr): Promise<void> {}
  async changePlan(oldPlanId: Fr, newPlanId: Fr): Promise<void> {}
  async proveActiveSubscription(planId: Fr): Promise<Proof> {}
  async listMySubscriptions(): Promise<SubscriptionInfo[]> {}
  async getNextPaymentDate(planId: Fr): Promise<Date> {}
}


// ══════════════════════════════════════════
// Payroll API
// ══════════════════════════════════════════

class PayrollClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  // Employer
  async registerEmployer(config: PayrollConfig): Promise<void> {}
  async addEmployee(employee: AztecAddress, config: EmployeeConfig): Promise<void> {}
  async paySalary(employee: AztecAddress): Promise<void> {}
  async payBatchSalaries(employees: AztecAddress[]): Promise<void> {}
  async payBonus(employee: AztecAddress, amount: bigint, reason: string): Promise<void> {}
  async adjustSalary(employee: AztecAddress, newSalary: bigint): Promise<void> {}
  async terminateEmployee(employee: AztecAddress): Promise<void> {}
  async getPayrollStats(): Promise<PayrollStats> {}

  // Employee
  async proveEmployment(): Promise<Proof> {}
  async proveSalaryAbove(minSalary: bigint): Promise<Proof> {}
  async proveTenureAbove(minMonths: number): Promise<Proof> {}
  async getMyPayrollInfo(): Promise<PayrollInfo> {}
  async getPaymentHistory(): Promise<ReceiptInfo[]> {}
}


// ══════════════════════════════════════════
// Fundraising API
// ══════════════════════════════════════════

class FundraisingClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  // Project
  async createRound(config: RoundConfig): Promise<RoundId> {}
  async finalizeRound(roundId: Fr): Promise<void> {}
  async getRoundProgress(roundId: Fr): Promise<RoundProgress> {}

  // Investor
  async invest(roundId: Fr, amount: bigint, vestingConfig: VestingConfig): Promise<void> {}
  async claimVested(roundId: Fr): Promise<bigint> {}
  async getVestingSchedule(roundId: Fr): Promise<VestingSchedule> {}
  async proveInvestment(roundId: Fr): Promise<Proof> {}
  async proveInvestmentAbove(roundId: Fr, minAmount: bigint): Promise<Proof> {}
  async listMyInvestments(): Promise<InvestmentInfo[]> {}
}


// ══════════════════════════════════════════
// Grants API
// ══════════════════════════════════════════

class GrantsClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  // Grantor
  async createProgram(config: GrantProgramConfig): Promise<ProgramId> {}
  async awardGrant(recipient: AztecAddress, config: GrantConfig): Promise<void> {}
  async approveMilestone(recipient: AztecAddress, milestoneProof: string): Promise<void> {}
  async getProgramStats(programId: Fr): Promise<ProgramStats> {}

  // Recipient
  async applyForGrant(programId: Fr, application: GrantApplication): Promise<void> {}
  async proveGrantRecipient(programId: Fr): Promise<Proof> {}
  async getMyGrants(): Promise<GrantInfo[]> {}
  async getMilestoneStatus(programId: Fr): Promise<MilestoneStatus> {}
}


// ══════════════════════════════════════════
// Invoicing API
// ══════════════════════════════════════════

class InvoiceClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  async createInvoice(payer: AztecAddress, config: InvoiceConfig): Promise<InvoiceId> {}
  async payInvoice(invoiceId: Fr): Promise<void> {}
  async disputeInvoice(invoiceId: Fr, reason: string): Promise<void> {}
  async cancelInvoice(invoiceId: Fr): Promise<void> {}
  async proveInvoicePaid(invoiceId: Fr): Promise<Proof> {}
  async listIssuedInvoices(): Promise<InvoiceInfo[]> {}
  async listReceivedInvoices(): Promise<InvoiceInfo[]> {}
  async getOverdueInvoices(): Promise<InvoiceInfo[]> {}
}


// ══════════════════════════════════════════
// Bounty API
// ══════════════════════════════════════════

class BountyClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  async createBounty(config: BountyConfig): Promise<BountyId> {}
  async submitWork(bountyId: Fr, submission: string): Promise<void> {}
  async approveAndPay(bountyId: Fr, claimer: AztecAddress): Promise<void> {}
  async disputeSubmission(bountyId: Fr, reason: string): Promise<void> {}
  async refundExpiredBounty(bountyId: Fr): Promise<void> {}
  async listMyBounties(): Promise<BountyInfo[]> {}
  async listMySubmissions(): Promise<BountyInfo[]> {}
}


// ══════════════════════════════════════════
// Tipping / Donations API
// ══════════════════════════════════════════

class TippingClient {
  constructor(pxe: PXE, contractAddress: AztecAddress) {}

  async tip(recipient: AztecAddress, token: AztecAddress, amount: bigint, message?: string): Promise<void> {}
  async donate(recipient: AztecAddress, token: AztecAddress, amount: bigint): Promise<void> {}
  async setupRecurringTip(config: RecurringTipConfig): Promise<void> {}
  async cancelRecurringTip(recipient: AztecAddress): Promise<void> {}
  async payRecurringTip(recipient: AztecAddress): Promise<void> {}
  async proveTipsReceivedAbove(minTotal: bigint): Promise<Proof> {}
  async getMyTipsReceived(): Promise<TipInfo[]> {}
  async getMyTipsSent(): Promise<TipInfo[]> {}
}
```

---

## 8. Deployment & Go-to-Market

### 8.1 Phased Rollout

```
Phase 1: Foundation (Months 1-3)
├── Core contracts: SubscriptionManager, TippingManager, PrivateGate
├── Web SDK: "Subscribe Privately" embeddable widget
├── Discord bot: private token gating (Collab.Land replacement)
├── Target: 5-10 crypto newsletter/tool creators as pilot merchants
└── Metric: 100 active subscriptions, 5 merchants

Phase 2: B2B & Employment (Months 3-6)
├── Contracts: PayrollManager, InvoiceManager
├── Dashboard: merchant/employer analytics (aggregates only)
├── Integration: Request Finance adapter for private invoicing on Aztec
├── Target: 3-5 DAOs using private payroll
└── Metric: $100K monthly payroll volume, 50 employees

Phase 3: Capital Formation (Months 6-9)
├── Contracts: FundraisingManager, GrantsManager, BountyBoard
├── Fundraising portal: projects create private rounds
├── Grants platform: Gitcoin-style with private allocations
├── Target: 2-3 fundraising rounds, 1 grant program
└── Metric: $500K raised privately, 10 grants disbursed

Phase 4: Full Stack + Enterprise (Months 9-14)
├── Contracts: EscrowManager, LoyaltyEngine, MembershipRegistry
├── Shopify/WooCommerce plugin for private checkout
├── Enterprise compliance dashboard with view keys
├── SDK: complete @aztec/private-commerce package
├── Cross-product composability enabled
└── Metric: $1M monthly commerce volume, 50+ merchants
```

### 8.2 Revenue Model

| Revenue Stream | Fee Structure | Phase |
|---------------|---------------|-------|
| Subscription payments | 0.5-1% of payment amount | Phase 1 |
| Token gating verifications | $0.01 per verification (free tier: 1000/mo) | Phase 1 |
| Payroll processing | 0.1% of salary amount | Phase 2 |
| Invoice payments | 0.25% of invoice amount | Phase 2 |
| Fundraising | 1% of funds raised | Phase 3 |
| Grant disbursement | 0.5% of disbursed amount | Phase 3 |
| Bounty completion | 1% of bounty reward | Phase 3 |
| Merchant dashboard SaaS | $29-299/month per merchant | Phase 2+ |
| Enterprise compliance | Custom pricing | Phase 4 |
| Loyalty program hosting | $99-499/month per program | Phase 4 |

---

## 9. Privacy Guarantees Summary

### What's Private Across All Modules

| Data Point | Private? | How |
|-----------|----------|-----|
| Payer identity | Yes | Private notes, ZK proofs |
| Payee identity (for tips/donations) | Yes | Encrypted note delivery |
| Payment amount | Yes (except bounties, see below) | Stored in private notes |
| Bounty reward amount | Creator's choice (public by default) | Public listing with `is_amount_public` toggle; private only when creator explicitly opts in for sensitive tasks |
| Payment frequency | Yes | Stored in private notes |
| Relationship duration | Yes | Start/end blocks in private notes |
| Individual terms (salary, price) | Yes | Private note fields |
| Purchase history | Yes | Private receipt notes |
| Token holdings (for gating) | Yes | ZK balance proofs |
| Membership/subscription status | Selectively | Prove active without revealing details |

### What's Public Across All Modules

| Data Point | Why Public |
|-----------|-----------|
| Service/plan existence | Users need to discover what's available |
| Aggregate subscriber/member count | Merchants need social proof; users need trust signals |
| Aggregate revenue/disbursement | Protocol transparency |
| Gate requirements | Users need to know what qualifies |
| Loyalty program rules | Users need to know how to earn/redeem |
| Fundraising round terms | Investors need to evaluate opportunities |
| Grant program budgets | Applicants need to know what's available |

---

## 10. Aztec-Specific Design Constraints

| Constraint | Impact on Commerce | Design Response |
|------------|-------------------|----------------|
| ~1 TPS (Alpha) | Low throughput for bulk payroll | Batch payroll processing; stagger payments across blocks |
| 64 notes per tx | Can't pay 100 employees in one tx | Pay in batches of ~10-15 per transaction |
| 16 notes per function | Limits operations per function call | One payment per function call; use batch_execute for multiple |
| Private can't read public | Can't check plan price during subscription | Pass plan details as args; verify in enqueued public call |
| Public can't call private | Can't trigger private payment from public | Use keeper pattern: off-chain automation triggers private payments |
| msg_sender leaked on private→public | User address exposed on aggregate updates | Use protocol contract as intermediary for public calls |
| ~6s block times | Subscription timing is block-based, not time-based | Convert time periods to block counts (1 day ≈ 14,400 blocks at 6s) |
| State migration on upgrades | Hard forks wipe notes | Implement note migration; keep off-chain backups in PXE |
| Client-side proving | 2-8s per payment proof | Acceptable for commerce (not real-time); pre-generate proofs for known payments |
| No native cron/automation | Can't auto-trigger recurring payments | Keeper network or user-initiated payments with grace periods |
