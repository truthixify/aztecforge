import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get()
  @ApiOperation({ summary: 'List all contributors with reputation' })
  findAll() {
    return this.reputationService.findAll();
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top contributors by reputation score' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLeaderboard(@Query('limit') limit?: string) {
    return this.reputationService.getLeaderboard(limit ? Number(limit) : 20);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get reputation system stats' })
  getStats() {
    return { totalContributors: this.reputationService.getTotalContributors() };
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get reputation for a specific contributor' })
  findOne(@Param('address') address: string) {
    return this.reputationService.findOne(address);
  }

  @Get(':address/gate/:gateId')
  @ApiOperation({ summary: 'Check if a contributor passes a reputation gate' })
  checkGate(
    @Param('address') address: string,
    @Param('gateId') gateId: string,
  ) {
    return { passes: this.reputationService.checkGate(address, Number(gateId)) };
  }
}
