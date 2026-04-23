import { Controller, Get, Post, Patch, Delete, Param, Body, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PeerAllocationService } from './peer-allocation.service';
import { CreateCircleDto, AllocateGiveDto, AddMemberDto } from './dto/peer-allocation.dto';

@ApiTags('peer-allocation')
@Controller('peer-allocation')
export class PeerAllocationController {
  constructor(private readonly service: PeerAllocationService) {}

  @Post('circles')
  @ApiOperation({ summary: 'Create a peer allocation circle' })
  @ApiHeader({ name: 'x-sender', description: 'Admin address' })
  create(@Body() dto: CreateCircleDto, @Headers('x-sender') sender: string) {
    return this.service.create(dto, sender);
  }

  @Get('circles')
  @ApiOperation({ summary: 'List all circles' })
  findAll() { return this.service.findAll(); }

  @Get('circles/:id')
  @ApiOperation({ summary: 'Get a circle by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Get('circles/:id/members')
  @ApiOperation({ summary: 'List circle members' })
  getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.service.getMembers(id);
  }

  @Post('circles/:id/members')
  @ApiOperation({ summary: 'Add a member to a circle' })
  @ApiHeader({ name: 'x-sender', description: 'Admin address' })
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.addMember(id, sender, dto.member);
  }

  @Delete('circles/:id/members/:member')
  @ApiOperation({ summary: 'Remove a member from a circle' })
  @ApiHeader({ name: 'x-sender', description: 'Admin address' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('member') member: string,
    @Headers('x-sender') sender: string,
  ) {
    return this.service.removeMember(id, sender, member);
  }

  @Post('circles/:id/give')
  @ApiOperation({ summary: 'Allocate GIVE to a peer' })
  @ApiHeader({ name: 'x-sender', description: 'Giver address' })
  allocateGive(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() dto: AllocateGiveDto,
  ) {
    this.service.allocateGive(id, sender, dto);
    return { success: true };
  }

  @Patch('circles/:id/advance-epoch')
  @ApiOperation({ summary: 'Advance to the next epoch' })
  @ApiHeader({ name: 'x-sender', description: 'Admin address' })
  advanceEpoch(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.service.advanceEpoch(id, sender);
  }

  @Post('circles/:id/claim/:epoch')
  @ApiOperation({ summary: 'Claim reward for a completed epoch' })
  @ApiHeader({ name: 'x-sender', description: 'Member address' })
  claimReward(
    @Param('id', ParseIntPipe) id: number,
    @Param('epoch', ParseIntPipe) epoch: number,
    @Headers('x-sender') sender: string,
  ) {
    return this.service.claimEpochReward(id, epoch, sender);
  }

  @Get('circles/:id/epoch/:epoch/member/:member')
  @ApiOperation({ summary: 'Get member allocation for an epoch' })
  getMemberAllocation(
    @Param('id', ParseIntPipe) id: number,
    @Param('epoch', ParseIntPipe) epoch: number,
    @Param('member') member: string,
  ) {
    return this.service.getMemberAllocation(id, epoch, member);
  }
}
