import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { SenderMiddleware } from './sender.middleware';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ListingsModule } from './listings/listings.module';
import { FundingPoolsModule } from './funding-pools/funding-pools.module';
import { PeerAllocationModule } from './peer-allocation/peer-allocation.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    OrganizationsModule,
    ListingsModule,
    FundingPoolsModule,
    PeerAllocationModule,
    StatsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SenderMiddleware).forRoutes('*path');
  }
}
