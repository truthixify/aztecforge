import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateHackathonDto, RegisterTeamDto, SubmitProjectDto, ScoreSubmissionDto, AwardPrizeDto } from './dto/hackathon.dto';

@Injectable()
export class HackathonsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHackathonDto, organizer: string) {
    return this.prisma.hackathon.create({
      data: {
        name: dto.name,
        description: dto.description,
        paymentToken: dto.paymentToken,
        prizePool: dto.totalPrizePool,
        submissionDeadline: dto.submissionDeadline,
        judgingDeadline: dto.judgingDeadline,
        tracks: JSON.stringify(dto.tracks),
        organizer,
      },
    });
  }

  async findAll() {
    const hacks = await this.prisma.hackathon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { teams: true, submissions: true } } },
    });
    return hacks.map((h) => ({
      ...h,
      tracks: JSON.parse(h.tracks),
      teamCount: h._count.teams,
      submissionCount: h._count.submissions,
    }));
  }

  async findOne(id: number) {
    const h = await this.prisma.hackathon.findUnique({
      where: { id },
      include: { _count: { select: { teams: true, submissions: true } } },
    });
    if (!h) throw new NotFoundException(`Hackathon #${id} not found`);
    return { ...h, tracks: JSON.parse(h.tracks), teamCount: h._count.teams, submissionCount: h._count.submissions };
  }

  async addJudge(_hackId: number, _organizer: string, _judge: string) {
    // Judges tracked on-chain
  }

  async startBuildingPhase(hackId: number, organizer: string) {
    const h = await this.findOne(hackId);
    if (h.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (h.status !== 0) throw new BadRequestException('Not in registration');
    return this.prisma.hackathon.update({ where: { id: hackId }, data: { status: 1 } });
  }

  async startJudgingPhase(hackId: number, organizer: string) {
    const h = await this.findOne(hackId);
    if (h.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (h.status !== 1) throw new BadRequestException('Not in building phase');
    return this.prisma.hackathon.update({ where: { id: hackId }, data: { status: 2 } });
  }

  async finalize(hackId: number, organizer: string) {
    const h = await this.findOne(hackId);
    if (h.organizer !== organizer) throw new BadRequestException('Not the organizer');
    if (h.status !== 2) throw new BadRequestException('Not in judging phase');
    return this.prisma.hackathon.update({ where: { id: hackId }, data: { status: 3 } });
  }

  async registerTeam(hackId: number, lead: string, dto: RegisterTeamDto) {
    const h = await this.findOne(hackId);
    if (h.status !== 0) throw new BadRequestException('Registration closed');
    return this.prisma.team.create({
      data: {
        hackathonId: hackId,
        name: dto.teamName,
        lead,
        members: JSON.stringify(dto.members ?? []),
      },
    });
  }

  async submitProject(hackId: number, submitter: string, dto: SubmitProjectDto) {
    const h = await this.findOne(hackId);
    if (h.status !== 0 && h.status !== 1) throw new BadRequestException('Submissions not open');
    return this.prisma.submission.create({
      data: {
        hackathonId: hackId,
        teamId: dto.teamId,
        trackIndex: dto.trackIndex,
        projectName: dto.projectName,
        description: dto.description,
        repoUrl: dto.repoUrl,
        demoUrl: dto.demoUrl ?? '',
      },
    });
  }

  async scoreSubmission(_hackId: number, _subId: number, _judge: string, dto: ScoreSubmissionDto) {
    // Scoring is on-chain; off-chain we just track the average
    await this.prisma.submission.update({
      where: { id: _subId },
      data: { averageScore: dto.score },
    });
  }

  async awardPrize(_hackId: number, _organizer: string, _dto: AwardPrizeDto) {
    // Prizes on-chain
    return { hackathonId: _hackId, teamId: _dto.teamId, placement: _dto.placement, amount: _dto.prizeAmount, claimed: false };
  }

  async claimPrize(_hackId: number, _teamId: number, _claimer: string) {
    return { claimed: true };
  }

  async getTeams(hackId: number) {
    return this.prisma.team.findMany({ where: { hackathonId: hackId } });
  }

  async getSubmissions(hackId: number) {
    return this.prisma.submission.findMany({ where: { hackathonId: hackId } });
  }
}
