import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTables(branchId: string) {
    return this.prisma.table.findMany({
      where: { branchId },
      orderBy: { tableNumber: 'asc' }
    });
  }

  async getReservations(branchId: string) {
    return this.prisma.reservation.findMany({
      where: { branchId },
      include: { table: true },
      orderBy: { reservationTime: 'asc' }
    });
  }
}
