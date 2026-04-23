import { Controller, Get, Post, Patch, Param, Body, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto, RegisterTeamDto, SubmitProjectDto, ScoreSubmissionDto, AwardPrizeDto } from './dto/hackathon.dto';

@ApiTags('hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly service: HackathonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a hackathon' })
  @ApiHeader({ name: 'x-sender', description: 'Organizer address' })
  create(@Body() dto: CreateHackathonDto, @Headers('x-sender') sender: string) {
    return this.service.create(dto, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all hackathons' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get hackathon details' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get(':id/teams')
  @ApiOperation({ summary: 'List teams for a hackathon' })
  getTeams(@Param('id', ParseIntPipe) id: number) { return this.service.getTeams(id); }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'List submissions for a hackathon' })
  getSubmissions(@Param('id', ParseIntPipe) id: number) { return this.service.getSubmissions(id); }

  @Post(':id/judges')
  @ApiOperation({ summary: 'Add a judge' })
  @ApiHeader({ name: 'x-sender', description: 'Organizer address' })
  addJudge(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string, @Body('judge') judge: string) {
    this.service.addJudge(id, sender, judge);
    return { success: true };
  }

  @Patch(':id/start-building')
  @ApiOperation({ summary: 'Start building phase' })
  @ApiHeader({ name: 'x-sender', description: 'Organizer address' })
  startBuilding(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.startBuildingPhase(id, sender);
  }

  @Patch(':id/start-judging')
  @ApiOperation({ summary: 'Start judging phase' })
  @ApiHeader({ name: 'x-sender', description: 'Organizer address' })
  startJudging(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.startJudgingPhase(id, sender);
  }

  @Patch(':id/finalize')
  @ApiOperation({ summary: 'Finalize hackathon' })
  @ApiHeader({ name: 'x-sender', description: 'Organizer address' })
  finalize(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.finalize(id, sender);
  }

  @Post(':id/teams')
  @ApiOperation({ summary: 'Register a team' })
  @ApiHeader({ name: 'x-sender', description: 'Team lead address' })
  registerTeam(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string, @Body() dto: RegisterTeamDto) {
    return this.service.registerTeam(id, sender, dto);
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: 'Submit a project' })
  @ApiHeader({ name: 'x-sender', description: 'Team lead address' })
  submitProject(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string, @Body() dto: SubmitProjectDto) {
    return this.service.submitProject(id, sender, dto);
  }

  @Post(':id/submissions/:subId/score')
  @ApiOperation({ summary: 'Score a submission' })
  @ApiHeader({ name: 'x-sender', description: 'Judge address' })
  score(
    @Param('id', ParseIntPipe) id: number,
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
    @Body() dto: ScoreSubmissionDto,
  ) {
    this.service.scoreSubmission(id, subId, sender, dto);
    return { success: true };
  }

  @Post(':id/prizes')
  @ApiOperation({ summary: 'Award a prize to a team' })
  @ApiHeader({ name: 'x-sender', description: 'Organizer address' })
  awardPrize(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string, @Body() dto: AwardPrizeDto) {
    return this.service.awardPrize(id, sender, dto);
  }

  @Post(':id/prizes/:teamId/claim')
  @ApiOperation({ summary: 'Claim a prize' })
  @ApiHeader({ name: 'x-sender', description: 'Team lead address' })
  claimPrize(
    @Param('id', ParseIntPipe) id: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.service.claimPrize(id, teamId, sender);
  }
}
