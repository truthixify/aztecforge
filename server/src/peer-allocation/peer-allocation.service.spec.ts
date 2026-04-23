import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PeerAllocationService } from './peer-allocation.service';

describe('PeerAllocationService', () => {
  let service: PeerAllocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PeerAllocationService],
    }).compile();
    service = module.get<PeerAllocationService>(PeerAllocationService);
  });

  const createCircle = () =>
    service.create(
      {
        name: 'Core Contributors',
        paymentToken: '0xUSDC',
        epochDurationBlocks: 14400,
        givePerMember: 100,
        rewardPoolPerEpoch: '10000',
      },
      '0xadmin',
    );

  describe('circle management', () => {
    it('should create a circle', () => {
      const circle = createCircle();
      expect(circle.id).toBe(0);
      expect(circle.name).toBe('Core Contributors');
      expect(circle.memberCount).toBe(0);
    });

    it('should add and remove members', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      service.addMember(0, '0xadmin', '0xbob');
      expect(service.getMembers(0)).toHaveLength(2);

      service.removeMember(0, '0xadmin', '0xbob');
      expect(service.getMembers(0)).toHaveLength(1);
    });

    it('should reject duplicate members', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      expect(() => service.addMember(0, '0xadmin', '0xalice')).toThrow(BadRequestException);
    });
  });

  describe('GIVE allocation', () => {
    it('should allocate GIVE between members', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      service.addMember(0, '0xadmin', '0xbob');

      service.allocateGive(0, '0xalice', { recipient: '0xbob', amount: 50 });
      const alloc = service.getMemberAllocation(0, 0, '0xbob');
      expect(alloc.giveReceived).toBe(50);
    });

    it('should reject self-give', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      expect(() =>
        service.allocateGive(0, '0xalice', { recipient: '0xalice', amount: 10 }),
      ).toThrow(BadRequestException);
    });

    it('should reject exceeding GIVE budget', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      service.addMember(0, '0xadmin', '0xbob');

      service.allocateGive(0, '0xalice', { recipient: '0xbob', amount: 100 });
      expect(() =>
        service.allocateGive(0, '0xalice', { recipient: '0xbob', amount: 1 }),
      ).toThrow(BadRequestException);
    });
  });

  describe('epoch rewards', () => {
    it('should calculate proportional rewards', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      service.addMember(0, '0xadmin', '0xbob');
      service.addMember(0, '0xadmin', '0xcharlie');

      // Alice gives 60 to Bob, 40 to Charlie
      service.allocateGive(0, '0xalice', { recipient: '0xbob', amount: 60 });
      service.allocateGive(0, '0xalice', { recipient: '0xcharlie', amount: 40 });

      // Bob gives 100 to Charlie
      service.allocateGive(0, '0xbob', { recipient: '0xcharlie', amount: 100 });

      service.advanceEpoch(0, '0xadmin');

      // Total GIVE: Bob=60, Charlie=140, Alice=0. Total=200
      // Bob reward: 10000 * 60 / 200 = 3000
      const bobReward = service.claimEpochReward(0, 0, '0xbob');
      expect(bobReward.reward).toBe('3000');

      // Charlie reward: 10000 * 140 / 200 = 7000
      const charlieReward = service.claimEpochReward(0, 0, '0xcharlie');
      expect(charlieReward.reward).toBe('7000');
    });

    it('should reject double claims', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      service.addMember(0, '0xadmin', '0xbob');
      service.allocateGive(0, '0xalice', { recipient: '0xbob', amount: 50 });
      service.advanceEpoch(0, '0xadmin');
      service.claimEpochReward(0, 0, '0xbob');
      expect(() => service.claimEpochReward(0, 0, '0xbob')).toThrow(BadRequestException);
    });

    it('should reject claiming active epoch', () => {
      createCircle();
      service.addMember(0, '0xadmin', '0xalice');
      expect(() => service.claimEpochReward(0, 0, '0xalice')).toThrow(BadRequestException);
    });
  });
});
