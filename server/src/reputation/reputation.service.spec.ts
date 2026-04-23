import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationTier } from '../common/entities/reputation.entity';

describe('ReputationService', () => {
  let service: ReputationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReputationService],
    }).compile();
    service = module.get<ReputationService>(ReputationService);
  });

  it('should create a newcomer on first interaction', () => {
    const rep = service.getOrCreate('0xuser');
    expect(rep.tier).toBe(ReputationTier.NEWCOMER);
    expect(rep.score).toBe(0);
  });

  it('should increment bounty count and recompute tier', () => {
    service.recordBountyCompletion('0xuser', '1000');
    const rep = service.findOne('0xuser');
    expect(rep.bountiesCompleted).toBe(1);
    expect(rep.score).toBe(10);
    expect(rep.tier).toBe(ReputationTier.CONTRIBUTOR);
  });

  it('should reach builder tier at score 50', () => {
    for (let i = 0; i < 5; i++) {
      service.recordBountyCompletion('0xuser', '500');
    }
    const rep = service.findOne('0xuser');
    expect(rep.score).toBe(50);
    expect(rep.tier).toBe(ReputationTier.BUILDER);
  });

  it('should count hackathon wins with higher weight', () => {
    service.recordHackathonResult('0xuser', true);
    const rep = service.findOne('0xuser');
    expect(rep.score).toBe(50);
    expect(rep.tier).toBe(ReputationTier.BUILDER);
  });

  it('should aggregate multiple reputation sources', () => {
    service.recordBountyCompletion('0xuser', '1000');
    service.recordHackathonResult('0xuser', true);
    service.recordGrantDelivery('0xuser', '5000');
    service.recordQuestCompletion('0xuser');
    service.recordPeerRecognition('0xuser', '100');
    const rep = service.findOne('0xuser');
    // 10 + 50 + 30 + 20 + 5 + 15 = 130
    expect(rep.score).toBe(130);
    expect(rep.tier).toBe(ReputationTier.BUILDER);
  });

  it('should return leaderboard sorted by score', () => {
    service.recordBountyCompletion('0xuser1', '1000');
    service.recordHackathonResult('0xuser2', true);
    const board = service.getLeaderboard();
    expect(board[0].address).toBe('0xuser2');
    expect(board[1].address).toBe('0xuser1');
  });

  it('should check gate correctly', () => {
    const gate = service.createGate({
      minBounties: 5,
      minHackathonWins: 0,
      minTier: ReputationTier.BUILDER,
      minTenureBlocks: 0,
    });
    expect(service.checkGate('0xuser', gate.id)).toBe(false);
    for (let i = 0; i < 5; i++) {
      service.recordBountyCompletion('0xuser', '500');
    }
    expect(service.checkGate('0xuser', gate.id)).toBe(true);
  });

  it('should throw on unknown contributor', () => {
    expect(() => service.findOne('0xunknown')).toThrow(NotFoundException);
  });
});
