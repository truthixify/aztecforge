-- CreateTable
CREATE TABLE "Bounty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onChainId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "paymentToken" TEXT NOT NULL,
    "rewardAmount" TEXT NOT NULL,
    "deadline" INTEGER NOT NULL,
    "isAmountPublic" BOOLEAN NOT NULL DEFAULT true,
    "creator" TEXT NOT NULL,
    "winner" TEXT NOT NULL DEFAULT '',
    "escrowBalance" TEXT NOT NULL DEFAULT '0',
    "status" INTEGER NOT NULL DEFAULT 0,
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BountySubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bountyId" INTEGER NOT NULL,
    "submitter" TEXT NOT NULL,
    "submissionUrl" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "status" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BountySubmission_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES "Bounty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hackathon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onChainId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "prizePool" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "submissionDeadline" INTEGER NOT NULL,
    "judgingDeadline" INTEGER NOT NULL,
    "tracks" TEXT NOT NULL DEFAULT '[]',
    "organizer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hackathonId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "members" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hackathonId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "trackIndex" INTEGER NOT NULL,
    "projectName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "demoUrl" TEXT NOT NULL DEFAULT '',
    "averageScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundingPool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onChainId" INTEGER,
    "purpose" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "poolType" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "curator" TEXT NOT NULL,
    "totalDeposited" TEXT NOT NULL DEFAULT '0',
    "totalDisbursed" TEXT NOT NULL DEFAULT '0',
    "contributorCount" INTEGER NOT NULL DEFAULT 0,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Circle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onChainId" INTEGER,
    "name" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "epochDuration" INTEGER NOT NULL,
    "currentEpoch" INTEGER NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "givePerMember" INTEGER NOT NULL,
    "rewardPool" TEXT NOT NULL,
    "totalDistributed" TEXT NOT NULL DEFAULT '0',
    "admin" TEXT NOT NULL,
    "members" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onChainId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "questType" INTEGER NOT NULL DEFAULT 0,
    "paymentToken" TEXT NOT NULL,
    "rewardPerCompletion" TEXT NOT NULL,
    "maxCompletions" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "deadline" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "reputationGateId" INTEGER NOT NULL DEFAULT 0,
    "creator" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuestCompletion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "questId" INTEGER NOT NULL,
    "completer" TEXT NOT NULL,
    "verificationUrl" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestCompletion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contributor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "tier" INTEGER NOT NULL DEFAULT 0,
    "bountiesCompleted" INTEGER NOT NULL DEFAULT 0,
    "bountiesTotalEarned" TEXT NOT NULL DEFAULT '0',
    "hackathonsParticipated" INTEGER NOT NULL DEFAULT 0,
    "hackathonsWon" INTEGER NOT NULL DEFAULT 0,
    "grantsReceived" INTEGER NOT NULL DEFAULT 0,
    "grantsTotalEarned" TEXT NOT NULL DEFAULT '0',
    "milestonesDelivered" INTEGER NOT NULL DEFAULT 0,
    "questsCompleted" INTEGER NOT NULL DEFAULT 0,
    "peerGiveReceived" TEXT NOT NULL DEFAULT '0',
    "peerEpochsParticipated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Bounty_onChainId_key" ON "Bounty"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Hackathon_onChainId_key" ON "Hackathon"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "FundingPool_onChainId_key" ON "FundingPool"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Circle_onChainId_key" ON "Circle"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Quest_onChainId_key" ON "Quest"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_address_key" ON "Contributor"("address");
