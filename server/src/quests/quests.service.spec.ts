import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { QuestStatus } from '../common/entities/quest.entity';

describe('QuestsService', () => {
  let service: QuestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestsService],
    }).compile();
    service = module.get<QuestsService>(QuestsService);
  });

  const defaultDto = {
    name: 'Deploy your first Noir contract',
    description: 'Follow the tutorial and deploy a counter contract',
    questType: 0,
    paymentToken: '0xUSDC',
    rewardPerCompletion: '100',
    maxCompletions: 50,
    deadlineBlock: 200000,
  };

  describe('create', () => {
    it('should create an active quest', () => {
      const quest = service.create(defaultDto, '0xcreator');
      expect(quest.id).toBe(0);
      expect(quest.status).toBe(QuestStatus.ACTIVE);
      expect(quest.completionCount).toBe(0);
    });
  });

  describe('complete', () => {
    it('should complete type 0 quests directly', () => {
      service.create(defaultDto, '0xcreator');
      const quest = service.complete(0, '0xuser', 'https://proof.com/tx');
      expect(quest.completionCount).toBe(1);
    });

    it('should reject type 1+ quests from complete()', () => {
      service.create({ ...defaultDto, questType: 1 }, '0xcreator');
      expect(() => service.complete(0, '0xuser', 'url')).toThrow(BadRequestException);
    });

    it('should reject double completion', () => {
      service.create(defaultDto, '0xcreator');
      service.complete(0, '0xuser', 'url');
      expect(() => service.complete(0, '0xuser', 'url')).toThrow(BadRequestException);
    });

    it('should auto-deactivate at max completions', () => {
      service.create({ ...defaultDto, maxCompletions: 2 }, '0xcreator');
      service.complete(0, '0xuser1', 'url1');
      service.complete(0, '0xuser2', 'url2');
      expect(service.findOne(0).status).toBe(QuestStatus.INACTIVE);
    });

    it('should allow unlimited completions when max is 0', () => {
      service.create({ ...defaultDto, maxCompletions: 0 }, '0xcreator');
      for (let i = 0; i < 100; i++) {
        service.complete(0, `0xuser${i}`, `url${i}`);
      }
      expect(service.findOne(0).completionCount).toBe(100);
      expect(service.findOne(0).status).toBe(QuestStatus.ACTIVE);
    });
  });

  describe('verifyCompletion', () => {
    it('should allow verifier to approve completion', () => {
      service.create({ ...defaultDto, questType: 1 }, '0xcreator');
      const quest = service.verifyCompletion(0, '0xcreator', '0xcontributor', 'proof-url');
      expect(quest.completionCount).toBe(1);
      expect(service.hasCompleted(0, '0xcontributor')).toBe(true);
    });

    it('should reject non-verifier', () => {
      service.create({ ...defaultDto, questType: 1 }, '0xcreator');
      expect(() =>
        service.verifyCompletion(0, '0xrandom', '0xcontributor', 'url'),
      ).toThrow(BadRequestException);
    });

    it('should allow added verifiers', () => {
      service.create({ ...defaultDto, questType: 2 }, '0xcreator');
      service.addVerifier(0, '0xcreator', '0xreviewer');
      const quest = service.verifyCompletion(0, '0xreviewer', '0xdev', 'url');
      expect(quest.completionCount).toBe(1);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a quest', () => {
      service.create(defaultDto, '0xcreator');
      service.deactivate(0, '0xcreator');
      expect(service.findOne(0).status).toBe(QuestStatus.INACTIVE);
    });

    it('should reject completion of inactive quest', () => {
      service.create(defaultDto, '0xcreator');
      service.deactivate(0, '0xcreator');
      expect(() => service.complete(0, '0xuser', 'url')).toThrow(BadRequestException);
    });
  });

  describe('getCompletions', () => {
    it('should list completions for a quest', () => {
      service.create(defaultDto, '0xcreator');
      service.complete(0, '0xuser1', 'url1');
      service.complete(0, '0xuser2', 'url2');
      const completions = service.getCompletions(0);
      expect(completions).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should aggregate stats', () => {
      service.create(defaultDto, '0xcreator');
      service.create({ ...defaultDto, rewardPerCompletion: '200' }, '0xcreator');
      service.complete(0, '0xu1', 'url');
      service.complete(1, '0xu2', 'url');
      const stats = service.getStats();
      expect(stats.totalQuestsCreated).toBe(2);
      expect(stats.totalQuestsCompleted).toBe(2);
      expect(stats.totalRewardsPaid).toBe('300');
    });
  });

  it('should throw on unknown quest', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });
});
