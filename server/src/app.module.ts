import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BountiesModule } from './bounties/bounties.module';
import { ReputationModule } from './reputation/reputation.module';
import { FundingPoolsModule } from './funding-pools/funding-pools.module';
import { PeerAllocationModule } from './peer-allocation/peer-allocation.module';
import { HackathonsModule } from './hackathons/hackathons.module';
import { QuestsModule } from './quests/quests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BountiesModule,
    ReputationModule,
    FundingPoolsModule,
    PeerAllocationModule,
    HackathonsModule,
    QuestsModule,
  ],
})
export class AppModule {}
