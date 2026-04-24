import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(data: { name: string; slug: string; logo?: string; website?: string; description?: string; industry?: string; twitter?: string }, creatorWallet: string) {
    // Check slug uniqueness
    const existing = await this.prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existing) throw new BadRequestException('Organization slug already taken');

    // Ensure user exists
    const user = await this.usersService.findOrCreate(creatorWallet);

    // Create org with creator as ADMIN
    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        logo: data.logo ?? '',
        website: data.website ?? '',
        description: data.description ?? '',
        industry: data.industry ?? '',
        twitter: data.twitter ?? '',
        members: {
          create: { userId: user.id, role: 'ADMIN' },
        },
      },
      include: { members: { include: { user: { select: { id: true, walletAddress: true, displayName: true } } } } },
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      where: { isActive: true },
      include: { _count: { select: { listings: true, members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } } } },
        _count: { select: { listings: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        members: { include: { user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } } } },
        _count: { select: { listings: true } },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async assertAdmin(orgId: number, walletAddress: string): Promise<{ user: { id: number; walletAddress: string }; org: { id: number } }> {
    const user = await this.usersService.findOrCreate(walletAddress);
    const membership = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: user.id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      throw new ForbiddenException('You are not an admin of this organization');
    }
    return { user, org: { id: orgId } };
  }

  async assertMember(orgId: number, walletAddress: string) {
    const user = await this.usersService.findOrCreate(walletAddress);
    const membership = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
    return { user, membership };
  }

  async inviteMember(orgId: number, walletAddress: string, role: string = 'MEMBER') {
    const user = await this.usersService.findOrCreate(walletAddress);
    const existing = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: user.id } },
    });
    if (existing) throw new BadRequestException('User is already a member');

    return this.prisma.orgMember.create({
      data: { orgId, userId: user.id, role },
      include: { user: { select: { id: true, walletAddress: true, displayName: true } } },
    });
  }

  async removeMember(orgId: number, userId: number) {
    return this.prisma.orgMember.delete({
      where: { orgId_userId: { orgId, userId } },
    });
  }

  async updateMemberRole(orgId: number, userId: number, role: string) {
    return this.prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId } },
      data: { role },
    });
  }

  async getUserOrgs(walletAddress: string) {
    const user = await this.usersService.findOrCreate(walletAddress);
    return this.prisma.orgMember.findMany({
      where: { userId: user.id },
      include: { org: { include: { _count: { select: { listings: true, members: true } } } } },
    });
  }
}
