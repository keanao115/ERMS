import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Workforce & HR Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({ summary: 'Get staff directory' })
  @Get()
  async getEmployees(@Query('branchId') branchId: string) {
    return this.employeesService.getEmployees(branchId);
  }

  @ApiOperation({ summary: 'Get shift schedule' })
  @Get('shifts')
  async getShifts(@Query('branchId') branchId: string) {
    return this.employeesService.getShifts(branchId);
  }
}
