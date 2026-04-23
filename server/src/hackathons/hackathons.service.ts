import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Hackathon, HackathonStatus, Team, Submission, Prize } from '../common/entities/hackathon.entity';
import { CreateHackathonDto, RegisterTeamDto, SubmitProjectDto, ScoreSubmissionDto, AwardPrizeDto } from './dto/hackathon.dto';

@Injectable()
export class HackathonsService {
  private hackathons: Map<number, Hackathon & { name: string; description: string; tracks: string[] }> = new Map();
  private teams: Map<string, Team & { name: string }> = new Map(); // `hackId:teamId`
  private submissions: Map<string, Submission & { projectName: string; description: string; repoUrl: string; demoUrl: string }> = new Map();
  private scores: Map<string, number> = new Map(); // `hackId:subId:judge`
  private judges: Map<string, Set<string>> = new Map(); // hackId -> Set<judgeAddr>
  private prizes: Map<string, Prize> = new Map(); // `hackId:teamId`
  private nextHackId = 0;

  create(dto: CreateHackathonDto, organizer: string): Hackathon & { name: string; tracks: string[] } {
    const id = this.nextHackId++;
    const hack = {
      id,
      organizer,
      name: dto.name,
      description: dto.description,
      nameHash: '',
      descriptionHash: '',
      paymentToken: dto.paymentToken,
      prizePool: dto.totalPrizePool,
      status: HackathonStatus.REGISTRATION,
      submissionDeadline: dto.submissionDeadline,
      judgingDeadline: dto.judgingDeadline,
      teamCount: 0,
      submissionCount: 0,
      prizePaid: '0',
      trackCount: dto.tracks.length,
      judgeCount: 0,
      tracks: dto.tracks,
    };
    this.hackathons.set(id, hack);
    this.judges.set(String(id), new Set());
    return hack;
  }

  findAll(): (Hackathon & { name: string })[] {
    return Array.from(this.hackathons.values());
  }

  findOne(id: number): Hackathon & { name: string; description: string; tracks: string[] } {
    const h = this.hackathons.get(id);
    if (!h) throw new NotFoundException(`Hackathon #${id} not found`);
    return h;
  }

  addJudge(hackId: number, organizer: string, judge: string): void {
    const hack = this.findOne(hackId);
    if (hack.organizer !== organizer) throw new BadRequestException('Not the organizer');
    const set = this.judges.get(String(hackId))!;
    set.add(judge);
    hack.judgeCount = set.size;
  }

  startBuildingPhase(hackId: number, organizer: string): Hackathon {
    const hack = this.findOne(hackId);
    if (hack.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (hack.status !== HackathonStatus.REGISTRATION) throw new BadRequestException('Not in registration');
    hack.status = HackathonStatus.BUILDING;
    return hack;
  }

  startJudgingPhase(hackId: number, organizer: string): Hackathon {
    const hack = this.findOne(hackId);
    if (hack.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (hack.status !== HackathonStatus.BUILDING) throw new BadRequestException('Not in building phase');
    hack.status = HackathonStatus.JUDGING;
    return hack;
  }

  finalize(hackId: number, organizer: string): Hackathon {
    const hack = this.findOne(hackId);
    if (hack.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (hack.status !== HackathonStatus.JUDGING) throw new BadRequestException('Not in judging phase');
    hack.status = HackathonStatus.COMPLETED;
    return hack;
  }

  registerTeam(hackId: number, lead: string, dto: RegisterTeamDto): Team & { name: string } {
    const hack = this.findOne(hackId);
    if (hack.status !== HackathonStatus.REGISTRATION) throw new BadRequestException('Registration closed');
    const teamId = hack.teamCount;
    const team = {
      hackathonId: hackId,
      teamId,
      lead,
      name: dto.teamName,
      nameHash: '',
      memberCount: 1 + (dto.members?.length ?? 0),
    };
    this.teams.set(`${hackId}:${teamId}`, team);
    hack.teamCount++;
    return team;
  }

  submitProject(hackId: number, submitter: string, dto: SubmitProjectDto): Submission & { projectName: string } {
    const hack = this.findOne(hackId);
    if (hack.status !== HackathonStatus.REGISTRATION && hack.status !== HackathonStatus.BUILDING) {
      throw new BadRequestException('Submissions not open');
    }
    const team = this.teams.get(`${hackId}:${dto.teamId}`);
    if (!team || team.lead !== submitter) throw new BadRequestException('Not the team lead');

    const subId = hack.submissionCount;
    const sub = {
      hackathonId: hackId,
      submissionId: subId,
      teamId: dto.teamId,
      trackIndex: dto.trackIndex,
      projectHash: '',
      repoHash: '',
      demoHash: '',
      averageScore: 0,
      projectName: dto.projectName,
      description: dto.description,
      repoUrl: dto.repoUrl,
      demoUrl: dto.demoUrl ?? '',
    };
    this.submissions.set(`${hackId}:${subId}`, sub);
    hack.submissionCount++;
    return sub;
  }

  scoreSubmission(hackId: number, subId: number, judge: string, dto: ScoreSubmissionDto): void {
    const hack = this.findOne(hackId);
    if (hack.status !== HackathonStatus.JUDGING) throw new BadRequestException('Not in judging phase');
    const judgeSet = this.judges.get(String(hackId))!;
    if (!judgeSet.has(judge)) throw new BadRequestException('Not a judge');

    const scoreKey = `${hackId}:${subId}:${judge}`;
    if (this.scores.has(scoreKey)) throw new BadRequestException('Already scored');
    this.scores.set(scoreKey, dto.score);

    // Recompute average
    const sub = this.submissions.get(`${hackId}:${subId}`);
    if (sub) {
      let total = 0;
      let count = 0;
      for (const j of judgeSet) {
        const s = this.scores.get(`${hackId}:${subId}:${j}`);
        if (s !== undefined) { total += s; count++; }
      }
      sub.averageScore = count > 0 ? Math.round(total / count) : 0;
    }
  }

  awardPrize(hackId: number, organizer: string, dto: AwardPrizeDto): Prize {
    const hack = this.findOne(hackId);
    if (hack.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (hack.status !== HackathonStatus.COMPLETED) throw new BadRequestException('Not finalized');

    const prize: Prize = {
      hackathonId: hackId,
      teamId: dto.teamId,
      placement: dto.placement,
      amount: dto.prizeAmount,
      claimed: false,
    };
    this.prizes.set(`${hackId}:${dto.teamId}`, prize);
    hack.prizePaid = (BigInt(hack.prizePaid) + BigInt(dto.prizeAmount)).toString();
    return prize;
  }

  claimPrize(hackId: number, teamId: number, claimer: string): Prize {
    const team = this.teams.get(`${hackId}:${teamId}`);
    if (!team || team.lead !== claimer) throw new BadRequestException('Not team lead');
    const prize = this.prizes.get(`${hackId}:${teamId}`);
    if (!prize) throw new NotFoundException('No prize awarded');
    if (prize.claimed) throw new BadRequestException('Already claimed');
    prize.claimed = true;
    return prize;
  }

  getTeams(hackId: number): (Team & { name: string })[] {
    const results: (Team & { name: string })[] = [];
    for (const [key, team] of this.teams) {
      if (key.startsWith(`${hackId}:`)) results.push(team);
    }
    return results;
  }

  getSubmissions(hackId: number): (Submission & { projectName: string })[] {
    const results: (Submission & { projectName: string })[] = [];
    for (const [key, sub] of this.submissions) {
      if (key.startsWith(`${hackId}:`)) results.push(sub);
    }
    return results;
  }
}
