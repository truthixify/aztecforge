export enum BountyStatus {
  OPEN = 0,
  CLAIMED = 1,
  SUBMITTED = 2,
  APPROVED = 3,
  CANCELLED = 4,
  DISPUTED = 5,
}

export enum ReputationTier {
  NEWCOMER = 0,
  CONTRIBUTOR = 1,
  BUILDER = 2,
  EXPERT = 3,
  CORE = 4,
}

export enum QuestType {
  ON_CHAIN = 0,
  CONTENT = 1,
  DEVELOPMENT = 2,
  COMMUNITY = 3,
}

export enum PoolType {
  OPEN = 0,
  QUADRATIC = 1,
  RETROACTIVE = 2,
  STREAMING = 3,
}

export enum HackathonStatus {
  REGISTRATION = 0,
  BUILDING = 1,
  JUDGING = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export interface Bounty {
  id: number;
  creator: string;
  paymentToken: string;
  rewardAmount: string;
  title: string;
  description: string;
  deadline: number;
  status: BountyStatus;
  isAmountPublic: boolean;
  claimer: string;
  submissionHash: string;
  escrowBalance: string;
  skills: string[];
  difficulty: string;
}

export interface BountyStats {
  totalBountiesPosted: number;
  totalBountiesCompleted: number;
  totalValueEscrowed: string;
  totalValuePaid: string;
}

export interface ContributorReputation {
  address: string;
  score: number;
  tier: ReputationTier;
  bountiesCompleted: number;
  hackathonsWon: number;
  grantsReceived: number;
  questsCompleted: number;
}

export interface FundingPool {
  id: number;
  curator: string;
  purpose: string;
  poolType: PoolType;
  status: number;
  totalDeposited: string;
  totalDisbursed: string;
  contributorCount: number;
  recipientCount: number;
}

export interface Circle {
  id: number;
  admin: string;
  name: string;
  currentEpoch: number;
  memberCount: number;
  givePerMember: number;
  rewardPool: string;
  totalDistributed: string;
}

export interface Hackathon {
  id: number;
  organizer: string;
  name: string;
  description: string;
  prizePool: string;
  status: HackathonStatus;
  teamCount: number;
  submissionCount: number;
  tracks: string[];
}

export interface Quest {
  id: number;
  creator: string;
  name: string;
  description: string;
  questType: QuestType;
  rewardPerCompletion: string;
  maxCompletions: number;
  completionCount: number;
  status: number;
}
