import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Circle, MemberAllocation } from '../common/entities/peer-allocation.entity';
import { CreateCircleDto, AllocateGiveDto } from './dto/peer-allocation.dto';

@Injectable()
export class PeerAllocationService {
  private circles: Map<number, Circle & { name: string; members: Set<string> }> = new Map();
  private giveAllocations: Map<string, number> = new Map(); // `circleId:epoch:giver:recipient` -> amount
  private giveSpent: Map<string, number> = new Map(); // `circleId:epoch:giver` -> total spent
  private giveReceived: Map<string, number> = new Map(); // `circleId:epoch:member` -> total received
  private epochClaimed: Map<string, boolean> = new Map(); // `circleId:epoch:member` -> claimed
  private nextId = 0;

  create(dto: CreateCircleDto, admin: string): Circle & { name: string } {
    const id = this.nextId++;
    const circle = {
      id,
      admin,
      name: dto.name,
      paymentToken: dto.paymentToken,
      epochDuration: dto.epochDurationBlocks,
      currentEpoch: 0,
      memberCount: 0,
      givePerMember: dto.givePerMember,
      rewardPool: dto.rewardPoolPerEpoch,
      totalDistributed: '0',
      status: 0,
      members: new Set<string>(),
    };
    this.circles.set(id, circle);
    return circle;
  }

  findAll(): (Circle & { name: string })[] {
    return Array.from(this.circles.values());
  }

  findOne(id: number): Circle & { name: string } {
    const circle = this.circles.get(id);
    if (!circle) throw new NotFoundException(`Circle #${id} not found`);
    return circle;
  }

  private getCircle(id: number) {
    const circle = this.circles.get(id);
    if (!circle) throw new NotFoundException(`Circle #${id} not found`);
    return circle;
  }

  addMember(circleId: number, admin: string, member: string): Circle {
    const circle = this.getCircle(circleId);
    if (circle.admin !== admin) throw new BadRequestException('Not admin');
    if (circle.members.has(member)) throw new BadRequestException('Already a member');
    circle.members.add(member);
    circle.memberCount++;
    return circle;
  }

  removeMember(circleId: number, admin: string, member: string): Circle {
    const circle = this.getCircle(circleId);
    if (circle.admin !== admin) throw new BadRequestException('Not admin');
    if (!circle.members.has(member)) throw new BadRequestException('Not a member');
    circle.members.delete(member);
    circle.memberCount--;
    return circle;
  }

  allocateGive(circleId: number, giver: string, dto: AllocateGiveDto): void {
    const circle = this.getCircle(circleId);
    if (!circle.members.has(giver)) throw new BadRequestException('Not a member');
    if (!circle.members.has(dto.recipient)) throw new BadRequestException('Recipient not a member');
    if (giver === dto.recipient) throw new BadRequestException('Cannot give to yourself');

    const epoch = circle.currentEpoch;
    const spentKey = `${circleId}:${epoch}:${giver}`;
    const currentSpent = this.giveSpent.get(spentKey) ?? 0;
    if (currentSpent + dto.amount > circle.givePerMember) {
      throw new BadRequestException('Exceeds GIVE budget');
    }

    const allocKey = `${circleId}:${epoch}:${giver}:${dto.recipient}`;
    const existing = this.giveAllocations.get(allocKey) ?? 0;
    this.giveAllocations.set(allocKey, existing + dto.amount);
    this.giveSpent.set(spentKey, currentSpent + dto.amount);

    const recvKey = `${circleId}:${epoch}:${dto.recipient}`;
    const received = this.giveReceived.get(recvKey) ?? 0;
    this.giveReceived.set(recvKey, received + dto.amount);
  }

  advanceEpoch(circleId: number, admin: string): Circle {
    const circle = this.getCircle(circleId);
    if (circle.admin !== admin) throw new BadRequestException('Not admin');
    circle.currentEpoch++;
    return circle;
  }

  claimEpochReward(circleId: number, epoch: number, member: string): { reward: string } {
    const circle = this.getCircle(circleId);
    if (epoch >= circle.currentEpoch) throw new BadRequestException('Epoch not ended');

    const claimKey = `${circleId}:${epoch}:${member}`;
    if (this.epochClaimed.get(claimKey)) throw new BadRequestException('Already claimed');

    const received = this.giveReceived.get(claimKey) ?? 0;
    const totalGive = this.getEpochTotalGive(circleId, epoch);

    let reward = '0';
    if (totalGive > 0) {
      reward = ((BigInt(circle.rewardPool) * BigInt(received)) / BigInt(totalGive)).toString();
    }

    this.epochClaimed.set(claimKey, true);
    circle.totalDistributed = (BigInt(circle.totalDistributed) + BigInt(reward)).toString();
    return { reward };
  }

  getMemberAllocation(circleId: number, epoch: number, member: string): MemberAllocation {
    const recvKey = `${circleId}:${epoch}:${member}`;
    const spentKey = `${circleId}:${epoch}:${member}`;
    return {
      circleId,
      epoch,
      member,
      giveReceived: this.giveReceived.get(recvKey) ?? 0,
      giveSpent: this.giveSpent.get(spentKey) ?? 0,
      claimed: this.epochClaimed.get(recvKey) ?? false,
    };
  }

  getMembers(circleId: number): string[] {
    const circle = this.circles.get(circleId);
    if (!circle) throw new NotFoundException(`Circle #${circleId} not found`);
    return Array.from(circle.members);
  }

  private getEpochTotalGive(circleId: number, epoch: number): number {
    let total = 0;
    const circle = this.circles.get(circleId);
    if (!circle) return 0;
    for (const member of circle.members) {
      total += this.giveReceived.get(`${circleId}:${epoch}:${member}`) ?? 0;
    }
    return total;
  }
}
