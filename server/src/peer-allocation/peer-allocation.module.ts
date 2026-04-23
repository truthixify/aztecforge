import { Module } from '@nestjs/common';
import { PeerAllocationController } from './peer-allocation.controller';
import { PeerAllocationService } from './peer-allocation.service';

@Module({
  controllers: [PeerAllocationController],
  providers: [PeerAllocationService],
  exports: [PeerAllocationService],
})
export class PeerAllocationModule {}
