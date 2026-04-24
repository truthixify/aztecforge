import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePoolDto, DepositDto, AllocateDto } from './dto/create-pool.dto';

@Injectable()
export class FundingPoolsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePoolDto, curator: string) {
    return this.prisma.fundingPool.create({
      data: {
        purpose: dto.purpose,
        paymentToken: dto.paymentToken,
        poolType: dto.poolType,
        curator,
      },
    });
  }

  async findAll() {
    return this.prisma.fundingPool.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const pool = await this.prisma.fundingPool.findUnique({ where: { id } });
    if (!pool) throw new NotFoundException(`Pool #${id} not found`);
    return pool;
  }

  async deposit(poolId: number, _depositor: string, dto: DepositDto) {
    const pool = await this.findOne(poolId);
    if (pool.status !== 0) throw new BadRequestException('Pool not active');
    return this.prisma.fundingPool.update({
      where: { id: poolId },
      data: {
        totalDeposited: (BigInt(pool.totalDeposited) + BigInt(dto.amount)).toString(),
        contributorCount: pool.contributorCount + 1,
      },
    });
  }

  async withdraw(poolId: number, _depositor: string, amount: string) {
    const pool = await this.findOne(poolId);
    const current = BigInt(pool.totalDeposited);
    if (current < BigInt(amount)) throw new BadRequestException('Insufficient deposit');
    return this.prisma.fundingPool.update({
      where: { id: poolId },
      data: { totalDeposited: (current - BigInt(amount)).toString() },
    });
  }

  async allocate(poolId: number, curator: string, dto: AllocateDto) {
    const pool = await this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    if (pool.status !== 0) throw new BadRequestException('Pool not active');
    const available = BigInt(pool.totalDeposited) - BigInt(pool.totalDisbursed);
    if (available < BigInt(dto.amount)) throw new BadRequestException('Insufficient pool balance');
    return this.prisma.fundingPool.update({
      where: { id: poolId },
      data: {
        totalDisbursed: (BigInt(pool.totalDisbursed) + BigInt(dto.amount)).toString(),
        recipientCount: pool.recipientCount + 1,
      },
    });
  }

  async pausePool(poolId: number, curator: string) {
    const pool = await this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    return this.prisma.fundingPool.update({ where: { id: poolId }, data: { status: 1 } });
  }

  async resumePool(poolId: number, curator: string) {
    const pool = await this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    if (pool.status !== 1) throw new BadRequestException('Not paused');
    return this.prisma.fundingPool.update({ where: { id: poolId }, data: { status: 0 } });
  }

  async closePool(poolId: number, curator: string) {
    const pool = await this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    return this.prisma.fundingPool.update({ where: { id: poolId }, data: { status: 2 } });
  }

  async getAvailableBalance(poolId: number) {
    const pool = await this.findOne(poolId);
    return (BigInt(pool.totalDeposited) - BigInt(pool.totalDisbursed)).toString();
  }

  async getStats() {
    const pools = await this.prisma.fundingPool.findMany();
    let deposited = 0n;
    let disbursed = 0n;
    for (const p of pools) {
      deposited += BigInt(p.totalDeposited);
      disbursed += BigInt(p.totalDisbursed);
    }
    return { totalPoolsCreated: pools.length, totalValueDeposited: deposited.toString(), totalValueDisbursed: disbursed.toString() };
  }
}
