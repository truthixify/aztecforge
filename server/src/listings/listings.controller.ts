import { Controller, Get, Post, Patch, Param, Body, Query, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly service: ListingsService) {}

  // ─── CRUD ──────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a listing (draft)' })
  @ApiHeader({ name: 'x-sender' })
  create(@Body() body: Parameters<ListingsService['create']>[0], @Headers('x-sender') sender: string) {
    return this.service.create(body, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all published listings' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'orgId', required: false })
  findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('orgId') orgId?: string,
  ) {
    return this.service.findAll({
      type: type || undefined,
      status: status || undefined,
      orgId: orgId ? Number(orgId) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get listing stats' })
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID with submissions and comments' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get listing by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  // ─── STATUS TRANSITIONS ────────────────────────────────

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a draft listing (open for submissions)' })
  @ApiHeader({ name: 'x-sender' })
  publish(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.publish(id, sender);
  }

  @Patch(':id/close-submissions')
  @ApiOperation({ summary: 'Close submissions and move to review' })
  @ApiHeader({ name: 'x-sender' })
  closeSubmissions(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.closeSubmissions(id, sender);
  }

  @Patch(':id/announce-winners')
  @ApiOperation({ summary: 'Announce winners (approves winners, rejects others)' })
  @ApiHeader({ name: 'x-sender' })
  announceWinners(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.announceWinners(id, sender);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark listing as fully completed (all payments done)' })
  @ApiHeader({ name: 'x-sender' })
  complete(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.markCompleted(id, sender);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel listing and refund escrow' })
  @ApiHeader({ name: 'x-sender' })
  cancel(@Param('id', ParseIntPipe) id: number, @Headers('x-sender') sender: string) {
    return this.service.cancel(id, sender);
  }

  @Patch(':id/extend-deadline')
  @ApiOperation({ summary: 'Extend the submission deadline' })
  @ApiHeader({ name: 'x-sender' })
  extendDeadline(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() body: { deadline: string },
  ) {
    return this.service.extendDeadline(id, body.deadline, sender);
  }

  // ─── SUBMISSIONS ──────────────────────────────────────

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Get all submissions for a listing' })
  getSubmissions(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSubmissions(id);
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: 'Submit work for a listing' })
  @ApiHeader({ name: 'x-sender' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() body: { link: string; tweet?: string; additionalInfo?: string; ask?: string },
  ) {
    return this.service.submit(id, sender, body);
  }

  // ─── REVIEW ───────────────────────────────────────────

  @Patch('submissions/:subId/label')
  @ApiOperation({ summary: 'Update internal review label on a submission' })
  @ApiHeader({ name: 'x-sender' })
  updateLabel(
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
    @Body() body: { label: string },
  ) {
    return this.service.updateSubmissionLabel(subId, body.label, sender);
  }

  @Patch('submissions/:subId/notes')
  @ApiOperation({ summary: 'Update internal notes on a submission' })
  @ApiHeader({ name: 'x-sender' })
  updateNotes(
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
    @Body() body: { notes: string },
  ) {
    return this.service.updateInternalNotes(subId, body.notes, sender);
  }

  @Patch('submissions/:subId/select-winner')
  @ApiOperation({ summary: 'Select a submission as a winner at a specific position' })
  @ApiHeader({ name: 'x-sender' })
  selectWinner(
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
    @Body() body: { position: number; rewardAmount: string },
  ) {
    return this.service.selectWinner(subId, body.position, body.rewardAmount, sender);
  }

  @Patch('submissions/:subId/remove-winner')
  @ApiOperation({ summary: 'Remove winner status from a submission' })
  @ApiHeader({ name: 'x-sender' })
  removeWinner(
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.service.removeWinner(subId, sender);
  }

  @Patch('submissions/:subId/pay')
  @ApiOperation({ summary: 'Mark a winner submission as paid' })
  @ApiHeader({ name: 'x-sender' })
  markPaid(
    @Param('subId', ParseIntPipe) subId: number,
    @Headers('x-sender') sender: string,
    @Body() body: { txHash: string },
  ) {
    return this.service.markPaid(subId, body.txHash, sender);
  }
}
