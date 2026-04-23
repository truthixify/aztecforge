import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FundingPool, PoolStatus, PoolStats } from '../common/entities/funding-pool.entity';
import { CreatePoolDto, DepositDto, AllocateDto } from './dto/create-pool.dto';

@Injectable()
export class FundingPoolsService {
  private pools: Map<number, FundingPool & { purpose: string }> = new Map();
  private deposits: Map<string, string> = new Map(); // key: `${poolId}:${depositor}` -> amount
  private allocations: Map<string, string> = new Map(); // key: `${poolId}:${recipient}` -> amount
  private nextId = 0;

  create(dto: CreatePoolDto, curator: string): FundingPool & { purpose: string } {
    const id = this.nextId++;
    const pool = {
      id,
      curator,
      paymentToken: dto.paymentToken,
      purposeHash: this.hash(dto.purpose),
      poolType: dto.poolType,
      status: PoolStatus.ACTIVE,
      totalDeposited: '0',
      totalDisbursed: '0',
      contributorCount: 0,
      recipientCount: 0,
      purpose: dto.purpose,
    };
    this.pools.set(id, pool);
    return pool;
  }

  findAll(): (FundingPool & { purpose: string })[] {
    return Array.from(this.pools.values());
  }

  findOne(id: number): FundingPool & { purpose: string } {
    const pool = this.pools.get(id);
    if (!pool) throw new NotFoundException(`Pool #${id} not found`);
    return pool;
  }

  deposit(poolId: number, depositor: string, dto: DepositDto): FundingPool {
    const pool = this.findOne(poolId);
    if (pool.status !== PoolStatus.ACTIVE) throw new BadRequestException('Pool not active');

    const key = `${poolId}:${depositor}`;
    const existing = BigInt(this.deposits.get(key) ?? '0');
    if (existing === 0n) pool.contributorCount++;
    this.deposits.set(key, (existing + BigInt(dto.amount)).toString());

    pool.totalDeposited = (BigInt(pool.totalDeposited) + BigInt(dto.amount)).toString();
    return pool;
  }

  withdraw(poolId: number, depositor: string, amount: string): FundingPool {
    const pool = this.findOne(poolId);
    const key = `${poolId}:${depositor}`;
    const current = BigInt(this.deposits.get(key) ?? '0');
    if (current < BigInt(amount)) throw new BadRequestException('Insufficient deposit');

    this.deposits.set(key, (current - BigInt(amount)).toString());
    pool.totalDeposited = (BigInt(pool.totalDeposited) - BigInt(amount)).toString();
    return pool;
  }

  allocate(poolId: number, curator: string, dto: AllocateDto): FundingPool {
    const pool = this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    if (pool.status !== PoolStatus.ACTIVE) throw new BadRequestException('Pool not active');

    const available = BigInt(pool.totalDeposited) - BigInt(pool.totalDisbursed);
    if (available < BigInt(dto.amount)) throw new BadRequestException('Insufficient pool balance');

    const allocKey = `${poolId}:${dto.recipient}`;
    const existing = BigInt(this.allocations.get(allocKey) ?? '0');
    if (existing === 0n) pool.recipientCount++;
    this.allocations.set(allocKey, (existing + BigInt(dto.amount)).toString());

    pool.totalDisbursed = (BigInt(pool.totalDisbursed) + BigInt(dto.amount)).toString();
    return pool;
  }

  pausePool(poolId: number, curator: string): FundingPool {
    const pool = this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    pool.status = PoolStatus.PAUSED;
    return pool;
  }

  resumePool(poolId: number, curator: string): FundingPool {
    const pool = this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    if (pool.status !== PoolStatus.PAUSED) throw new BadRequestException('Not paused');
    pool.status = PoolStatus.ACTIVE;
    return pool;
  }

  closePool(poolId: number, curator: string): FundingPool {
    const pool = this.findOne(poolId);
    if (pool.curator !== curator) throw new BadRequestException('Not the curator');
    pool.status = PoolStatus.CLOSED;
    return pool;
  }

  getAvailableBalance(poolId: number): string {
    const pool = this.findOne(poolId);
    return (BigInt(pool.totalDeposited) - BigInt(pool.totalDisbursed)).toString();
  }

  getStats(): PoolStats {
    const all = Array.from(this.pools.values());
    return {
      totalPoolsCreated: all.length,
      totalValueDeposited: all.reduce((s, p) => s + BigInt(p.totalDeposited), 0n).toString(),
      totalValueDisbursed: all.reduce((s, p) => s + BigInt(p.totalDisbursed), 0n).toString(),
    };
  }

  private hash(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
    }
    return '0x' + Math.abs(h).toString(16).padStart(8, '0');
  }
}
