-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT '',
    "twitter" TEXT NOT NULL DEFAULT '',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orgId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "displayName" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "twitter" TEXT NOT NULL DEFAULT '',
    "github" TEXT NOT NULL DEFAULT '',
    "discord" TEXT NOT NULL DEFAULT '',
    "telegram" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "reputationTier" INTEGER NOT NULL DEFAULT 0,
    "bountiesWon" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" TEXT NOT NULL DEFAULT '0'
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orgId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "pocId" INTEGER,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BOUNTY',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "compensationType" TEXT NOT NULL DEFAULT 'FIXED',
    "token" TEXT NOT NULL DEFAULT 'USDC',
    "rewardAmount" TEXT NOT NULL DEFAULT '0',
    "rewards" TEXT NOT NULL DEFAULT '{}',
    "maxWinners" INTEGER NOT NULL DEFAULT 1,
    "maxBonusSpots" INTEGER NOT NULL DEFAULT 0,
    "isRewardPublic" BOOLEAN NOT NULL DEFAULT true,
    "escrowBalance" TEXT NOT NULL DEFAULT '0',
    "onChainId" INTEGER,
    "txHash" TEXT,
    "deadline" DATETIME NOT NULL,
    "announcementDate" DATETIME,
    "isWinnersAnnounced" BOOLEAN NOT NULL DEFAULT false,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "region" TEXT NOT NULL DEFAULT 'Global',
    "acceptedFormats" TEXT NOT NULL DEFAULT '[]',
    "eligibilityQuestions" TEXT NOT NULL DEFAULT '[]',
    "tracks" TEXT NOT NULL DEFAULT '[]',
    "judgingDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "listingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "tweet" TEXT NOT NULL DEFAULT '',
    "additionalInfo" TEXT NOT NULL DEFAULT '',
    "eligibilityAnswers" TEXT NOT NULL DEFAULT '[]',
    "ask" TEXT NOT NULL DEFAULT '0',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "label" TEXT NOT NULL DEFAULT 'UNREVIEWED',
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "winnerPosition" INTEGER,
    "rewardAmount" TEXT NOT NULL DEFAULT '0',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentTxHash" TEXT,
    "paidAt" DATETIME,
    "internalNotes" TEXT NOT NULL DEFAULT '',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ListingSubmission_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ListingSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "listingId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NORMAL',
    "replyToId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_orgId_userId_key" ON "OrgMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ListingSubmission_listingId_userId_key" ON "ListingSubmission"("listingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FundingPool_onChainId_key" ON "FundingPool"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "Circle_onChainId_key" ON "Circle"("onChainId");
