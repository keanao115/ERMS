import { Controller, Get, Param, Post, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Workforce & HR Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({ summary: 'Get staff directory' })
  @Get()
  async getEmployees(@Query('branchId') branchId: string) {
    return this.employeesService.getEmployees(branchId);
  }

  @ApiOperation({ summary: 'Get current logged-in employee profile and latest shift/attendance' })
  @Get('me')
  async getMyEmployeeProfile(@CurrentUser('id') userId: string) {
    return this.employeesService.getEmployeeByUserId(userId);
  }

  @ApiOperation({ summary: 'Get employee attendance history & weekly timesheet summary' })
  @Get(':id/attendance')
  async getEmployeeAttendance(
    @Param('id') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.employeesService.getEmployeeAttendance(employeeId, from, to);
  }

  @ApiOperation({ summary: 'Correct/edit an attendance record (Store Manager only)' })
  @Roles(UserRole.STORE_MANAGER)
  @Patch('attendance/:attendanceId')
  async updateAttendance(
    @Param('attendanceId') attendanceId: string,
    @Body() body: { clockIn?: string; clockOut?: string }
  ) {
    return this.employeesService.updateAttendance(attendanceId, body);
  }

  @ApiOperation({ summary: 'Get shift schedule' })
  @Get('shifts')
  async getShifts(@Query('branchId') branchId: string) {
    return this.employeesService.getShifts(branchId);
  }

  @ApiOperation({ summary: 'Create employee shift (Managers & HR)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.HR)
  @Post('shifts')
  async createShift(@Body() body: any) {
    return this.employeesService.createShift(body);
  }

  @ApiOperation({ summary: 'Update or approve employee shift (Managers & HR)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.HR)
  @Patch('shifts/:id')
  async updateShift(@Param('id') shiftId: string, @Body() body: any) {
    return this.employeesService.updateShift(shiftId, body);
  }

  @ApiOperation({ summary: 'Clock an employee in for their shift' })
  @Post(':id/clock-in')
  async clockIn(@Param('id') id: string) {
    return this.employeesService.clockIn(id);
  }

  @ApiOperation({ summary: 'Clock an employee out of their shift' })
  @Post(':id/clock-out')
  async clockOut(@Param('id') id: string) {
    return this.employeesService.clockOut(id);
  }
}
