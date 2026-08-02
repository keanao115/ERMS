import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { KdsService } from './kds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { KitchenStation } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Kitchen Display System (KDS)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kds')
export class KdsController {
  constructor(private readonly kdsService: KdsService) {}

  @ApiOperation({ summary: 'Get station tickets queue' })
  @Get('queue')
  async getQueue(@Query('branchId') branchId: string, @Query('station') station?: KitchenStation) {
    return this.kdsService.getStationQueue(branchId, station);
  }
}
