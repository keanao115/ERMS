import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReservationStatus, TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTables(branchId: string) {
    return this.prisma.table.findMany({
      where: { branchId },
      orderBy: { tableNumber: 'asc' }
    });
  }

  async updateTableStatus(id: string, status: TableStatus) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) {
      throw new NotFoundException(`Table not found: ${id}`);
    }

    const updated = await this.prisma.table.update({
      where: { id },
      data: { status }
    });

    // Task 3: When table becomes AVAILABLE, auto-clear checked-in or past seating reservations linked to this table
    if (status === TableStatus.AVAILABLE) {
      await this.prisma.reservation.deleteMany({
        where: {
          tableId: id,
          OR: [
            { status: ReservationStatus.CHECKED_IN },
            { status: ReservationStatus.COMPLETED },
            { status: ReservationStatus.CANCELLED },
            { status: ReservationStatus.CONFIRMED, reservationTime: { lte: new Date() } }
          ]
        }
      });
    }

    return updated;
  }

  async getReservations(branchId: string) {
    return this.prisma.reservation.findMany({
      where: { branchId },
      include: { table: true },
      orderBy: { reservationTime: 'asc' }
    });
  }

  async createReservation(data: any) {
    const { branchId, tableId, guestName, guestEmail, guestPhone, partySize, reservationTime, notes } = data;

    if (tableId) {
      const table = await this.prisma.table.findUnique({ where: { id: tableId } });
      if (!table) {
        throw new NotFoundException(`Table not found: ${tableId}`);
      }
    }

    return this.prisma.reservation.create({
      data: {
        branchId,
        tableId: tableId || null,
        guestName,
        guestEmail,
        guestPhone,
        partySize: Number(partySize),
        reservationTime: new Date(reservationTime),
        notes
      },
      include: { table: true }
    });
  }

  async updateReservationStatus(id: string, status: ReservationStatus) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException(`Reservation not found: ${id}`);
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true }
    });

    if (status === ReservationStatus.CHECKED_IN && reservation.tableId) {
      await this.prisma.table.update({
        where: { id: reservation.tableId },
        data: { status: TableStatus.OCCUPIED }
      });
    }

    return updated;
  }

  async deleteReservation(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException(`Reservation not found: ${id}`);
    }

    await this.prisma.reservation.delete({
      where: { id }
    });

    return { success: true, id };
  }
}
