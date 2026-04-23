import { Controller, Get, Post, Patch, Param, Body, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { FundingPoolsService } from './funding-pools.service';
import { CreatePoolDto, DepositDto, AllocateDto } from './dto/create-pool.dto';

@ApiTags('funding-pools')
@Controller('funding-pools')
export class FundingPoolsController {
  constructor(private readonly service: FundingPoolsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a funding pool' })
  @ApiHeader({ name: 'x-sender', description: 'Curator address' })
  create(@Body() dto: CreatePoolDto, @Headers('x-sender') sender: string) {
    return this.service.create(dto, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all funding pools' })
  findAll() { return this.service.findAll(); }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate pool statistics' })
  getStats() { return this.service.getStats(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get a funding pool by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get available balance in a pool' })
  getBalance(@Param('id', ParseIntPipe) id: number) {
    return { availableBalance: this.service.getAvailableBalance(id) };
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Deposit into a pool' })
  @ApiHeader({ name: 'x-sender', description: 'Depositor address' })
  deposit(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string, @Body() dto: DepositDto) {
    return this.service.deposit(id, sender, dto);
  }

  @Post(':id/allocate')
  @ApiOperation({ summary: 'Allocate from pool to recipient (curator only)' })
  @ApiHeader({ name: 'x-sender', description: 'Curator address' })
  allocate(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string, @Body() dto: AllocateDto) {
    return this.service.allocate(id, sender, dto);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a pool' })
  @ApiHeader({ name: 'x-sender', description: 'Curator address' })
  pause(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.pausePool(id, sender);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a paused pool' })
  @ApiHeader({ name: 'x-sender', description: 'Curator address' })
  resume(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.resumePool(id, sender);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close a pool permanently' })
  @ApiHeader({ name: 'x-sender', description: 'Curator address' })
  close(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.closePool(id, sender);
  }
}
