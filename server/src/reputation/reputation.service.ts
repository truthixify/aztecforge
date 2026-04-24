import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReputationService {
  constructor(private prisma: PrismaService) {}

  async findOne(address: string) {
    const rep = await this.prisma.contributor.findUnique({ where: { address } });
    if (!rep) throw new NotFoundException(`Contributor ${address} not found`);
    return rep;
  }

  async findAll() {
    return this.prisma.contributor.findMany({ orderBy: { score: 'desc' } });
  }

  async getLeaderboard(limit = 20) {
    return this.prisma.contributor.findMany({ orderBy: { score: 'desc' }, take: limit });
  }

  async getOrCreate(address: string) {
    return this.prisma.contributor.upsert({
      where: { address },
      create: { address },
      update: {},
    });
  }

  async recordBountyCompletion(address: string, earnedAmount: string) {
    const rep = await this.getOrCreate(address);
    const newEarned = (BigInt(rep.bountiesTotalEarned) + BigInt(earnedAmount)).toString();
    const newCount = rep.bountiesCompleted + 1;
    const score = this.computeScore({ ...rep, bountiesCompleted: newCount });
    return this.prisma.contributor.update({
      where: { address },
      data: {
        bountiesCompleted: newCount,
        bountiesTotalEarned: newEarned,
        score,
        tier: this.scoreTier(score),
      },
    });
  }

  async recordHackathonResult(address: string, won: boolean) {
    const rep = await this.getOrCreate(address);
    const data: Record<string, number> = { hackathonsParticipated: rep.hackathonsParticipated + 1 };
    if (won) data.hackathonsWon = rep.hackathonsWon + 1;
    const score = this.computeScore({ ...rep, ...data });
    return this.prisma.contributor.update({
      where: { address },
      data: { ...data, score, tier: this.scoreTier(score) },
    });
  }

  async recordGrantDelivery(address: string, grantAmount: string) {
    const rep = await this.getOrCreate(address);
    const score = this.computeScore({
      ...rep,
      grantsReceived: rep.grantsReceived + 1,
      milestonesDelivered: rep.milestonesDelivered + 1,
    });
    return this.prisma.contributor.update({
      where: { address },
      data: {
        grantsReceived: rep.grantsReceived + 1,
        grantsTotalEarned: (BigInt(rep.grantsTotalEarned) + BigInt(grantAmount)).toString(),
        milestonesDelivered: rep.milestonesDelivered + 1,
        score,
        tier: this.scoreTier(score),
      },
    });
  }

  async recordPeerRecognition(address: string, giveAmount: string) {
    const rep = await this.getOrCreate(address);
    const score = this.computeScore({ ...rep, peerEpochsParticipated: rep.peerEpochsParticipated + 1 });
    return this.prisma.contributor.update({
      where: { address },
      data: {
        peerGiveReceived: (BigInt(rep.peerGiveReceived) + BigInt(giveAmount)).toString(),
        peerEpochsParticipated: rep.peerEpochsParticipated + 1,
        score,
        tier: this.scoreTier(score),
      },
    });
  }

  async recordQuestCompletion(address: string) {
    const rep = await this.getOrCreate(address);
    const score = this.computeScore({ ...rep, questsCompleted: rep.questsCompleted + 1 });
    return this.prisma.contributor.update({
      where: { address },
      data: {
        questsCompleted: rep.questsCompleted + 1,
        score,
        tier: this.scoreTier(score),
      },
    });
  }

  async getTotalContributors() {
    return this.prisma.contributor.count();
  }

  async createGate(config: { minBounties: number; minHackathonWins: number; minTier: number; minTenureBlocks: number }) {
    // Gates are on-chain only — return a mock for now
    return { id: 0, ...config, active: true };
  }

  async checkGate(address: string, _gateId: number) {
    const rep = await this.prisma.contributor.findUnique({ where: { address } });
    return rep ? rep.tier >= 1 : false;
  }

  private computeScore(rep: { bountiesCompleted: number; hackathonsWon: number; grantsReceived: number; milestonesDelivered: number; questsCompleted: number; peerEpochsParticipated: number }) {
    return rep.bountiesCompleted * 10 + rep.hackathonsWon * 50 + rep.grantsReceived * 30 +
      rep.milestonesDelivered * 20 + rep.questsCompleted * 5 + rep.peerEpochsParticipated * 15;
  }

  private scoreTier(score: number): number {
    if (score >= 500) return 4;
    if (score >= 200) return 3;
    if (score >= 50) return 2;
    if (score >= 10) return 1;
    return 0;
  }
}
