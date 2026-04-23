use aztec::macros::aztec;

/// HackathonEngine contract for AztecForge.
///
/// Manages the full hackathon lifecycle: creation, team registration, project
/// submission, judging, prize distribution.
///
/// Public: hackathon details, tracks, team registrations (opt-in), winner announcements.
/// Private (future): judge scores hidden from each other during judging, prize amounts per winner.
///
/// Status flow:
///   0 = created (registration open)
///   1 = building (registration closed, submissions open)
///   2 = judging (submissions closed, judges scoring)
///   3 = completed (winners announced, prizes distributed)
///   4 = cancelled
#[aztec]
pub contract HackathonEngine {
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

        // Hackathon counter
        hackathon_count: PublicMutable<u64, Context>,

        // Per-hackathon config
        hackathon_organizers: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        hackathon_name_hashes: Map<u64, PublicMutable<Field, Context>, Context>,
        hackathon_description_hashes: Map<u64, PublicMutable<Field, Context>, Context>,
        hackathon_tokens: Map<u64, PublicMutable<AztecAddress, Context>, Context>,
        hackathon_prize_pools: Map<u64, PublicMutable<u128, Context>, Context>,
        hackathon_statuses: Map<u64, PublicMutable<u8, Context>, Context>,
        hackathon_submission_deadlines: Map<u64, PublicMutable<u64, Context>, Context>,
        hackathon_judging_deadlines: Map<u64, PublicMutable<u64, Context>, Context>,

        // Per-hackathon aggregates
        hackathon_team_counts: Map<u64, PublicMutable<u64, Context>, Context>,
        hackathon_submission_counts: Map<u64, PublicMutable<u64, Context>, Context>,
        hackathon_prize_paid: Map<u64, PublicMutable<u128, Context>, Context>,

        // Tracks: key = hash(hackathon_id, track_index)
        hackathon_track_counts: Map<u64, PublicMutable<u8, Context>, Context>,
        track_name_hashes: Map<Field, PublicMutable<Field, Context>, Context>,
        track_description_hashes: Map<Field, PublicMutable<Field, Context>, Context>,
        track_submission_counts: Map<Field, PublicMutable<u64, Context>, Context>,

        // Teams: key = hash(hackathon_id, team_id)
        team_count_per_hackathon: Map<u64, PublicMutable<u64, Context>, Context>,
        team_leads: Map<Field, PublicMutable<AztecAddress, Context>, Context>,
        team_name_hashes: Map<Field, PublicMutable<Field, Context>, Context>,
        team_member_counts: Map<Field, PublicMutable<u8, Context>, Context>,
        team_members: Map<Field, PublicMutable<AztecAddress, Context>, Context>,

        // Submissions: key = hash(hackathon_id, submission_id)
        submission_count_per_hackathon: Map<u64, PublicMutable<u64, Context>, Context>,
        submission_team_ids: Map<Field, PublicMutable<u64, Context>, Context>,
        submission_track_indices: Map<Field, PublicMutable<u8, Context>, Context>,
        submission_project_hashes: Map<Field, PublicMutable<Field, Context>, Context>,
        submission_repo_hashes: Map<Field, PublicMutable<Field, Context>, Context>,
        submission_demo_hashes: Map<Field, PublicMutable<Field, Context>, Context>,

        // Judges: key = hash(hackathon_id, judge_address)
        judge_registered: Map<Field, PublicMutable<bool, Context>, Context>,
        hackathon_judge_counts: Map<u64, PublicMutable<u64, Context>, Context>,

        // Scores: key = hash(hackathon_id, submission_id, judge)
        judge_scores: Map<Field, PublicMutable<u8, Context>, Context>,
        judge_scored: Map<Field, PublicMutable<bool, Context>, Context>,

        // Aggregate scores per submission: key = hash(hackathon_id, submission_id)
        submission_total_scores: Map<Field, PublicMutable<u64, Context>, Context>,
        submission_score_counts: Map<Field, PublicMutable<u64, Context>, Context>,

        // Prizes: key = hash(hackathon_id, team_id)
        prize_amounts: Map<Field, PublicMutable<u128, Context>, Context>,
        prize_placements: Map<Field, PublicMutable<u8, Context>, Context>,
        prize_claimed: Map<Field, PublicMutable<bool, Context>, Context>,
    }

    #[initializer]
    #[external("public")]
    fn constructor(admin: AztecAddress) {
        self.storage.admin.initialize(admin);
        self.storage.hackathon_count.write(0);
    }

    // -----------------------------------------
    // HACKATHON CREATION
    // -----------------------------------------

    /// Create a new hackathon.
    #[external("public")]
    fn create_hackathon(
        name_hash: Field,
        description_hash: Field,
        payment_token: AztecAddress,
        total_prize_pool: u128,
        submission_deadline: u64,
        judging_deadline: u64,
        authwit_nonce: Field,
    ) -> pub u64 {
        let organizer = self.msg_sender();
        let hackathon_id = self.storage.hackathon_count.read();

        // Lock prize pool in escrow
        let _ = self.call(Token::at(payment_token).transfer_in_public(organizer, self.address, total_prize_pool, authwit_nonce));

        self.storage.hackathon_organizers.at(hackathon_id).write(organizer);
        self.storage.hackathon_name_hashes.at(hackathon_id).write(name_hash);
        self.storage.hackathon_description_hashes.at(hackathon_id).write(description_hash);
        self.storage.hackathon_tokens.at(hackathon_id).write(payment_token);
        self.storage.hackathon_prize_pools.at(hackathon_id).write(total_prize_pool);
        self.storage.hackathon_statuses.at(hackathon_id).write(0);
        self.storage.hackathon_submission_deadlines.at(hackathon_id).write(submission_deadline);
        self.storage.hackathon_judging_deadlines.at(hackathon_id).write(judging_deadline);
        self.storage.hackathon_team_counts.at(hackathon_id).write(0);
        self.storage.hackathon_submission_counts.at(hackathon_id).write(0);
        self.storage.hackathon_prize_paid.at(hackathon_id).write(0);
        self.storage.hackathon_track_counts.at(hackathon_id).write(0);
        self.storage.hackathon_judge_counts.at(hackathon_id).write(0);
        self.storage.team_count_per_hackathon.at(hackathon_id).write(0);
        self.storage.submission_count_per_hackathon.at(hackathon_id).write(0);

        self.storage.hackathon_count.write(hackathon_id + 1);

        hackathon_id
    }

    /// Add a track to a hackathon.
    #[external("public")]
    fn add_track(hackathon_id: u64, name_hash: Field, description_hash: Field) {
        let caller = self.msg_sender();
        let organizer = self.storage.hackathon_organizers.at(hackathon_id).read();
        assert(caller.eq(organizer), "Not the organizer");

        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 0, "Cannot add tracks after registration");

        let track_index = self.storage.hackathon_track_counts.at(hackathon_id).read();
        let track_key = poseidon2_hash([hackathon_id as Field, track_index as Field]);

        self.storage.track_name_hashes.at(track_key).write(name_hash);
        self.storage.track_description_hashes.at(track_key).write(description_hash);
        self.storage.track_submission_counts.at(track_key).write(0);

        self.storage.hackathon_track_counts.at(hackathon_id).write(track_index + 1);
    }

    /// Add a judge to a hackathon.
    #[external("public")]
    fn add_judge(hackathon_id: u64, judge: AztecAddress) {
        let caller = self.msg_sender();
        let organizer = self.storage.hackathon_organizers.at(hackathon_id).read();
        assert(caller.eq(organizer), "Not the organizer");

        let judge_key = poseidon2_hash([hackathon_id as Field, judge.to_field()]);
        self.storage.judge_registered.at(judge_key).write(true);

        let count = self.storage.hackathon_judge_counts.at(hackathon_id).read();
        self.storage.hackathon_judge_counts.at(hackathon_id).write(count + 1);
    }

    /// Transition hackathon to building phase (close registration).
    #[external("public")]
    fn start_building_phase(hackathon_id: u64) {
        let caller = self.msg_sender();
        let organizer = self.storage.hackathon_organizers.at(hackathon_id).read();
        assert(caller.eq(organizer), "Not the organizer");
        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 0, "Not in registration phase");
        self.storage.hackathon_statuses.at(hackathon_id).write(1);
    }

    /// Transition to judging phase (close submissions).
    #[external("public")]
    fn start_judging_phase(hackathon_id: u64) {
        let caller = self.msg_sender();
        let organizer = self.storage.hackathon_organizers.at(hackathon_id).read();
        assert(caller.eq(organizer), "Not the organizer");
        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 1, "Not in building phase");
        self.storage.hackathon_statuses.at(hackathon_id).write(2);
    }

    /// Finalize the hackathon (mark as completed).
    #[external("public")]
    fn finalize_hackathon(hackathon_id: u64) {
        let caller = self.msg_sender();
        let organizer = self.storage.hackathon_organizers.at(hackathon_id).read();
        assert(caller.eq(organizer), "Not the organizer");
        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 2, "Not in judging phase");
        self.storage.hackathon_statuses.at(hackathon_id).write(3);
    }

    // -----------------------------------------
    // TEAM REGISTRATION
    // -----------------------------------------

    /// Register a team for a hackathon.
    #[external("public")]
    fn register_team(hackathon_id: u64, team_name_hash: Field) -> pub u64 {
        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 0, "Registration closed");

        let team_lead = self.msg_sender();
        let team_id = self.storage.team_count_per_hackathon.at(hackathon_id).read();

        let team_key = poseidon2_hash([hackathon_id as Field, team_id as Field]);

        self.storage.team_leads.at(team_key).write(team_lead);
        self.storage.team_name_hashes.at(team_key).write(team_name_hash);
        self.storage.team_member_counts.at(team_key).write(1);

        // Store team lead as first member: key = hash(team_key, member_index)
        let member_slot = poseidon2_hash([team_key, 0]);
        self.storage.team_members.at(member_slot).write(team_lead);

        self.storage.team_count_per_hackathon.at(hackathon_id).write(team_id + 1);
        let total_teams = self.storage.hackathon_team_counts.at(hackathon_id).read();
        self.storage.hackathon_team_counts.at(hackathon_id).write(total_teams + 1);

        team_id
    }

    // -----------------------------------------
    // SUBMISSIONS
    // -----------------------------------------

    /// Submit a project for a hackathon.
    #[external("public")]
    fn submit_project(
        hackathon_id: u64,
        team_id: u64,
        track_index: u8,
        project_hash: Field,
        repo_hash: Field,
        demo_hash: Field,
    ) -> pub u64 {
        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert((status == 0) | (status == 1), "Submissions not open");

        // Verify caller is the team lead
        let team_key = poseidon2_hash([hackathon_id as Field, team_id as Field]);
        let team_lead = self.storage.team_leads.at(team_key).read();
        assert(self.msg_sender().eq(team_lead), "Not the team lead");

        let submission_id = self.storage.submission_count_per_hackathon.at(hackathon_id).read();
        let sub_key = poseidon2_hash([hackathon_id as Field, submission_id as Field]);

        self.storage.submission_team_ids.at(sub_key).write(team_id);
        self.storage.submission_track_indices.at(sub_key).write(track_index);
        self.storage.submission_project_hashes.at(sub_key).write(project_hash);
        self.storage.submission_repo_hashes.at(sub_key).write(repo_hash);
        self.storage.submission_demo_hashes.at(sub_key).write(demo_hash);
        self.storage.submission_total_scores.at(sub_key).write(0);
        self.storage.submission_score_counts.at(sub_key).write(0);

        self.storage.submission_count_per_hackathon.at(hackathon_id).write(submission_id + 1);
        let total_subs = self.storage.hackathon_submission_counts.at(hackathon_id).read();
        self.storage.hackathon_submission_counts.at(hackathon_id).write(total_subs + 1);

        // Update track submission count
        let track_key = poseidon2_hash([hackathon_id as Field, track_index as Field]);
        let track_subs = self.storage.track_submission_counts.at(track_key).read();
        self.storage.track_submission_counts.at(track_key).write(track_subs + 1);

        submission_id
    }

    // -----------------------------------------
    // JUDGING
    // -----------------------------------------

    /// Score a submission (0-100). Only registered judges can score.
    #[external("public")]
    fn score_submission(hackathon_id: u64, submission_id: u64, score: u8) {
        let judge = self.msg_sender();
        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 2, "Not in judging phase");
        assert(score <= 100, "Score must be 0-100");

        // Verify judge is registered
        let judge_reg_key = poseidon2_hash([hackathon_id as Field, judge.to_field()]);
        assert(self.storage.judge_registered.at(judge_reg_key).read(), "Not a judge");

        // Check not already scored
        let score_key = poseidon2_hash([hackathon_id as Field, submission_id as Field, judge.to_field()]);
        assert(!self.storage.judge_scored.at(score_key).read(), "Already scored");

        self.storage.judge_scores.at(score_key).write(score);
        self.storage.judge_scored.at(score_key).write(true);

        // Update aggregate score
        let sub_key = poseidon2_hash([hackathon_id as Field, submission_id as Field]);
        let total = self.storage.submission_total_scores.at(sub_key).read();
        self.storage.submission_total_scores.at(sub_key).write(total + score as u64);
        let count = self.storage.submission_score_counts.at(sub_key).read();
        self.storage.submission_score_counts.at(sub_key).write(count + 1);
    }

    // -----------------------------------------
    // PRIZE DISTRIBUTION
    // -----------------------------------------

    /// Award a prize to a team. Only organizer, only after finalization.
    #[external("public")]
    fn award_prize(hackathon_id: u64, team_id: u64, placement: u8, prize_amount: u128) {
        let caller = self.msg_sender();
        let organizer = self.storage.hackathon_organizers.at(hackathon_id).read();
        assert(caller.eq(organizer), "Not the organizer");

        let status = self.storage.hackathon_statuses.at(hackathon_id).read();
        assert(status == 3, "Not finalized");

        let prize_key = poseidon2_hash([hackathon_id as Field, team_id as Field]);

        self.storage.prize_amounts.at(prize_key).write(prize_amount);
        self.storage.prize_placements.at(prize_key).write(placement);
        self.storage.prize_claimed.at(prize_key).write(false);

        let paid = self.storage.hackathon_prize_paid.at(hackathon_id).read();
        self.storage.hackathon_prize_paid.at(hackathon_id).write(paid + prize_amount);
    }

    /// Claim a prize. Only the team lead can claim.
    #[external("public")]
    fn claim_prize(hackathon_id: u64, team_id: u64) {
        let team_key = poseidon2_hash([hackathon_id as Field, team_id as Field]);
        let team_lead = self.storage.team_leads.at(team_key).read();
        assert(self.msg_sender().eq(team_lead), "Not team lead");

        let prize_key = team_key; // same key
        assert(!self.storage.prize_claimed.at(prize_key).read(), "Already claimed");

        let amount = self.storage.prize_amounts.at(prize_key).read();
        assert(amount > 0, "No prize awarded");

        self.storage.prize_claimed.at(prize_key).write(true);

        // Transfer prize to team lead
        let token = self.storage.hackathon_tokens.at(hackathon_id).read();
        let _ = self.call(Token::at(token).transfer_in_public(self.address, team_lead, amount, 0));
    }

    // -----------------------------------------
    // READ FUNCTIONS
    // -----------------------------------------

    #[external("public")]
    #[view]
    fn get_hackathon_count() -> pub u64 {
        self.storage.hackathon_count.read()
    }

    #[external("public")]
    #[view]
    fn get_hackathon_status(hackathon_id: u64) -> pub u8 {
        self.storage.hackathon_statuses.at(hackathon_id).read()
    }

    #[external("public")]
    #[view]
    fn get_hackathon_organizer(hackathon_id: u64) -> pub AztecAddress {
        self.storage.hackathon_organizers.at(hackathon_id).read()
    }

    #[external("public")]
    #[view]
    fn get_hackathon_prize_pool(hackathon_id: u64) -> pub u128 {
        self.storage.hackathon_prize_pools.at(hackathon_id).read()
    }

    #[external("public")]
    #[view]
    fn get_hackathon_team_count(hackathon_id: u64) -> pub u64 {
        self.storage.hackathon_team_counts.at(hackathon_id).read()
    }

    #[external("public")]
    #[view]
    fn get_hackathon_submission_count(hackathon_id: u64) -> pub u64 {
        self.storage.hackathon_submission_counts.at(hackathon_id).read()
    }

    #[external("public")]
    #[view]
    fn get_submission_average_score(hackathon_id: u64, submission_id: u64) -> pub u64 {
        let sub_key = poseidon2_hash([hackathon_id as Field, submission_id as Field]);
        let total = self.storage.submission_total_scores.at(sub_key).read();
        let count = self.storage.submission_score_counts.at(sub_key).read();
        if count > 0 { total / count } else { 0 }
    }

    #[external("public")]
    #[view]
    fn get_prize_amount(hackathon_id: u64, team_id: u64) -> pub u128 {
        let key = poseidon2_hash([hackathon_id as Field, team_id as Field]);
        self.storage.prize_amounts.at(key).read()
    }

    #[external("public")]
    #[view]
    fn get_prize_placement(hackathon_id: u64, team_id: u64) -> pub u8 {
        let key = poseidon2_hash([hackathon_id as Field, team_id as Field]);
        self.storage.prize_placements.at(key).read()
    }

    #[external("public")]
    #[view]
    fn is_judge(hackathon_id: u64, judge: AztecAddress) -> pub bool {
        let key = poseidon2_hash([hackathon_id as Field, judge.to_field()]);
        self.storage.judge_registered.at(key).read()
    }
}
