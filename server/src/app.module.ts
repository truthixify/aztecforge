import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { SenderMiddleware } from './sender.middleware';
import { BountiesModule } from './bounties/bounties.module';
import { ReputationModule } from './reputation/reputation.module';
import { FundingPoolsModule } from './funding-pools/funding-pools.module';
import { PeerAllocationModule } from './peer-allocation/peer-allocation.module';
import { HackathonsModule } from './hackathons/hackathons.module';
import { QuestsModule } from './quests/quests.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BountiesModule,
    ReputationModule,
    FundingPoolsModule,
    PeerAllocationModule,
    HackathonsModule,
    QuestsModule,
    StatsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SenderMiddleware).forRoutes('*path');
  }
}
