import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalListings,
      openListings,
      completedListings,
      totalOrgs,
      totalUsers,
      totalPools,
      totalSubmissions,
      listings,
    ] = await Promise.all([
      this.prisma.listing.count({ where: { isActive: true } }),
      this.prisma.listing.count({ where: { status: 'OPEN' } }),
      this.prisma.listing.count({ where: { status: 'COMPLETED' } }),
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.fundingPool.count(),
      this.prisma.listingSubmission.count(),
      this.prisma.listing.findMany({
        where: { isActive: true },
        select: { status: true, escrowBalance: true, rewardAmount: true, type: true },
      }),
    ]);

    let totalEscrowed = 0n;
    let totalPaid = 0n;
    const typeCounts: Record<string, number> = {};
    for (const l of listings) {
      if (['OPEN', 'REVIEW', 'CLOSED'].includes(l.status)) totalEscrowed += BigInt(l.escrowBalance || '0');
      if (l.status === 'COMPLETED') totalPaid += BigInt(l.rewardAmount || '0');
      typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
    }

    return {
      totalListings,
      openListings,
      completedListings,
      totalEscrowed: totalEscrowed.toString(),
      totalPaid: totalPaid.toString(),
      totalOrgs,
      totalUsers,
      totalPools,
      totalSubmissions,
      activeBounties: typeCounts['BOUNTY'] || 0,
      activeHackathons: typeCounts['HACKATHON'] || 0,
      activeProjects: typeCounts['PROJECT'] || 0,
      activeGrants: typeCounts['GRANT'] || 0,
      totalContributors: totalUsers,
    };
  }
}
