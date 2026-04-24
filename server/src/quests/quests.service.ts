import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateQuestDto } from './dto/quest.dto';

@Injectable()
export class QuestsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestDto, creator: string) {
    return this.prisma.quest.create({
      data: {
        name: dto.name,
        description: dto.description,
        questType: dto.questType,
        paymentToken: dto.paymentToken,
        rewardPerCompletion: dto.rewardPerCompletion,
        maxCompletions: dto.maxCompletions,
        deadline: dto.deadlineBlock,
        reputationGateId: dto.reputationGateId ?? 0,
        creator,
      },
    });
  }

  async findAll(filters?: { status?: number; creator?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status !== undefined) where.status = filters.status;
    if (filters?.creator) where.creator = filters.creator;
    return this.prisma.quest.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const quest = await this.prisma.quest.findUnique({ where: { id } });
    if (!quest) throw new NotFoundException(`Quest #${id} not found`);
    return quest;
  }

  async complete(questId: number, completer: string, verificationUrl: string) {
    const quest = await this.findOne(questId);
    if (quest.questType !== 0) throw new BadRequestException('Requires verifier approval');
    return this.processCompletion(questId, completer, verificationUrl);
  }

  async verifyCompletion(questId: number, _verifier: string, completer: string, verificationUrl: string) {
    return this.processCompletion(questId, completer, verificationUrl);
  }

  async deactivate(questId: number, creator: string) {
    const quest = await this.findOne(questId);
    if (quest.creator !== creator) throw new BadRequestException('Not the creator');
    return this.prisma.quest.update({ where: { id: questId }, data: { status: 1 } });
  }

  async addVerifier(_questId: number, _creator: string, _verifier: string) {
    // Verifiers tracked on-chain
  }

  async hasCompleted(questId: number, completer: string) {
    const count = await this.prisma.questCompletion.count({ where: { questId, completer } });
    return count > 0;
  }

  async getCompletions(questId: number) {
    return this.prisma.questCompletion.findMany({ where: { questId }, orderBy: { completedAt: 'desc' } });
  }

  async getStats() {
    const [total, quests] = await Promise.all([
      this.prisma.quest.count(),
      this.prisma.quest.findMany({ select: { completionCount: true, rewardPerCompletion: true } }),
    ]);
    let totalCompleted = 0;
    let totalPaid = 0n;
    for (const q of quests) {
      totalCompleted += q.completionCount;
      totalPaid += BigInt(q.rewardPerCompletion) * BigInt(q.completionCount);
    }
    return { totalQuestsCreated: total, totalQuestsCompleted: totalCompleted, totalRewardsPaid: totalPaid.toString() };
  }

  private async processCompletion(questId: number, completer: string, verificationUrl: string) {
    const quest = await this.findOne(questId);
    if (quest.status !== 0) throw new BadRequestException('Quest not active');

    const existing = await this.prisma.questCompletion.findFirst({ where: { questId, completer } });
    if (existing) throw new BadRequestException('Already completed');

    if (quest.maxCompletions > 0 && quest.completionCount >= quest.maxCompletions) {
      throw new BadRequestException('Max completions reached');
    }

    await this.prisma.questCompletion.create({ data: { questId, completer, verificationUrl } });

    const newCount = quest.completionCount + 1;
    const newStatus = quest.maxCompletions > 0 && newCount >= quest.maxCompletions ? 1 : quest.status;

    return this.prisma.quest.update({
      where: { id: questId },
      data: { completionCount: newCount, status: newStatus },
    });
  }
}
