import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReservationStatus, TableStatus, UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Tables & Floor Plan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @ApiOperation({ summary: 'Get branch tables layout' })
  @Get()
  async getTables(@Query('branchId') branchId: string) {
    return this.tablesService.getTables(branchId);
  }

  @ApiOperation({ summary: 'Update table status (interactive floor plan)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.WAITER, UserRole.CASHIER)
  @Patch(':id/status')
  async updateTableStatus(@Param('id') id: string, @Body('status') status: TableStatus) {
    return this.tablesService.updateTableStatus(id, status);
  }

  @ApiOperation({ summary: 'Get branch reservations' })
  @Get('reservations')
  async getReservations(@Query('branchId') branchId: string) {
    return this.tablesService.getReservations(branchId);
  }

  @ApiOperation({ summary: 'Create a new table reservation' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.WAITER, UserRole.CASHIER)
  @Post('reservations')
  async createReservation(@Body() body: any) {
    return this.tablesService.createReservation(body);
  }

  @ApiOperation({ summary: 'Update reservation status (check-in, cancel, no-show...)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.WAITER, UserRole.CASHIER)
  @Patch('reservations/:id/status')
  async updateReservationStatus(@Param('id') id: string, @Body('status') status: ReservationStatus) {
    return this.tablesService.updateReservationStatus(id, status);
  }

  @ApiOperation({ summary: 'Delete reservation (remove checked-in/cancelled reservation)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.WAITER, UserRole.CASHIER)
  @Delete('reservations/:id')
  async deleteReservation(@Param('id') id: string) {
    return this.tablesService.deleteReservation(id);
  }
}
