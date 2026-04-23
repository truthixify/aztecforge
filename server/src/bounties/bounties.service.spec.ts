import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BountiesService } from './bounties.service';
import { BountyStatus } from '../common/entities/bounty.entity';

describe('BountiesService', () => {
  let service: BountiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BountiesService],
    }).compile();

    service = module.get<BountiesService>(BountiesService);
  });

  const defaultDto = {
    paymentToken: '0xtoken',
    rewardAmount: '1000',
    title: 'Build a Noir library',
    description: 'Implement Merkle proof verification in Noir',
    deadlineBlock: 100000,
    isAmountPublic: true,
    skills: ['noir', 'zk'],
    difficulty: 'hard',
  };

  describe('create', () => {
    it('should create a bounty with open status', () => {
      const bounty = service.create(defaultDto, '0xcreator');
      expect(bounty.id).toBe(0);
      expect(bounty.status).toBe(BountyStatus.OPEN);
      expect(bounty.creator).toBe('0xcreator');
      expect(bounty.rewardAmount).toBe('1000');
      expect(bounty.title).toBe('Build a Noir library');
    });

    it('should hide amount when isAmountPublic is false', () => {
      const bounty = service.create({ ...defaultDto, isAmountPublic: false }, '0xcreator');
      expect(bounty.rewardAmount).toBe('0');
      expect(bounty.isAmountPublic).toBe(false);
    });

    it('should auto-increment IDs', () => {
      const b1 = service.create(defaultDto, '0xcreator');
      const b2 = service.create(defaultDto, '0xcreator');
      expect(b1.id).toBe(0);
      expect(b2.id).toBe(1);
    });
  });

  describe('claim', () => {
    it('should allow claiming an open bounty', () => {
      service.create(defaultDto, '0xcreator');
      const bounty = service.claim(0, '0xclaimer');
      expect(bounty.status).toBe(BountyStatus.CLAIMED);
      expect(bounty.claimer).toBe('0xclaimer');
    });

    it('should reject claiming a non-open bounty', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      expect(() => service.claim(0, '0xother')).toThrow(BadRequestException);
    });
  });

  describe('submitWork', () => {
    it('should allow claimer to submit work', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      const bounty = service.submitWork(0, '0xclaimer', {
        submissionUrl: 'https://github.com/example',
        submissionNotes: 'Done',
      });
      expect(bounty.status).toBe(BountyStatus.SUBMITTED);
    });

    it('should reject submission from non-claimer', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      expect(() =>
        service.submitWork(0, '0xother', {
          submissionUrl: 'url',
          submissionNotes: 'notes',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve and update status', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      service.submitWork(0, '0xclaimer', {
        submissionUrl: 'url',
        submissionNotes: 'notes',
      });
      const bounty = service.approve(0, '0xcreator');
      expect(bounty.status).toBe(BountyStatus.APPROVED);
      expect(bounty.escrowBalance).toBe('0');
    });

    it('should reject approval from non-creator', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      service.submitWork(0, '0xclaimer', {
        submissionUrl: 'url',
        submissionNotes: 'notes',
      });
      expect(() => service.approve(0, '0xother')).toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reopen bounty after rejection', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      service.submitWork(0, '0xclaimer', {
        submissionUrl: 'url',
        submissionNotes: 'notes',
      });
      const bounty = service.reject(0, '0xcreator');
      expect(bounty.status).toBe(BountyStatus.OPEN);
      expect(bounty.claimer).toBe('');
    });
  });

  describe('cancel', () => {
    it('should cancel an open bounty', () => {
      service.create(defaultDto, '0xcreator');
      const bounty = service.cancel(0, '0xcreator');
      expect(bounty.status).toBe(BountyStatus.CANCELLED);
    });

    it('should not cancel after submission', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      service.submitWork(0, '0xclaimer', {
        submissionUrl: 'url',
        submissionNotes: 'notes',
      });
      expect(() => service.cancel(0, '0xcreator')).toThrow(BadRequestException);
    });
  });

  describe('unclaim', () => {
    it('should reopen after unclaim', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      const bounty = service.unclaim(0, '0xclaimer');
      expect(bounty.status).toBe(BountyStatus.OPEN);
      expect(bounty.claimer).toBe('');
    });
  });

  describe('dispute & resolve', () => {
    it('should dispute and resolve in favor of claimer', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      service.submitWork(0, '0xclaimer', {
        submissionUrl: 'url',
        submissionNotes: 'notes',
      });
      service.dispute(0, '0xcreator');
      const bounty = service.resolveDispute(0, true);
      expect(bounty.status).toBe(BountyStatus.APPROVED);
    });

    it('should resolve in favor of creator (refund)', () => {
      service.create(defaultDto, '0xcreator');
      service.claim(0, '0xclaimer');
      service.submitWork(0, '0xclaimer', {
        submissionUrl: 'url',
        submissionNotes: 'notes',
      });
      service.dispute(0, '0xclaimer');
      const bounty = service.resolveDispute(0, false);
      expect(bounty.status).toBe(BountyStatus.CANCELLED);
    });
  });

  describe('findAll', () => {
    it('should filter by status', () => {
      service.create(defaultDto, '0xcreator');
      service.create(defaultDto, '0xcreator');
      service.claim(1, '0xclaimer');
      const open = service.findAll({ status: BountyStatus.OPEN });
      expect(open).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return correct aggregates', () => {
      service.create(defaultDto, '0xcreator');
      service.create({ ...defaultDto, rewardAmount: '2000' }, '0xcreator');
      const stats = service.getStats();
      expect(stats.totalBountiesPosted).toBe(2);
      expect(stats.totalBountiesCompleted).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should throw on non-existent bounty', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });
  });
});
