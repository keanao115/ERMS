import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tables & Floor Plan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @ApiOperation({ summary: 'Get branch tables layout' })
  @Get()
  async getTables(@Query('branchId') branchId: string) {
    return this.tablesService.getTables(branchId);
  }

  @ApiOperation({ summary: 'Get branch reservations' })
  @Get('reservations')
  async getReservations(@Query('branchId') branchId: string) {
    return this.tablesService.getReservations(branchId);
  }
}
