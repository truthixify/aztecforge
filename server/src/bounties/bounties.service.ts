import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Bounty, BountyStats, BountyStatus } from '../common/entities/bounty.entity';
import { CreateBountyDto } from './dto/create-bounty.dto';
import { SubmitWorkDto } from './dto/submit-work.dto';

/**
 * BountiesService manages bounty state.
 *
 * In production, this reads from the Aztec BountyBoard contract via PXE.
 * For now, it uses in-memory storage as a functional prototype that mirrors
 * the contract's state and logic.
 */
@Injectable()
export class BountiesService {
  private bounties: Map<number, Bounty & { title: string; description: string; skills: string[]; difficulty: string }> = new Map();
  private nextId = 0;

  create(dto: CreateBountyDto, creator: string): Bounty & { title: string } {
    const id = this.nextId++;
    const bounty = {
      id,
      creator,
      paymentToken: dto.paymentToken,
      rewardAmount: dto.isAmountPublic !== false ? dto.rewardAmount : '0',
      descriptionHash: this.hash(dto.description),
      deadline: dto.deadlineBlock,
      status: BountyStatus.OPEN,
      isAmountPublic: dto.isAmountPublic !== false,
      claimer: '',
      submissionHash: '',
      escrowBalance: dto.rewardAmount,
      title: dto.title,
      description: dto.description,
      skills: dto.skills ?? [],
      difficulty: dto.difficulty ?? 'medium',
    };
    this.bounties.set(id, bounty);
    return bounty;
  }

  findAll(filters?: { status?: BountyStatus; creator?: string }): (Bounty & { title: string })[] {
    let results = Array.from(this.bounties.values());
    if (filters?.status !== undefined) {
      results = results.filter((b) => b.status === filters.status);
    }
    if (filters?.creator) {
      results = results.filter((b) => b.creator === filters.creator);
    }
    return results;
  }

  findOne(id: number): Bounty & { title: string; description: string; skills: string[]; difficulty: string } {
    const bounty = this.bounties.get(id);
    if (!bounty) throw new NotFoundException(`Bounty #${id} not found`);
    return bounty;
  }

  claim(id: number, claimer: string): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.OPEN) {
      throw new BadRequestException('Bounty is not open');
    }
    bounty.claimer = claimer;
    bounty.status = BountyStatus.CLAIMED;
    return bounty;
  }

  submitWork(id: number, submitter: string, dto: SubmitWorkDto): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.CLAIMED) {
      throw new BadRequestException('Bounty is not claimed');
    }
    if (bounty.claimer !== submitter) {
      throw new BadRequestException('Only the claimer can submit work');
    }
    bounty.submissionHash = this.hash(dto.submissionUrl);
    bounty.status = BountyStatus.SUBMITTED;
    return bounty;
  }

  approve(id: number, caller: string): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.SUBMITTED) {
      throw new BadRequestException('No submission pending');
    }
    if (bounty.creator !== caller) {
      throw new BadRequestException('Only the creator can approve');
    }
    bounty.status = BountyStatus.APPROVED;
    bounty.escrowBalance = '0';
    return bounty;
  }

  reject(id: number, caller: string): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.SUBMITTED) {
      throw new BadRequestException('No submission pending');
    }
    if (bounty.creator !== caller) {
      throw new BadRequestException('Only the creator can reject');
    }
    bounty.status = BountyStatus.OPEN;
    bounty.claimer = '';
    bounty.submissionHash = '';
    return bounty;
  }

  cancel(id: number, caller: string): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.OPEN && bounty.status !== BountyStatus.CLAIMED) {
      throw new BadRequestException('Cannot cancel after submission');
    }
    if (bounty.creator !== caller) {
      throw new BadRequestException('Only the creator can cancel');
    }
    bounty.status = BountyStatus.CANCELLED;
    bounty.escrowBalance = '0';
    return bounty;
  }

  unclaim(id: number, caller: string): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.CLAIMED) {
      throw new BadRequestException('Bounty is not in claimed state');
    }
    if (bounty.claimer !== caller) {
      throw new BadRequestException('Only the claimer can unclaim');
    }
    bounty.status = BountyStatus.OPEN;
    bounty.claimer = '';
    return bounty;
  }

  dispute(id: number, caller: string): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.SUBMITTED) {
      throw new BadRequestException('Can only dispute a submitted bounty');
    }
    if (bounty.creator !== caller && bounty.claimer !== caller) {
      throw new BadRequestException('Not a party to this bounty');
    }
    bounty.status = BountyStatus.DISPUTED;
    return bounty;
  }

  resolveDispute(id: number, approve: boolean): Bounty {
    const bounty = this.findOne(id);
    if (bounty.status !== BountyStatus.DISPUTED) {
      throw new BadRequestException('Not disputed');
    }
    if (approve) {
      bounty.status = BountyStatus.APPROVED;
      bounty.escrowBalance = '0';
    } else {
      bounty.status = BountyStatus.CANCELLED;
      bounty.escrowBalance = '0';
    }
    return bounty;
  }

  getStats(): BountyStats {
    const all = Array.from(this.bounties.values());
    return {
      totalBountiesPosted: all.length,
      totalBountiesCompleted: all.filter((b) => b.status === BountyStatus.APPROVED).length,
      totalValueEscrowed: all
        .filter((b) => b.status < BountyStatus.APPROVED)
        .reduce((sum, b) => sum + BigInt(b.escrowBalance), 0n)
        .toString(),
      totalValuePaid: all
        .filter((b) => b.status === BountyStatus.APPROVED)
        .reduce((sum, b) => sum + BigInt(b.rewardAmount), 0n)
        .toString(),
    };
  }

  private hash(input: string): string {
    // Simple hash for prototype — in production, use poseidon2
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
    }
    return '0x' + Math.abs(h).toString(16).padStart(8, '0');
  }
}
