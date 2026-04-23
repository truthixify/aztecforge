import { Controller, Get, Post, Patch, Param, Body, Query, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { QuestsService } from './quests.service';
import { CreateQuestDto, CompleteQuestDto, VerifyCompletionDto } from './dto/quest.dto';
import { QuestStatus } from '../common/entities/quest.entity';

@ApiTags('quests')
@Controller('quests')
export class QuestsController {
  constructor(private readonly service: QuestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a quest' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  create(@Body() dto: CreateQuestDto, @Headers('x-sender') sender: string) {
    return this.service.create(dto, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all quests' })
  @ApiQuery({ name: 'status', required: false, enum: QuestStatus })
  @ApiQuery({ name: 'creator', required: false })
  findAll(@Query('status') status?: string, @Query('creator') creator?: string) {
    return this.service.findAll({
      status: status !== undefined ? Number(status) : undefined,
      creator,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get quest stats' })
  getStats() { return this.service.getStats(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get quest details' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get(':id/completions')
  @ApiOperation({ summary: 'List completions for a quest' })
  getCompletions(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCompletions(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a quest (type 0 only)' })
  @ApiHeader({ name: 'x-sender', description: 'Completer address' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() dto: CompleteQuestDto,
  ) {
    return this.service.complete(id, sender, dto.verificationUrl);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a quest completion (verifier only)' })
  @ApiHeader({ name: 'x-sender', description: 'Verifier address' })
  verifyCompletion(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() dto: VerifyCompletionDto,
  ) {
    return this.service.verifyCompletion(id, sender, dto.completer, dto.verificationUrl);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a quest' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  deactivate(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.deactivate(id, sender);
  }

  @Post(':id/verifiers')
  @ApiOperation({ summary: 'Add a verifier' })
  @ApiHeader({ name: 'x-sender', description: 'Creator address' })
  addVerifier(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body('verifier') verifier: string,
  ) {
    this.service.addVerifier(id, sender, verifier);
    return { success: true };
  }
}
