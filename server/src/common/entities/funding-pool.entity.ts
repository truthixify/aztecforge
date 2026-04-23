export enum PoolType {
  OPEN = 0,
  QUADRATIC = 1,
  RETROACTIVE = 2,
  STREAMING = 3,
}

export enum PoolStatus {
  ACTIVE = 0,
  PAUSED = 1,
  CLOSED = 2,
}

export interface FundingPool {
  id: number;
  curator: string;
  paymentToken: string;
  purposeHash: string;
  poolType: PoolType;
  status: PoolStatus;
  totalDeposited: string;
  totalDisbursed: string;
  contributorCount: number;
  recipientCount: number;
}

export interface PoolStats {
  totalPoolsCreated: number;
  totalValueDeposited: string;
  totalValueDisbursed: string;
}
