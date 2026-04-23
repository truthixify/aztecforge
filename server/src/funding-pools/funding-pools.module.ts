import { Module } from '@nestjs/common';
import { FundingPoolsController } from './funding-pools.controller';
import { FundingPoolsService } from './funding-pools.service';

@Module({
  controllers: [FundingPoolsController],
  providers: [FundingPoolsService],
  exports: [FundingPoolsService],
})
export class FundingPoolsModule {}
