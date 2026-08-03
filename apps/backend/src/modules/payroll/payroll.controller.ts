import { Controller, Post, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Workforce Payroll & Wage Accounting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @ApiOperation({ summary: 'Calculate and issue payroll for employee (Store Manager only)' })
  @Roles(UserRole.STORE_MANAGER)
  @Post('employees/:id')
  async calculatePayroll(
    @Param('id') employeeId: string,
    @Body() body: { taxRatePercentage?: number }
  ) {
    return this.payrollService.calculateAndCreatePayroll(employeeId, body?.taxRatePercentage);
  }

  @ApiOperation({ summary: 'Query employee payroll history by date range' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.HR, UserRole.ACCOUNTANT)
  @Get('employees/:id')
  async getPayrollHistory(
    @Param('id') employeeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.payrollService.getEmployeePayrollHistory(employeeId, from, to);
  }

  @ApiOperation({ summary: 'Mark payroll record as paid (Store Manager only)' })
  @Roles(UserRole.STORE_MANAGER)
  @Patch(':id/mark-paid')
  async markPaid(@Param('id') id: string) {
    return this.payrollService.markPayrollPaid(id);
  }
}
