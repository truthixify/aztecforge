import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBountyDto } from './dto/create-bounty.dto';
import { SubmitWorkDto } from './dto/submit-work.dto';

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
        status: 0,
      },
    });
  }

  async findAll(filters?: { status?: number; creator?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status !== undefined) where.status = filters.status;
    if (filters?.creator) where.creator = filters.creator;

    const bounties = await this.prisma.bounty.findMany({ where, orderBy: { createdAt: 'desc' } });
    return bounties.map((b) => ({ ...b, skills: JSON.parse(b.skills) }));
  }

  async findOne(id: number) {
    const bounty = await this.prisma.bounty.findUnique({ where: { id } });
    if (!bounty) throw new NotFoundException(`Bounty #${id} not found`);
    return { ...bounty, skills: JSON.parse(bounty.skills) };
  }

  async claim(id: number, claimer: string) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 0) throw new BadRequestException('Bounty is not open');
    return this.prisma.bounty.update({
      where: { id },
      data: { claimer, status: 1 },
    });
  }

  async submitWork(id: number, submitter: string, dto: SubmitWorkDto) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 1) throw new BadRequestException('Bounty is not claimed');
    if (bounty.claimer !== submitter) throw new BadRequestException('Only the claimer can submit work');
    return this.prisma.bounty.update({
      where: { id },
      data: {
        submissionUrl: dto.submissionUrl,
        submissionNotes: dto.submissionNotes,
        submissionHash: dto.submissionUrl.slice(0, 20),
        status: 2,
      },
    });
  }

  async approve(id: number, caller: string) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 2) throw new BadRequestException('No submission pending');
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can approve');
    return this.prisma.bounty.update({
      where: { id },
      data: { status: 3, escrowBalance: '0' },
    });
  }

  async reject(id: number, caller: string) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 2) throw new BadRequestException('No submission pending');
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can reject');
    return this.prisma.bounty.update({
      where: { id },
      data: { status: 0, claimer: '', submissionHash: '', submissionUrl: '', submissionNotes: '' },
    });
  }

  async cancel(id: number, caller: string) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 0 && bounty.status !== 1) throw new BadRequestException('Cannot cancel after submission');
    if (bounty.creator !== caller) throw new BadRequestException('Only the creator can cancel');
    return this.prisma.bounty.update({
      where: { id },
      data: { status: 4, escrowBalance: '0' },
    });
  }

  async unclaim(id: number, caller: string) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 1) throw new BadRequestException('Bounty is not in claimed state');
    if (bounty.claimer !== caller) throw new BadRequestException('Only the claimer can unclaim');
    return this.prisma.bounty.update({
      where: { id },
      data: { status: 0, claimer: '' },
    });
  }

  async dispute(id: number, caller: string) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 2) throw new BadRequestException('Can only dispute a submitted bounty');
    if (bounty.creator !== caller && bounty.claimer !== caller) {
      throw new BadRequestException('Not a party to this bounty');
    }
    return this.prisma.bounty.update({ where: { id }, data: { status: 5 } });
  }

  async resolveDispute(id: number, approve: boolean) {
    const bounty = await this.findOne(id);
    if (bounty.status !== 5) throw new BadRequestException('Not disputed');
    return this.prisma.bounty.update({
      where: { id },
      data: approve ? { status: 3, escrowBalance: '0' } : { status: 4, escrowBalance: '0' },
    });
  }

  async getStats() {
    const [total, completed, bounties] = await Promise.all([
      this.prisma.bounty.count(),
      this.prisma.bounty.count({ where: { status: 3 } }),
      this.prisma.bounty.findMany({ select: { status: true, escrowBalance: true, rewardAmount: true } }),
    ]);

    let escrowed = 0n;
    let paid = 0n;
    for (const b of bounties) {
      if (b.status < 3) escrowed += BigInt(b.escrowBalance || '0');
      if (b.status === 3) paid += BigInt(b.rewardAmount || '0');
    }

    return {
      totalBountiesPosted: total,
      totalBountiesCompleted: completed,
      totalValueEscrowed: escrowed.toString(),
      totalValuePaid: paid.toString(),
    };
  }
}
