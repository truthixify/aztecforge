import {
  Controller, Get, Post, Patch, Param, Body, Query, Headers, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { BountiesService } from './bounties.service';
import { CreateBountyDto } from './dto/create-bounty.dto';

@ApiTags('bounties')
@Controller('bounties')
export class BountiesController {
  constructor(private readonly bountiesService: BountiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bounty with escrowed reward' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  create(@Body() dto: CreateBountyDto, @Headers('x-sender') sender: string) {
    return this.bountiesService.create(dto, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all bounties' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'creator', required: false })
  findAll(@Query('status') status?: string, @Query('creator') creator?: string) {
    return this.bountiesService.findAll({
      status: status !== undefined ? Number(status) : undefined,
      creator,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate bounty statistics' })
  getStats() {
    return this.bountiesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bounty details with all submissions' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bountiesService.findOne(id);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'List all submissions for a bounty' })
  getSubmissions(@Param('id', ParseIntPipe) id: number) {
    return this.bountiesService.getSubmissions(id);
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: 'Submit work for a bounty (open to anyone)' })
  @ApiHeader({ name: 'x-sender', description: 'Submitter address' })
  submitWork(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() body: { submissionUrl: string; notes?: string },
  ) {
    return this.bountiesService.submitWork(id, sender, body.submissionUrl, body.notes ?? '');
  }

  @Patch(':id/submissions/:subId/select')
  @ApiOperation({ summary: 'Select a submission as the winner and pay them' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  selectWinner(
    @Param('id', ParseIntPipe) id: number,
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.selectWinner(id, subId, sender);
  }

  @Patch(':id/submissions/:subId/reject')
  @ApiOperation({ summary: 'Reject a specific submission' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  rejectSubmission(
    @Param('id', ParseIntPipe) id: number,
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.rejectSubmission(id, subId, sender);
  }

  @Patch(':id/close-submissions')
  @ApiOperation({ summary: 'Close submissions and start reviewing' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  closeSubmissions(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.closeSubmissions(id, sender);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel bounty and refund escrow' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.cancel(id, sender);
  }
}
