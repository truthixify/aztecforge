export interface Circle {
  id: number;
  admin: string;
  paymentToken: string;
  epochDuration: number;
  currentEpoch: number;
  memberCount: number;
  givePerMember: number;
  rewardPool: string;
  totalDistributed: string;
  status: number;
}

export interface EpochSummary {
  circleId: number;
  epoch: number;
  totalGive: number;
  rewardPool: string;
}

export interface MemberAllocation {
  circleId: number;
  epoch: number;
  member: string;
  giveReceived: number;
  giveSpent: number;
  claimed: boolean;
}
