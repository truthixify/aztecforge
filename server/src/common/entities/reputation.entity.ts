export enum ReputationTier {
  NEWCOMER = 0,
  CONTRIBUTOR = 1,
  BUILDER = 2,
  EXPERT = 3,
  CORE = 4,
}

export interface ContributorReputation {
  address: string;
  score: number;
  tier: ReputationTier;
  bountiesCompleted: number;
  bountiesTotalEarned: string;
  hackathonsParticipated: number;
  hackathonsWon: number;
  grantsReceived: number;
  grantsTotalEarned: string;
  milestonesDelivered: number;
  questsCompleted: number;
  peerGiveReceived: string;
  peerEpochsParticipated: number;
}

export interface ReputationGate {
  id: number;
  minBounties: number;
  minHackathonWins: number;
  minTier: ReputationTier;
  minTenureBlocks: number;
  active: boolean;
}
