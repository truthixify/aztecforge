import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContributorReputation,
  ReputationGate,
  ReputationTier,
} from '../common/entities/reputation.entity';

@Injectable()
export class ReputationService {
  private contributors: Map<string, ContributorReputation> = new Map();
  private gates: Map<number, ReputationGate> = new Map();
  private nextGateId = 0;

  getOrCreate(address: string): ContributorReputation {
    let rep = this.contributors.get(address);
    if (!rep) {
      rep = {
        address,
        score: 0,
        tier: ReputationTier.NEWCOMER,
        bountiesCompleted: 0,
        bountiesTotalEarned: '0',
        hackathonsParticipated: 0,
        hackathonsWon: 0,
        grantsReceived: 0,
        grantsTotalEarned: '0',
        milestonesDelivered: 0,
        questsCompleted: 0,
        peerGiveReceived: '0',
        peerEpochsParticipated: 0,
      };
      this.contributors.set(address, rep);
    }
    return rep;
  }

  findOne(address: string): ContributorReputation {
    const rep = this.contributors.get(address);
    if (!rep) throw new NotFoundException(`Contributor ${address} not found`);
    return rep;
  }

  findAll(): ContributorReputation[] {
    return Array.from(this.contributors.values());
  }

  getLeaderboard(limit = 20): ContributorReputation[] {
    return Array.from(this.contributors.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  recordBountyCompletion(address: string, earnedAmount: string): ContributorReputation {
    const rep = this.getOrCreate(address);
    rep.bountiesCompleted++;
    rep.bountiesTotalEarned = (BigInt(rep.bountiesTotalEarned) + BigInt(earnedAmount)).toString();
    this.recomputeScore(rep);
    return rep;
  }

  recordHackathonResult(address: string, won: boolean): ContributorReputation {
    const rep = this.getOrCreate(address);
    rep.hackathonsParticipated++;
    if (won) rep.hackathonsWon++;
    this.recomputeScore(rep);
    return rep;
  }

  recordGrantDelivery(address: string, grantAmount: string): ContributorReputation {
    const rep = this.getOrCreate(address);
    rep.grantsReceived++;
    rep.grantsTotalEarned = (BigInt(rep.grantsTotalEarned) + BigInt(grantAmount)).toString();
    rep.milestonesDelivered++;
    this.recomputeScore(rep);
    return rep;
  }

  recordPeerRecognition(address: string, giveAmount: string): ContributorReputation {
    const rep = this.getOrCreate(address);
    rep.peerGiveReceived = (BigInt(rep.peerGiveReceived) + BigInt(giveAmount)).toString();
    rep.peerEpochsParticipated++;
    this.recomputeScore(rep);
    return rep;
  }

  recordQuestCompletion(address: string): ContributorReputation {
    const rep = this.getOrCreate(address);
    rep.questsCompleted++;
    this.recomputeScore(rep);
    return rep;
  }

  createGate(config: Omit<ReputationGate, 'id' | 'active'>): ReputationGate {
    const gate: ReputationGate = { ...config, id: this.nextGateId++, active: true };
    this.gates.set(gate.id, gate);
    return gate;
  }

  checkGate(address: string, gateId: number): boolean {
    const gate = this.gates.get(gateId);
    if (!gate || !gate.active) return false;
    const rep = this.contributors.get(address);
    if (!rep) return false;
    return (
      rep.bountiesCompleted >= gate.minBounties &&
      rep.hackathonsWon >= gate.minHackathonWins &&
      rep.tier >= gate.minTier
    );
  }

  getTotalContributors(): number {
    return this.contributors.size;
  }

  private recomputeScore(rep: ContributorReputation): void {
    rep.score =
      rep.bountiesCompleted * 10 +
      rep.hackathonsWon * 50 +
      rep.grantsReceived * 30 +
      rep.milestonesDelivered * 20 +
      rep.questsCompleted * 5 +
      rep.peerEpochsParticipated * 15;

    if (rep.score >= 500) rep.tier = ReputationTier.CORE;
    else if (rep.score >= 200) rep.tier = ReputationTier.EXPERT;
    else if (rep.score >= 50) rep.tier = ReputationTier.BUILDER;
    else if (rep.score >= 10) rep.tier = ReputationTier.CONTRIBUTOR;
    else rep.tier = ReputationTier.NEWCOMER;
  }
}
