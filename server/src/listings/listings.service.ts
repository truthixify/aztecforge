import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ListingsService {
  constructor(
    private prisma: PrismaService,
    private orgsService: OrganizationsService,
    private usersService: UsersService,
  ) {}

  // ─── CREATE ────────────────────────────────────────────

  async create(data: {
    orgId: number;
    title: string;
    slug: string;
    description: string;
    type?: string;
    compensationType?: string;
    token?: string;
    rewardAmount?: string;
    rewards?: Record<string, number>;
    maxWinners?: number;
    maxBonusSpots?: number;
    isRewardPublic?: boolean;
    deadline: string; // ISO date string
    announcementDate?: string;
    skills?: string[];
    difficulty?: string;
    acceptedFormats?: string[];
    eligibilityQuestions?: { order: number; question: string; type: string }[];
    tracks?: string[];
    judgingDeadline?: string;
    region?: string;
  }, creatorWallet: string) {
    const { user } = await this.orgsService.assertMember(data.orgId, creatorWallet);

    // Slug uniqueness
    const existing = await this.prisma.listing.findUnique({ where: { slug: data.slug } });
    if (existing) throw new BadRequestException('Listing slug already taken');

    return this.prisma.listing.create({
      data: {
        orgId: data.orgId,
        createdById: user.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        type: data.type ?? 'BOUNTY',
        status: 'DRAFT',
        compensationType: data.compensationType ?? 'FIXED',
        token: data.token ?? 'USDC',
        rewardAmount: data.rewardAmount ?? '0',
        rewards: JSON.stringify(data.rewards ?? {}),
        maxWinners: data.maxWinners ?? 1,
        maxBonusSpots: data.maxBonusSpots ?? 0,
        isRewardPublic: data.isRewardPublic !== false,
        escrowBalance: data.rewardAmount ?? '0',
        deadline: new Date(data.deadline),
        announcementDate: data.announcementDate ? new Date(data.announcementDate) : null,
        skills: JSON.stringify(data.skills ?? []),
        difficulty: data.difficulty ?? 'medium',
        acceptedFormats: JSON.stringify(data.acceptedFormats ?? ['github_repo', 'deployed_url']),
        eligibilityQuestions: JSON.stringify(data.eligibilityQuestions ?? []),
        tracks: JSON.stringify(data.tracks ?? []),
        judgingDeadline: data.judgingDeadline ? new Date(data.judgingDeadline) : null,
        region: data.region ?? 'Global',
      },
    });
  }

  // ─── PUBLISH ───────────────────────────────────────────

  async publish(id: number, callerWallet: string) {
    const listing = await this.findOne(id);
    await this.orgsService.assertAdmin(listing.orgId, callerWallet);
    if (listing.status !== 'DRAFT') throw new BadRequestException('Can only publish drafts');

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'OPEN', isPublished: true },
    });
  }

  // ─── STATUS TRANSITIONS ───────────────────────────────

  async closeSubmissions(id: number, callerWallet: string) {
    const listing = await this.findOne(id);
    await this.orgsService.assertMember(listing.orgId, callerWallet);
    if (listing.status !== 'OPEN') throw new BadRequestException('Listing is not open');

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'REVIEW' },
    });
  }

  async announceWinners(id: number, callerWallet: string) {
    const listing = await this.findOne(id);
    await this.orgsService.assertAdmin(listing.orgId, callerWallet);
    if (listing.status !== 'REVIEW') throw new BadRequestException('Not in review mode');

    // Check that at least one winner is selected
    const winners = await this.prisma.listingSubmission.count({
      where: { listingId: id, isWinner: true },
    });
    if (winners === 0) throw new BadRequestException('Select at least one winner before announcing');

    // Reject all non-winner pending submissions
    await this.prisma.listingSubmission.updateMany({
      where: { listingId: id, isWinner: false, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });

    // Approve all winners
    await this.prisma.listingSubmission.updateMany({
      where: { listingId: id, isWinner: true },
      data: { status: 'APPROVED' },
    });

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'CLOSED', isWinnersAnnounced: true },
    });
  }

  async markCompleted(id: number, callerWallet: string) {
    const listing = await this.findOne(id);
    await this.orgsService.assertAdmin(listing.orgId, callerWallet);
    if (listing.status !== 'CLOSED') throw new BadRequestException('Winners not announced yet');

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'COMPLETED', escrowBalance: '0' },
    });
  }

  async cancel(id: number, callerWallet: string) {
    const listing = await this.findOne(id);
    await this.orgsService.assertAdmin(listing.orgId, callerWallet);
    if (listing.status === 'COMPLETED') throw new BadRequestException('Cannot cancel completed listing');

    // Reject all pending submissions
    await this.prisma.listingSubmission.updateMany({
      where: { listingId: id, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'CANCELLED', isActive: false, escrowBalance: '0' },
    });
  }

  async extendDeadline(id: number, newDeadline: string, callerWallet: string) {
    const listing = await this.findOne(id);
    await this.orgsService.assertAdmin(listing.orgId, callerWallet);
    if (listing.status !== 'OPEN') throw new BadRequestException('Can only extend open listings');

    const newDate = new Date(newDeadline);
    if (newDate <= listing.deadline) throw new BadRequestException('New deadline must be after current deadline');

    return this.prisma.listing.update({
      where: { id },
      data: { deadline: newDate },
    });
  }

  // ─── SUBMISSIONS ──────────────────────────────────────

  async submit(listingId: number, callerWallet: string, data: {
    link: string;
    tweet?: string;
    additionalInfo?: string;
    ask?: string;
    eligibilityAnswers?: Record<string, string>[];
  }) {
    const listing = await this.findOne(listingId);
    if (listing.status !== 'OPEN') throw new BadRequestException('Listing is not accepting submissions');

    const user = await this.usersService.findOrCreate(callerWallet);

    // One submission per user per listing
    const existing = await this.prisma.listingSubmission.findUnique({
      where: { listingId_userId: { listingId, userId: user.id } },
    });
    if (existing) throw new BadRequestException('You already submitted to this listing');

    return this.prisma.listingSubmission.create({
      data: {
        listingId,
        userId: user.id,
        link: data.link,
        tweet: data.tweet ?? '',
        additionalInfo: data.additionalInfo ?? '',
        ask: data.ask ?? '0',
        eligibilityAnswers: JSON.stringify(data.eligibilityAnswers ?? []),
      },
      include: { user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } } },
    });
  }

  // ─── REVIEW (org-side) ────────────────────────────────

  async updateSubmissionLabel(submissionId: number, label: string, callerWallet: string) {
    const sub = await this.prisma.listingSubmission.findUnique({ where: { id: submissionId }, include: { listing: true } });
    if (!sub) throw new NotFoundException('Submission not found');
    await this.orgsService.assertMember(sub.listing.orgId, callerWallet);

    return this.prisma.listingSubmission.update({
      where: { id: submissionId },
      data: { label },
    });
  }

  async updateInternalNotes(submissionId: number, notes: string, callerWallet: string) {
    const sub = await this.prisma.listingSubmission.findUnique({ where: { id: submissionId }, include: { listing: true } });
    if (!sub) throw new NotFoundException('Submission not found');
    await this.orgsService.assertMember(sub.listing.orgId, callerWallet);

    return this.prisma.listingSubmission.update({
      where: { id: submissionId },
      data: { internalNotes: notes },
    });
  }

  async selectWinner(submissionId: number, position: number, rewardAmount: string, callerWallet: string) {
    const sub = await this.prisma.listingSubmission.findUnique({ where: { id: submissionId }, include: { listing: true } });
    if (!sub) throw new NotFoundException('Submission not found');
    await this.orgsService.assertAdmin(sub.listing.orgId, callerWallet);

    if (sub.listing.isWinnersAnnounced) throw new BadRequestException('Winners already announced');

    // Check position not already assigned
    const existingWinner = await this.prisma.listingSubmission.findFirst({
      where: { listingId: sub.listingId, winnerPosition: position, isWinner: true },
    });
    if (existingWinner) throw new BadRequestException(`Position ${position} already assigned`);

    return this.prisma.listingSubmission.update({
      where: { id: submissionId },
      data: { isWinner: true, winnerPosition: position, rewardAmount, label: 'SHORTLISTED' },
    });
  }

  async removeWinner(submissionId: number, callerWallet: string) {
    const sub = await this.prisma.listingSubmission.findUnique({ where: { id: submissionId }, include: { listing: true } });
    if (!sub) throw new NotFoundException('Submission not found');
    await this.orgsService.assertAdmin(sub.listing.orgId, callerWallet);

    if (sub.listing.isWinnersAnnounced) throw new BadRequestException('Cannot change after announcement');

    return this.prisma.listingSubmission.update({
      where: { id: submissionId },
      data: { isWinner: false, winnerPosition: null, rewardAmount: '0' },
    });
  }

  async markPaid(submissionId: number, txHash: string, callerWallet: string) {
    const sub = await this.prisma.listingSubmission.findUnique({ where: { id: submissionId }, include: { listing: true } });
    if (!sub) throw new NotFoundException('Submission not found');
    await this.orgsService.assertAdmin(sub.listing.orgId, callerWallet);

    if (!sub.isWinner) throw new BadRequestException('Can only pay winners');

    // Update submission
    await this.prisma.listingSubmission.update({
      where: { id: submissionId },
      data: { isPaid: true, paymentTxHash: txHash, paidAt: new Date() },
    });

    // Update winner's reputation
    await this.usersService.updateReputation(sub.userId, {
      score: 10,
      bountiesWon: 1,
      earned: sub.rewardAmount,
    });

    // Check if all winners are paid -> mark listing completed
    const unpaid = await this.prisma.listingSubmission.count({
      where: { listingId: sub.listingId, isWinner: true, isPaid: false },
    });
    if (unpaid === 0) {
      await this.prisma.listing.update({
        where: { id: sub.listingId },
        data: { status: 'COMPLETED', escrowBalance: '0' },
      });
    }

    return { paid: true, allPaid: unpaid === 0 };
  }

  // ─── READ ─────────────────────────────────────────────

  async findAll(filters?: { type?: string; status?: string; orgId?: number }) {
    const where: Record<string, unknown> = { isActive: true };
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.orgId) where.orgId = filters.orgId;

    // Only show published listings to the public
    if (!filters?.orgId) where.isPublished = true;

    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        org: { select: { id: true, name: true, slug: true, logo: true } },
        _count: { select: { submissions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l) => ({
      ...l,
      skills: JSON.parse(l.skills),
      acceptedFormats: JSON.parse(l.acceptedFormats),
      tracks: JSON.parse(l.tracks),
      rewards: JSON.parse(l.rewards),
      submissionCount: l._count.submissions,
      commentCount: l._count.comments,
    }));
  }

  async findOne(id: number) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        org: { select: { id: true, name: true, slug: true, logo: true } },
        submissions: {
          include: { user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { author: { select: { id: true, walletAddress: true, displayName: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    return {
      ...listing,
      skills: JSON.parse(listing.skills),
      acceptedFormats: JSON.parse(listing.acceptedFormats),
      tracks: JSON.parse(listing.tracks),
      rewards: JSON.parse(listing.rewards),
      eligibilityQuestions: JSON.parse(listing.eligibilityQuestions),
      submissionCount: listing._count.submissions,
    };
  }

  async findBySlug(slug: string) {
    const listing = await this.prisma.listing.findUnique({ where: { slug } });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.findOne(listing.id);
  }

  async getSubmissions(listingId: number) {
    return this.prisma.listingSubmission.findMany({
      where: { listingId },
      include: { user: { select: { id: true, walletAddress: true, displayName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [total, open, completed, listings] = await Promise.all([
      this.prisma.listing.count({ where: { isActive: true } }),
      this.prisma.listing.count({ where: { status: 'OPEN' } }),
      this.prisma.listing.count({ where: { status: 'COMPLETED' } }),
      this.prisma.listing.findMany({ select: { status: true, escrowBalance: true, rewardAmount: true } }),
    ]);

    let escrowed = 0n;
    let paid = 0n;
    for (const l of listings) {
      if (['OPEN', 'REVIEW', 'CLOSED'].includes(l.status)) escrowed += BigInt(l.escrowBalance || '0');
      if (l.status === 'COMPLETED') paid += BigInt(l.rewardAmount || '0');
    }

    return { total, open, completed, totalEscrowed: escrowed.toString(), totalPaid: paid.toString() };
  }
}
