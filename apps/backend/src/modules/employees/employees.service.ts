import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployees(branchId: string) {
    return this.prisma.employee.findMany({
      where: { branchId },
      include: { user: true, shifts: true, attendance: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getShifts(branchId: string) {
    return this.prisma.shift.findMany({
      where: { branchId },
      include: { employee: { include: { user: true } } },
      orderBy: { startTime: 'asc' }
    });
  }
}
