import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBountyDto } from './dto/create-bounty.dto';

@Injectable()
export class BountiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBountyDto, creator: string) {
    return this.prisma.bounty.create({
      data: {
        title: dto.title,
        description: dto.description,
        paymentToken: dto.paymentToken,
        rewardAmount: dto.isAmountPublic !== false ? dto.rewardAmount : '0',
        deadline: dto.deadlineBlock,
        isAmountPublic: dto.isAmountPublic !== false,
        skills: JSON.stringify(dto.skills ?? []),
        difficulty: dto.difficulty ?? 'medium',
        creator,
        escrowBalance: dto.rewardAmount,
        status: 0, // open for submissions
      },
    });
  }

  async findAll(filters?: { status?: number; creator?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status !== undefined) where.status = filters.status;
    if (filters?.creator) where.creator = filters.creator;

    const bounties = await this.prisma.bounty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { submissions: true } } },
    });
    return bounties.map((b) => ({
      ...b,
      skills: JSON.parse(b.skills),
      submissionCount: b._count.submissions,
    }));
  }

  async findOne(id: number) {
    const bounty = await this.prisma.bounty.findUnique({
      where: { id },
      include: {
        submissions: { orderBy: { createdAt: 'desc' } },
        _count: { select: { submissions: true } },
      },
    });
    if (!bounty) throw new NotFoundException(`Bounty #${id} not found`);
    return { ...bounty, skills: JSON.parse(bounty.skills), submissionCount: bounty._count.submissions };
  }

  // Anyone can submit work for an open bounty
  async submitWork(bountyId: number, submitter: string, submissionUrl: string, notes: string) {
    const bounty = await this.findOne(bountyId);
    if (bounty.status !== 0) throw new BadRequestException('Bounty is not accepting submissions');

    // Check if this person already submitted
    const existing = await this.prisma.bountySubmission.findFirst({
      where: { bountyId, submitter },
    });
    if (existing) throw new BadRequestException('You already submitted to this bounty');

    return this.prisma.bountySubmission.create({
      data: { bountyId, submitter, submissionUrl, notes },
    });
  }

  // Creator selects a winner from the submissions
  async selectWinner(bountyId: number, submissionId: number, caller: string) {
    const bounty = await this.findOne(bountyId);
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can select a winner');
    if (bounty.status !== 0 && bounty.status !== 1) throw new BadRequestException('Bounty is not open or reviewing');

    const submission = await this.prisma.bountySubmission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.bountyId !== bountyId) throw new BadRequestException('Submission does not belong to this bounty');

    // Mark winning submission
    await this.prisma.bountySubmission.update({
      where: { id: submissionId },
      data: { status: 1 }, // accepted
    });

    // Reject all other submissions
    await this.prisma.bountySubmission.updateMany({
      where: { bountyId, id: { not: submissionId } },
      data: { status: 2 }, // rejected
    });

    // Update bounty: winner set, status = completed, escrow cleared
    return this.prisma.bounty.update({
      where: { id: bountyId },
      data: {
        winner: submission.submitter,
        status: 2, // completed
        escrowBalance: '0',
      },
      include: { submissions: true },
    });
  }

  // Creator rejects a specific submission (doesn't close the bounty)
  async rejectSubmission(bountyId: number, submissionId: number, caller: string) {
    const bounty = await this.findOne(bountyId);
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can reject');

    return this.prisma.bountySubmission.update({
      where: { id: submissionId },
      data: { status: 2 },
    });
  }

  // Creator cancels the bounty (refunds escrow)
  async cancel(bountyId: number, caller: string) {
    const bounty = await this.findOne(bountyId);
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can cancel');
    if (bounty.status === 2) throw new BadRequestException('Cannot cancel a completed bounty');

    // Reject all pending submissions
    await this.prisma.bountySubmission.updateMany({
      where: { bountyId, status: 0 },
      data: { status: 2 },
    });

    return this.prisma.bounty.update({
      where: { id: bountyId },
      data: { status: 3, escrowBalance: '0' },
    });
  }

  // Creator closes submissions and starts reviewing
  async closeSubmissions(bountyId: number, caller: string) {
    const bounty = await this.findOne(bountyId);
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can close submissions');
    if (bounty.status !== 0) throw new BadRequestException('Bounty is not open');

    return this.prisma.bounty.update({
      where: { id: bountyId },
      data: { status: 1 }, // reviewing
    });
  }

  async getSubmissions(bountyId: number) {
    return this.prisma.bountySubmission.findMany({
      where: { bountyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [total, completed, bounties] = await Promise.all([
      this.prisma.bounty.count(),
      this.prisma.bounty.count({ where: { status: 2 } }),
      this.prisma.bounty.findMany({ select: { status: true, escrowBalance: true, rewardAmount: true } }),
    ]);

    let escrowed = 0n;
    let paid = 0n;
    for (const b of bounties) {
      if (b.status < 2) escrowed += BigInt(b.escrowBalance || '0');
      if (b.status === 2) paid += BigInt(b.rewardAmount || '0');
    }

    return {
      totalBountiesPosted: total,
      totalBountiesCompleted: completed,
      totalValueEscrowed: escrowed.toString(),
      totalValuePaid: paid.toString(),
    };
  }
}
