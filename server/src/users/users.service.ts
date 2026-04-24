import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(walletAddress: string) {
    return this.prisma.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
    });
  }

  async findByWallet(walletAddress: string) {
    const user = await this.prisma.user.findUnique({ where: { walletAddress } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(walletAddress: string, data: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
    twitter?: string;
    github?: string;
    discord?: string;
    telegram?: string;
    website?: string;
    skills?: string[];
  }) {
    return this.prisma.user.update({
      where: { walletAddress },
      data: {
        ...data,
        skills: data.skills ? JSON.stringify(data.skills) : undefined,
      },
    });
  }

  async getLeaderboard(limit = 20) {
    return this.prisma.user.findMany({
      where: { reputationScore: { gt: 0 } },
      orderBy: { reputationScore: 'desc' },
      take: limit,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        displayName: true,
        avatar: true,
        reputationScore: true,
        reputationTier: true,
        bountiesWon: true,
        totalEarned: true,
        skills: true,
      },
    });
  }

  async updateReputation(userId: number, delta: { score: number; bountiesWon?: number; earned?: string }) {
    const user = await this.findById(userId);
    const newScore = user.reputationScore + delta.score;
    const tier = newScore >= 500 ? 4 : newScore >= 200 ? 3 : newScore >= 50 ? 2 : newScore >= 10 ? 1 : 0;
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: newScore,
        reputationTier: tier,
        bountiesWon: delta.bountiesWon ? user.bountiesWon + delta.bountiesWon : undefined,
        totalEarned: delta.earned ? (BigInt(user.totalEarned) + BigInt(delta.earned)).toString() : undefined,
      },
    });
  }
}
