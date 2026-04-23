import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FundingPoolsService } from './funding-pools.service';
import { PoolStatus } from '../common/entities/funding-pool.entity';

describe('FundingPoolsService', () => {
  let service: FundingPoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FundingPoolsService],
    }).compile();
    service = module.get<FundingPoolsService>(FundingPoolsService);
  });

  const defaultDto = {
    paymentToken: '0xUSDC',
    purpose: 'Fund Aztec developer tooling',
    poolType: 0,
  };

  describe('create', () => {
    it('should create a pool', () => {
      const pool = service.create(defaultDto, '0xcurator');
      expect(pool.id).toBe(0);
      expect(pool.curator).toBe('0xcurator');
      expect(pool.status).toBe(PoolStatus.ACTIVE);
    });
  });

  describe('deposit', () => {
    it('should track deposits and update aggregates', () => {
      service.create(defaultDto, '0xcurator');
      const pool = service.deposit(0, '0xdepositor', { amount: '1000' });
      expect(pool.totalDeposited).toBe('1000');
      expect(pool.contributorCount).toBe(1);
    });

    it('should increment existing deposit', () => {
      service.create(defaultDto, '0xcurator');
      service.deposit(0, '0xdepositor', { amount: '1000' });
      const pool = service.deposit(0, '0xdepositor', { amount: '500' });
      expect(pool.totalDeposited).toBe('1500');
      expect(pool.contributorCount).toBe(1);
    });

    it('should reject deposits to inactive pool', () => {
      service.create(defaultDto, '0xcurator');
      service.pausePool(0, '0xcurator');
      expect(() => service.deposit(0, '0xdepositor', { amount: '1000' })).toThrow(BadRequestException);
    });
  });

  describe('allocate', () => {
    it('should allocate from pool balance', () => {
      service.create(defaultDto, '0xcurator');
      service.deposit(0, '0xdepositor', { amount: '5000' });
      const pool = service.allocate(0, '0xcurator', {
        recipient: '0xrecipient',
        amount: '2000',
        reason: 'Milestone 1',
      });
      expect(pool.totalDisbursed).toBe('2000');
      expect(pool.recipientCount).toBe(1);
    });

    it('should reject allocation exceeding balance', () => {
      service.create(defaultDto, '0xcurator');
      service.deposit(0, '0xdepositor', { amount: '1000' });
      expect(() =>
        service.allocate(0, '0xcurator', {
          recipient: '0xrecipient',
          amount: '2000',
          reason: 'Too much',
        }),
      ).toThrow(BadRequestException);
    });

    it('should reject non-curator allocation', () => {
      service.create(defaultDto, '0xcurator');
      service.deposit(0, '0xdepositor', { amount: '5000' });
      expect(() =>
        service.allocate(0, '0xrandom', {
          recipient: '0xrecipient',
          amount: '1000',
          reason: 'test',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('pool lifecycle', () => {
    it('should pause and resume', () => {
      service.create(defaultDto, '0xcurator');
      service.pausePool(0, '0xcurator');
      expect(service.findOne(0).status).toBe(PoolStatus.PAUSED);
      service.resumePool(0, '0xcurator');
      expect(service.findOne(0).status).toBe(PoolStatus.ACTIVE);
    });

    it('should close permanently', () => {
      service.create(defaultDto, '0xcurator');
      service.closePool(0, '0xcurator');
      expect(service.findOne(0).status).toBe(PoolStatus.CLOSED);
    });
  });

  describe('getStats', () => {
    it('should aggregate across pools', () => {
      service.create(defaultDto, '0xcurator');
      service.create(defaultDto, '0xcurator2');
      service.deposit(0, '0xd1', { amount: '1000' });
      service.deposit(1, '0xd2', { amount: '2000' });
      const stats = service.getStats();
      expect(stats.totalPoolsCreated).toBe(2);
      expect(stats.totalValueDeposited).toBe('3000');
    });
  });

  it('should throw on unknown pool', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });
});
