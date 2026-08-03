import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployees(branchId: string) {
    return this.prisma.employee.findMany({
      where: { branchId },
      include: {
        user: true,
        shifts: { orderBy: { startTime: 'desc' }, take: 1 },
        attendance: { orderBy: { clockIn: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getEmployeeByUserId(userId: string) {
    return this.prisma.employee.findFirst({
      where: { userId },
      include: {
        user: true,
        shifts: { orderBy: { startTime: 'desc' }, take: 1 },
        attendance: { orderBy: { clockIn: 'desc' }, take: 1 }
      }
    });
  }

  async getEmployeeAttendance(employeeId: string, from?: string, to?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });
    if (!employee) {
      throw new NotFoundException(`Employee not found: ${employeeId}`);
    }

    // Strictly scoped to employeeId only
    const where: any = { employeeId };
    if (from || to) {
      where.clockIn = {};
      if (from) where.clockIn.gte = new Date(from);
      if (to) where.clockIn.lte = new Date(to);
    }

    const attendanceRecords = await this.prisma.attendance.findMany({
      where,
      orderBy: { clockIn: 'desc' }
    });

    // Group attendance by Monday-Sunday Calendar Week
    const weeklyMap = new Map<string, { weekStart: string; weekEnd: string; totalHours: number; sessionCount: number }>();

    for (const record of attendanceRecords) {
      const date = new Date(record.clockIn);
      const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(date);
      monday.setDate(date.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekKey = monday.toISOString().split('T')[0];
      const weekEndStr = sunday.toISOString().split('T')[0];

      const existing = weeklyMap.get(weekKey) || {
        weekStart: weekKey,
        weekEnd: weekEndStr,
        totalHours: 0,
        sessionCount: 0
      };

      existing.totalHours += record.totalHours || 0;
      existing.sessionCount += 1;
      weeklyMap.set(weekKey, existing);
    }

    const weeklySummary = Array.from(weeklyMap.values())
      .map((w) => ({
        ...w,
        totalHours: Math.round(w.totalHours * 100) / 100
      }))
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    return {
      employee: {
        id: employee.id,
        name: `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim() || 'Employee',
        jobTitle: employee.jobTitle,
        hourlyRate: employee.hourlyRate
      },
      attendance: attendanceRecords,
      weeklySummary
    };
  }

  async updateAttendance(attendanceId: string, data: { clockIn?: string; clockOut?: string }) {
    const existing = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!existing) {
      throw new NotFoundException(`Attendance record not found: ${attendanceId}`);
    }

    const clockIn = data.clockIn ? new Date(data.clockIn) : existing.clockIn;
    const clockOut = data.clockOut !== undefined ? (data.clockOut ? new Date(data.clockOut) : null) : existing.clockOut;

    if (clockOut && clockOut < clockIn) {
      throw new BadRequestException('Clock-out time cannot be earlier than clock-in time');
    }

    let totalHours: number | null = null;
    if (clockOut) {
      totalHours = Math.round(((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        clockIn,
        clockOut,
        totalHours
      }
    });
  }

  async getShifts(branchId: string) {
    return this.prisma.shift.findMany({
      where: { branchId },
      include: { employee: { include: { user: true } } },
      orderBy: { startTime: 'asc' }
    });
  }

  async createShift(data: { branchId: string; employeeId: string; shiftType: any; startTime: string; endTime: string; isApproved?: boolean }) {
    return this.prisma.shift.create({
      data: {
        branchId: data.branchId,
        employeeId: data.employeeId,
        shiftType: data.shiftType || 'MORNING',
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        isApproved: data.isApproved ?? true
      },
      include: { employee: { include: { user: true } } }
    });
  }

  async updateShift(shiftId: string, data: { shiftType?: any; startTime?: string; endTime?: string; isApproved?: boolean }) {
    const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException(`Shift not found: ${shiftId}`);

    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...(data.shiftType ? { shiftType: data.shiftType } : {}),
        ...(data.startTime ? { startTime: new Date(data.startTime) } : {}),
        ...(data.endTime ? { endTime: new Date(data.endTime) } : {}),
        ...(data.isApproved !== undefined ? { isApproved: data.isApproved } : {})
      },
      include: { employee: { include: { user: true } } }
    });
  }

  async clockIn(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee not found: ${employeeId}`);
    }

    const openShift = await this.prisma.attendance.findFirst({
      where: { employeeId, clockOut: null }
    });
    if (openShift) {
      throw new BadRequestException('Employee is already clocked in');
    }

    return this.prisma.attendance.create({ data: { employeeId } });
  }

  async clockOut(employeeId: string) {
    const openShift = await this.prisma.attendance.findFirst({
      where: { employeeId, clockOut: null },
      orderBy: { clockIn: 'desc' }
    });
    if (!openShift) {
      throw new BadRequestException('Employee has no open attendance record to clock out of');
    }

    const clockOut = new Date();
    const totalHours = (clockOut.getTime() - openShift.clockIn.getTime()) / (1000 * 60 * 60);

    return this.prisma.attendance.update({
      where: { id: openShift.id },
      data: { clockOut, totalHours: Math.round(totalHours * 100) / 100 }
    });
  }
}
