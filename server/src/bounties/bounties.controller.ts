import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { BountiesService } from './bounties.service';
import { CreateBountyDto } from './dto/create-bounty.dto';
import { SubmitWorkDto } from './dto/submit-work.dto';
import { BountyStatus } from '../common/entities/bounty.entity';

@ApiTags('bounties')
@Controller('bounties')
export class BountiesController {
  constructor(private readonly bountiesService: BountiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bounty' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  create(
    @Body() dto: CreateBountyDto,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.create(dto, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all bounties' })
  @ApiQuery({ name: 'status', required: false, enum: BountyStatus })
  @ApiQuery({ name: 'creator', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('creator') creator?: string,
  ) {
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
  @ApiOperation({ summary: 'Get a single bounty by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bountiesService.findOne(id);
  }

  @Patch(':id/claim')
  @ApiOperation({ summary: 'Claim a bounty to work on it' })
  @ApiHeader({ name: 'x-sender', description: 'Claimer address' })
  claim(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.claim(id, sender);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit work for a claimed bounty' })
  @ApiHeader({ name: 'x-sender', description: 'Submitter address' })
  submitWork(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() dto: SubmitWorkDto,
  ) {
    return this.bountiesService.submitWork(id, sender, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a submission and release payment' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.approve(id, sender);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a submission and reopen' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.reject(id, sender);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a bounty and refund escrow' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.cancel(id, sender);
  }

  @Patch(':id/unclaim')
  @ApiOperation({ summary: 'Give up a claim' })
  @ApiHeader({ name: 'x-sender', description: 'Claimer address' })
  unclaim(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.unclaim(id, sender);
  }

  @Patch(':id/dispute')
  @ApiOperation({ summary: 'Flag a bounty as disputed' })
  @ApiHeader({ name: 'x-sender', description: 'Disputer address' })
  dispute(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.bountiesService.dispute(id, sender);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute (admin only)' })
  @ApiQuery({ name: 'approve', description: 'true to pay claimer, false to refund creator' })
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Query('approve') approve: string,
  ) {
    return this.bountiesService.resolveDispute(id, approve === 'true');
  }
}
