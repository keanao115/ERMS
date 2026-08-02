import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { KitchenStation } from '@prisma/client';

@Injectable()
export class KdsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStationQueue(branchId: string, station?: KitchenStation) {
    return this.prisma.orderItem.findMany({
      where: {
        order: { branchId },
        status: { in: ['QUEUED', 'COOKING'] },
        ...(station ? { station } : {})
      },
      include: {
        menuItem: true,
        variant: true,
        order: { include: { table: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
