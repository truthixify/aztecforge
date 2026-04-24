import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCircleDto, AllocateGiveDto } from './dto/peer-allocation.dto';
import type { MemberAllocation } from '../common/entities/peer-allocation.entity';

@Injectable()
export class PeerAllocationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCircleDto, admin: string) {
    return this.prisma.circle.create({
      data: {
        name: dto.name,
        paymentToken: dto.paymentToken,
        epochDuration: dto.epochDurationBlocks,
        givePerMember: dto.givePerMember,
        rewardPool: dto.rewardPoolPerEpoch,
        admin,
      },
    });
  }

  async findAll() {
    return this.prisma.circle.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const circle = await this.prisma.circle.findUnique({ where: { id } });
    if (!circle) throw new NotFoundException(`Circle #${id} not found`);
    return circle;
  }

  async addMember(circleId: number, admin: string, member: string) {
    const circle = await this.findOne(circleId);
    if (circle.admin !== admin) throw new BadRequestException('Not admin');
    const members: string[] = JSON.parse(circle.members);
    if (members.includes(member)) throw new BadRequestException('Already a member');
    members.push(member);
    return this.prisma.circle.update({
      where: { id: circleId },
      data: { members: JSON.stringify(members), memberCount: members.length },
    });
  }

  async removeMember(circleId: number, admin: string, member: string) {
    const circle = await this.findOne(circleId);
    if (circle.admin !== admin) throw new BadRequestException('Not admin');
    const members: string[] = JSON.parse(circle.members);
    const filtered = members.filter((m) => m !== member);
    return this.prisma.circle.update({
      where: { id: circleId },
      data: { members: JSON.stringify(filtered), memberCount: filtered.length },
    });
  }

  async allocateGive(circleId: number, _giver: string, _dto: AllocateGiveDto) {
    // GIVE tracking is on-chain; server stores metadata
    return;
  }

  async advanceEpoch(circleId: number, admin: string) {
    const circle = await this.findOne(circleId);
    if (circle.admin !== admin) throw new BadRequestException('Not admin');
    return this.prisma.circle.update({
      where: { id: circleId },
      data: { currentEpoch: circle.currentEpoch + 1 },
    });
  }

  async claimEpochReward(_circleId: number, _epoch: number, _member: string) {
    // On-chain operation
    return { reward: '0' };
  }

  async getMemberAllocation(circleId: number, epoch: number, member: string): Promise<MemberAllocation> {
    return { circleId, epoch, member, giveReceived: 0, giveSpent: 0, claimed: false };
  }

  async getMembers(circleId: number): Promise<string[]> {
    const circle = await this.findOne(circleId);
    return JSON.parse(circle.members);
  }
}
