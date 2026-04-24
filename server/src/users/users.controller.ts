import { Controller, Get, Patch, Param, Body, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get or create current user' })
  @ApiHeader({ name: 'x-sender' })
  async me(@Headers('x-sender') sender: string) {
    return this.usersService.findOrCreate(sender);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get reputation leaderboard' })
  async leaderboard(@Query('limit') limit?: string) {
    return this.usersService.getLeaderboard(limit ? Number(limit) : 20);
  }

  @Get(':wallet')
  @ApiOperation({ summary: 'Get user by wallet address' })
  async findByWallet(@Param('wallet') wallet: string) {
    return this.usersService.findByWallet(wallet);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiHeader({ name: 'x-sender' })
  async updateProfile(@Headers('x-sender') sender: string, @Body() body: Record<string, unknown>) {
    return this.usersService.updateProfile(sender, body as Parameters<UsersService['updateProfile']>[1]);
  }
}
