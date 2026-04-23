export enum QuestType {
  ON_CHAIN = 0,
  CONTENT = 1,
  DEVELOPMENT = 2,
  COMMUNITY = 3,
}

export enum QuestStatus {
  ACTIVE = 0,
  INACTIVE = 1,
}

export interface Quest {
  id: number;
  creator: string;
  nameHash: string;
  descriptionHash: string;
  questType: QuestType;
  paymentToken: string;
  rewardPerCompletion: string;
  maxCompletions: number;
  completionCount: number;
  deadline: number;
  status: QuestStatus;
  reputationGateId: number;
}

export interface QuestStats {
  totalQuestsCreated: number;
  totalQuestsCompleted: number;
  totalRewardsPaid: string;
}
