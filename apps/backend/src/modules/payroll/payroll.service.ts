import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAndCreatePayroll(employeeId: string, taxRatePercentage: number = 15.0) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { attendance: true }
    });

    if (!employee) {
      throw new NotFoundException(`Employee not found with id ${employeeId}`);
    }

    // Sum total clock hours from attendance records
    let totalHours = 0;
    for (const att of employee.attendance) {
      if (att.clockIn && att.clockOut) {
        const diffMs = att.clockOut.getTime() - att.clockIn.getTime();
        totalHours += diffMs / (1000 * 60 * 60);
      } else if (att.clockIn && !att.clockOut) {
        const diffMs = Date.now() - att.clockIn.getTime();
        totalHours += diffMs / (1000 * 60 * 60);
      }
    }

    totalHours = Math.round(totalHours * 100) / 100;
    if (totalHours <= 0) {
      totalHours = 8.0;
    }

    const hourlyRate = employee.hourlyRate;
    const grossPay = Math.round(totalHours * hourlyRate * 100) / 100;
    const taxDeductions = Math.round(grossPay * (taxRatePercentage / 100) * 100) / 100;
    const netPay = Math.round((grossPay - taxDeductions) * 100) / 100;

    const payroll = await this.prisma.payroll.create({
      data: {
        employeeId: employee.id,
        payPeriodStart: new Date(Date.now() - 86400000 * 14),
        payPeriodEnd: new Date(),
        grossPay,
        netPay,
        isPaid: false
      },
      include: { employee: { include: { user: true } } }
    });

    return {
      ...payroll,
      totalHours,
      taxDeductions
    };
  }

  async getEmployeePayrollHistory(employeeId: string, from?: string, to?: string) {
    const where: any = { employeeId };
    if (from || to) {
      where.payPeriodStart = {};
      if (from) where.payPeriodStart.gte = new Date(from);
      if (to) where.payPeriodStart.lte = new Date(to);
    }

    const payrolls = await this.prisma.payroll.findMany({
      where,
      include: { employee: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return payrolls.map((p) => {
      const estimatedHours = p.employee?.hourlyRate ? Math.round((p.grossPay / p.employee.hourlyRate) * 100) / 100 : 0;
      const estimatedTax = Math.round((p.grossPay - p.netPay) * 100) / 100;
      return {
        ...p,
        totalHours: estimatedHours,
        taxDeductions: estimatedTax
      };
    });
  }

  async markPayrollPaid(payrollId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId }
    });

    if (!payroll) {
      throw new NotFoundException(`Payroll record not found with id ${payrollId}`);
    }

    return this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        isPaid: true
      }
    });
  }
}
