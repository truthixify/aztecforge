# AztecForge System Redesign

Based on research of Superteam Earn, Gitcoin, Dework, Layer3, and Bountycaster.

## Key Changes from Current Implementation

### 1. Organization/Sponsor Model
- Bounties belong to an Organization, not just a wallet address
- Orgs have members with roles (ADMIN, MEMBER)
- Only verified orgs can create listings
- Members can be invited/removed

### 2. Listing Model (replaces separate Bounty/Quest/Hackathon)
- Unified Listing model with `type`: BOUNTY, PROJECT, GRANT, HACKATHON
- Lifecycle: DRAFT -> OPEN -> REVIEW -> CLOSED -> COMPLETED
- Multi-winner support with position-based rewards (1st, 2nd, 3rd + bonus)
- Deadline + announcement date (when winners will be revealed)
- Point of contact per listing
- Rich description (markdown)
- Eligibility questions for projects/grants
- Compensation type: FIXED, RANGE, VARIABLE

### 3. Submission Model
- Two-track system: `status` (official: PENDING/APPROVED/REJECTED) + `label` (internal: UNREVIEWED/REVIEWED/SHORTLISTED/SPAM/LOW/MID/HIGH)
- Winner position tracking (1st, 2nd, 3rd... up to 10 + bonus)
- Payment tracking per submission
- Internal review notes (private to org)
- One submission per user per listing
- URL-based (link + optional tweet)
- `ask` field for range/variable compensation

### 4. Grant Application Model
- Separate from bounty submissions
- Milestone/tranche-based payments
- Application requires project details, timeline, proof of work
- Each tranche: PENDING -> APPROVED -> PAID or REJECTED

### 5. User Model Improvements
- Wallet address as primary identifier
- Profile: bio, skills, social links
- Verification status
- Credit balance for spam prevention

### 6. Comment System
- Threaded comments on listings
- Special comment types: DEADLINE_EXTENSION, WINNER_ANNOUNCEMENT
- Used for public communication between org and contributors

## New Status Flows

### Listing:
```
DRAFT -> OPEN -> REVIEW -> CLOSED (winners announced) -> COMPLETED (all paid)
                    |
                    +-> CANCELLED (refund)
```

### Submission:
```
PENDING (label: UNREVIEWED)
  -> Sponsor reviews -> label changes (REVIEWED/SHORTLISTED/SPAM/HIGH/LOW)
  -> Winner selected -> isWinner=true, winnerPosition=N
  -> Winners announced -> APPROVED (winners) / REJECTED (non-winners)
  -> Payment sent -> isPaid=true
```

### Grant Application:
```
PENDING -> APPROVED (with amount) -> IN_PROGRESS
  -> Tranche requested -> PENDING -> APPROVED -> PAID
  -> All tranches done -> COMPLETED
```

## Implementation Order
1. Update Prisma schema with new models
2. Migrate database
3. Rewrite server services and controllers
4. Update client pages
5. Update contracts if needed
