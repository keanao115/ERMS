import { Module } from '@nestjs/common';
import { AdaptersService } from './adapters.service';
import { AdaptersController } from './adapters.controller';

@Module({
  controllers: [AdaptersController],
  providers: [AdaptersService],
  exports: [AdaptersService]
})
export class AdaptersModule {}
