import { Controller, Get, Post, Patch, Delete, Param, Body, Headers, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization' })
  @ApiHeader({ name: 'x-sender' })
  create(@Body() body: { name: string; slug: string; logo?: string; website?: string; description?: string; industry?: string; twitter?: string }, @Headers('x-sender') sender: string) {
    return this.service.create(body, sender);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  findAll() {
    return this.service.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get organizations the current user belongs to' })
  @ApiHeader({ name: 'x-sender' })
  myOrgs(@Headers('x-sender') sender: string) {
    return this.service.getUserOrgs(sender);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  @ApiHeader({ name: 'x-sender' })
  async inviteMember(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-sender') sender: string,
    @Body() body: { walletAddress: string; role?: string },
  ) {
    await this.service.assertAdmin(id, sender);
    return this.service.inviteMember(id, body.walletAddress, body.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  @ApiHeader({ name: 'x-sender' })
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Headers('x-sender') sender: string,
  ) {
    await this.service.assertAdmin(id, sender);
    return this.service.removeMember(id, userId);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiHeader({ name: 'x-sender' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Headers('x-sender') sender: string,
    @Body() body: { role: string },
  ) {
    await this.service.assertAdmin(id, sender);
    return this.service.updateMemberRole(id, userId, body.role);
  }
}
