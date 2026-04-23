export enum HackathonStatus {
  REGISTRATION = 0,
  BUILDING = 1,
  JUDGING = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export interface Hackathon {
  id: number;
  organizer: string;
  nameHash: string;
  descriptionHash: string;
  paymentToken: string;
  prizePool: string;
  status: HackathonStatus;
  submissionDeadline: number;
  judgingDeadline: number;
  teamCount: number;
  submissionCount: number;
  prizePaid: string;
  trackCount: number;
  judgeCount: number;
}

export interface Team {
  hackathonId: number;
  teamId: number;
  lead: string;
  nameHash: string;
  memberCount: number;
}

export interface Submission {
  hackathonId: number;
  submissionId: number;
  teamId: number;
  trackIndex: number;
  projectHash: string;
  repoHash: string;
  demoHash: string;
  averageScore: number;
}

export interface Prize {
  hackathonId: number;
  teamId: number;
  placement: number;
  amount: string;
  claimed: boolean;
}
