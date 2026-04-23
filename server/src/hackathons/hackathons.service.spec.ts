import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { HackathonStatus } from '../common/entities/hackathon.entity';

describe('HackathonsService', () => {
  let service: HackathonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HackathonsService],
    }).compile();
    service = module.get<HackathonsService>(HackathonsService);
  });

  const defaultDto = {
    name: 'AztecForge Hackathon #1',
    description: 'Build privacy apps on Aztec',
    paymentToken: '0xUSDC',
    totalPrizePool: '50000',
    submissionDeadline: 200000,
    judgingDeadline: 300000,
    tracks: ['DeFi', 'Social', 'Tooling'],
  };

  describe('lifecycle', () => {
    it('should create a hackathon in registration phase', () => {
      const hack = service.create(defaultDto, '0xorg');
      expect(hack.id).toBe(0);
      expect(hack.status).toBe(HackathonStatus.REGISTRATION);
      expect(hack.tracks).toHaveLength(3);
    });

    it('should transition through phases', () => {
      service.create(defaultDto, '0xorg');
      service.startBuildingPhase(0, '0xorg');
      expect(service.findOne(0).status).toBe(HackathonStatus.BUILDING);

      service.startJudgingPhase(0, '0xorg');
      expect(service.findOne(0).status).toBe(HackathonStatus.JUDGING);

      service.finalize(0, '0xorg');
      expect(service.findOne(0).status).toBe(HackathonStatus.COMPLETED);
    });

    it('should reject out-of-order transitions', () => {
      service.create(defaultDto, '0xorg');
      expect(() => service.startJudgingPhase(0, '0xorg')).toThrow(BadRequestException);
    });
  });

  describe('teams', () => {
    it('should register a team', () => {
      service.create(defaultDto, '0xorg');
      const team = service.registerTeam(0, '0xlead', { teamName: 'ZK Warriors' });
      expect(team.teamId).toBe(0);
      expect(team.lead).toBe('0xlead');
      expect(service.findOne(0).teamCount).toBe(1);
    });

    it('should reject registration after building starts', () => {
      service.create(defaultDto, '0xorg');
      service.startBuildingPhase(0, '0xorg');
      expect(() =>
        service.registerTeam(0, '0xlead', { teamName: 'Late Team' }),
      ).toThrow(BadRequestException);
    });
  });

  describe('submissions', () => {
    it('should accept submission from team lead', () => {
      service.create(defaultDto, '0xorg');
      service.registerTeam(0, '0xlead', { teamName: 'ZK Warriors' });
      const sub = service.submitProject(0, '0xlead', {
        teamId: 0,
        trackIndex: 0,
        projectName: 'Private DEX',
        description: 'A DEX with hidden orders',
        repoUrl: 'https://github.com/example/dex',
      });
      expect(sub.submissionId).toBe(0);
      expect(service.findOne(0).submissionCount).toBe(1);
    });
  });

  describe('judging', () => {
    it('should score submissions', () => {
      service.create(defaultDto, '0xorg');
      service.registerTeam(0, '0xlead', { teamName: 'ZK Warriors' });
      service.submitProject(0, '0xlead', {
        teamId: 0,
        trackIndex: 0,
        projectName: 'Test',
        description: 'Test',
        repoUrl: 'url',
      });
      service.addJudge(0, '0xorg', '0xjudge1');
      service.addJudge(0, '0xorg', '0xjudge2');
      service.startBuildingPhase(0, '0xorg');
      service.startJudgingPhase(0, '0xorg');

      service.scoreSubmission(0, 0, '0xjudge1', { score: 80 });
      service.scoreSubmission(0, 0, '0xjudge2', { score: 90 });

      const subs = service.getSubmissions(0);
      expect(subs[0].averageScore).toBe(85);
    });

    it('should reject double scoring', () => {
      service.create(defaultDto, '0xorg');
      service.registerTeam(0, '0xlead', { teamName: 'T' });
      service.submitProject(0, '0xlead', {
        teamId: 0, trackIndex: 0, projectName: 'T', description: 'T', repoUrl: 'u',
      });
      service.addJudge(0, '0xorg', '0xjudge');
      service.startBuildingPhase(0, '0xorg');
      service.startJudgingPhase(0, '0xorg');
      service.scoreSubmission(0, 0, '0xjudge', { score: 80 });
      expect(() =>
        service.scoreSubmission(0, 0, '0xjudge', { score: 90 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('prizes', () => {
    it('should award and claim prizes', () => {
      service.create(defaultDto, '0xorg');
      service.registerTeam(0, '0xlead', { teamName: 'Winners' });
      service.startBuildingPhase(0, '0xorg');
      service.startJudgingPhase(0, '0xorg');
      service.finalize(0, '0xorg');

      const prize = service.awardPrize(0, '0xorg', {
        teamId: 0, placement: 1, prizeAmount: '25000',
      });
      expect(prize.amount).toBe('25000');

      const claimed = service.claimPrize(0, 0, '0xlead');
      expect(claimed.claimed).toBe(true);
    });

    it('should reject double claim', () => {
      service.create(defaultDto, '0xorg');
      service.registerTeam(0, '0xlead', { teamName: 'W' });
      service.startBuildingPhase(0, '0xorg');
      service.startJudgingPhase(0, '0xorg');
      service.finalize(0, '0xorg');
      service.awardPrize(0, '0xorg', { teamId: 0, placement: 1, prizeAmount: '10000' });
      service.claimPrize(0, 0, '0xlead');
      expect(() => service.claimPrize(0, 0, '0xlead')).toThrow(BadRequestException);
    });
  });
});
