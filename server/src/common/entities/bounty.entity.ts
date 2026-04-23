export enum BountyStatus {
  OPEN = 0,
  CLAIMED = 1,
  SUBMITTED = 2,
  APPROVED = 3,
  CANCELLED = 4,
  DISPUTED = 5,
}

export interface Bounty {
  id: number;
  creator: string;
  paymentToken: string;
  rewardAmount: string;
  descriptionHash: string;
  deadline: number;
  status: BountyStatus;
  isAmountPublic: boolean;
  claimer: string;
  submissionHash: string;
  escrowBalance: string;
}

export interface BountyStats {
  totalBountiesPosted: number;
  totalBountiesCompleted: number;
  totalValueEscrowed: string;
  totalValuePaid: string;
}
