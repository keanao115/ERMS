import { Module } from '@nestjs/common';
import { KdsService } from './kds.service';
import { KdsController } from './kds.controller';
import { KdsGateway } from './kds.gateway';
import { PosModule } from '../pos/pos.module';

@Module({
  imports: [PosModule],
  controllers: [KdsController],
  providers: [KdsService, KdsGateway],
  exports: [KdsService, KdsGateway]
})
export class KdsModule {}
