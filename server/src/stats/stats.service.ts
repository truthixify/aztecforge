import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalBounties,
      activeBounties,
      completedBounties,
      totalHackathons,
      activeHackathons,
      totalPools,
      totalQuests,
      totalContributors,
      bounties,
    ] = await Promise.all([
      this.prisma.bounty.count(),
      this.prisma.bounty.count({ where: { status: { in: [0, 1, 2] } } }),
      this.prisma.bounty.count({ where: { status: 3 } }),
      this.prisma.hackathon.count(),
      this.prisma.hackathon.count({ where: { status: { in: [0, 1, 2] } } }),
      this.prisma.fundingPool.count(),
      this.prisma.quest.count(),
      this.prisma.contributor.count(),
      this.prisma.bounty.findMany({ select: { escrowBalance: true, rewardAmount: true, status: true } }),
    ]);

    let totalEscrowed = 0n;
    let totalPaid = 0n;
    for (const b of bounties) {
      if (b.status < 3) totalEscrowed += BigInt(b.escrowBalance || '0');
      if (b.status === 3) totalPaid += BigInt(b.rewardAmount || '0');
    }

    return {
      activeBounties,
      totalBounties,
      completedBounties,
      totalEscrowed: totalEscrowed.toString(),
      totalPaid: totalPaid.toString(),
      totalHackathons,
      activeHackathons,
      totalPools,
      totalQuests,
      totalContributors,
    };
  }
}
