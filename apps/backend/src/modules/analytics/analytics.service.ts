import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(branchId: string) {
    const totalOrders = await this.prisma.order.count({ where: { branchId } });
    const paidOrders = await this.prisma.order.findMany({
      where: { branchId, status: { in: ['PAID', 'COMPLETED'] } },
      select: { totalAmount: true, subtotal: true, taxAmount: true, tipAmount: true }
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + o.taxAmount, 0);
    const totalTips = paidOrders.reduce((sum, o) => sum + o.tipAmount, 0);

    const activeTables = await this.prisma.table.count({
      where: { branchId, status: 'OCCUPIED' }
    });
    const totalTables = await this.prisma.table.count({ where: { branchId } });

    // Popular dishes
    const topDishes = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topDishesWithDetails = await Promise.all(
      topDishes.map(async (d) => {
        const menuItem = await this.prisma.menuItem.findUnique({
          where: { id: d.menuItemId }
        });
        return {
          menuItemId: d.menuItemId,
          name: menuItem?.name || 'Unknown',
          quantitySold: d._sum.quantity || 0
        };
      })
    );

    return {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalTax: Math.round(totalTax * 100) / 100,
        totalTips: Math.round(totalTips * 100) / 100,
        occupancyRate: totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0,
        activeTables,
        totalTables
      },
      topDishes: topDishesWithDetails
    };
  }
}
