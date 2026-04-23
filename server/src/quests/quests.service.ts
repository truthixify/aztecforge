import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Quest, QuestStatus, QuestStats } from '../common/entities/quest.entity';
import { CreateQuestDto } from './dto/quest.dto';

@Injectable()
export class QuestsService {
  private quests: Map<number, Quest & { name: string; description: string; verifiers: Set<string> }> = new Map();
  private completions: Map<string, { verificationUrl: string; completedAt: number }> = new Map(); // `questId:completer`
  private nextId = 0;

  create(dto: CreateQuestDto, creator: string): Quest & { name: string } {
    const id = this.nextId++;
    const quest = {
      id,
      creator,
      name: dto.name,
      description: dto.description,
      nameHash: '',
      descriptionHash: '',
      questType: dto.questType,
      paymentToken: dto.paymentToken,
      rewardPerCompletion: dto.rewardPerCompletion,
      maxCompletions: dto.maxCompletions,
      completionCount: 0,
      deadline: dto.deadlineBlock,
      status: QuestStatus.ACTIVE,
      reputationGateId: dto.reputationGateId ?? 0,
      verifiers: new Set<string>([creator]),
    };
    this.quests.set(id, quest);
    return quest;
  }

  findAll(filters?: { status?: QuestStatus; creator?: string }): (Quest & { name: string })[] {
    let results = Array.from(this.quests.values());
    if (filters?.status !== undefined) results = results.filter((q) => q.status === filters.status);
    if (filters?.creator) results = results.filter((q) => q.creator === filters.creator);
    return results;
  }

  findOne(id: number): Quest & { name: string; description: string } {
    const quest = this.quests.get(id);
    if (!quest) throw new NotFoundException(`Quest #${id} not found`);
    return quest;
  }

  addVerifier(questId: number, creator: string, verifier: string): void {
    const quest = this.quests.get(questId);
    if (!quest) throw new NotFoundException(`Quest #${questId} not found`);
    if (quest.creator !== creator) throw new BadRequestException('Not the creator');
    quest.verifiers.add(verifier);
  }

  complete(questId: number, completer: string, verificationUrl: string): Quest {
    const quest = this.quests.get(questId)!;
    if (!quest) throw new NotFoundException(`Quest #${questId} not found`);
    if (quest.questType !== 0) throw new BadRequestException('Requires verifier approval');
    return this.processCompletion(questId, completer, verificationUrl);
  }

  verifyCompletion(questId: number, verifier: string, completer: string, verificationUrl: string): Quest {
    const quest = this.quests.get(questId)!;
    if (!quest) throw new NotFoundException(`Quest #${questId} not found`);
    if (!quest.verifiers.has(verifier)) throw new BadRequestException('Not a verifier');
    return this.processCompletion(questId, completer, verificationUrl);
  }

  deactivate(questId: number, creator: string): Quest {
    const quest = this.findOne(questId);
    if (quest.creator !== creator) throw new BadRequestException('Not the creator');
    quest.status = QuestStatus.INACTIVE;
    return quest;
  }

  hasCompleted(questId: number, completer: string): boolean {
    return this.completions.has(`${questId}:${completer}`);
  }

  getCompletions(questId: number): { completer: string; verificationUrl: string }[] {
    const results: { completer: string; verificationUrl: string }[] = [];
    for (const [key, val] of this.completions) {
      if (key.startsWith(`${questId}:`)) {
        results.push({ completer: key.split(':')[1], verificationUrl: val.verificationUrl });
      }
    }
    return results;
  }

  getStats(): QuestStats {
    const all = Array.from(this.quests.values());
    const totalCompleted = all.reduce((s, q) => s + q.completionCount, 0);
    const totalRewards = all.reduce(
      (s, q) => s + BigInt(q.rewardPerCompletion) * BigInt(q.completionCount),
      0n,
    );
    return {
      totalQuestsCreated: all.length,
      totalQuestsCompleted: totalCompleted,
      totalRewardsPaid: totalRewards.toString(),
    };
  }

  private processCompletion(questId: number, completer: string, verificationUrl: string): Quest {
    const quest = this.quests.get(questId)!;
    if (quest.status !== QuestStatus.ACTIVE) throw new BadRequestException('Quest not active');

    const compKey = `${questId}:${completer}`;
    if (this.completions.has(compKey)) throw new BadRequestException('Already completed');

    if (quest.maxCompletions > 0 && quest.completionCount >= quest.maxCompletions) {
      throw new BadRequestException('Max completions reached');
    }

    this.completions.set(compKey, { verificationUrl, completedAt: Date.now() });
    quest.completionCount++;

    if (quest.maxCompletions > 0 && quest.completionCount >= quest.maxCompletions) {
      quest.status = QuestStatus.INACTIVE;
    }

    return quest;
  }
}
