import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(branchId: string) {
    const totalOrders = await this.prisma.order.count({ where: { branchId } });
    
    // Fetch all completed/paid orders with items and recipes for COGS calculation
    const paidOrders = await this.prisma.order.findMany({
      where: { branchId, status: { in: ['PAID', 'COMPLETED'] } },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                ingredients: {
                  include: { ingredient: true }
                }
              }
            }
          }
        }
      }
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalTax = paidOrders.reduce((sum, o) => sum + o.taxAmount, 0);
    const totalTips = paidOrders.reduce((sum, o) => sum + o.tipAmount, 0);

    // Calculate COGS across recipe ingredients
    let totalCOGS = 0;
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (item.menuItem?.ingredients) {
          for (const recipeItem of item.menuItem.ingredients) {
            const ingredientCost = recipeItem.quantityRequired * recipeItem.ingredient.costPerUnit;
            totalCOGS += ingredientCost * item.quantity;
          }
        }
      }
    }

    totalCOGS = Math.round(totalCOGS * 100) / 100;
    const grossProfit = Math.round((totalRevenue - totalCOGS) * 100) / 100;
    const netMarginPercentage = totalRevenue > 0 ? Math.round(((totalRevenue - totalCOGS) / totalRevenue) * 10000) / 100 : 0;

    // Build Peak-Hour Heatmap Matrix (7 days x 24 hours)
    const heatmapMatrix: Array<Array<{ hour: number; day: number; orderCount: number; revenue: number }>> = [];
    for (let day = 0; day < 7; day++) {
      const dayRow = [];
      for (let hour = 0; hour < 24; hour++) {
        dayRow.push({ day, hour, orderCount: 0, revenue: 0 });
      }
      heatmapMatrix.push(dayRow);
    }

    const allOrders = await this.prisma.order.findMany({
      where: { branchId },
      select: { createdAt: true, totalAmount: true }
    });

    for (const ord of allOrders) {
      const date = new Date(ord.createdAt);
      const day = date.getDay(); // 0 (Sun) - 6 (Sat)
      const hour = date.getHours(); // 0 - 23
      heatmapMatrix[day][hour].orderCount += 1;
      heatmapMatrix[day][hour].revenue += ord.totalAmount;
    }

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
          quantitySold: d._sum.quantity || 0,
          revenue: `$${((d._sum.quantity || 0) * (menuItem?.basePrice || 0)).toFixed(2)}`
        };
      })
    );

    return {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCOGS,
        grossProfit,
        netMarginPercentage,
        totalOrders,
        totalTax: Math.round(totalTax * 100) / 100,
        totalTips: Math.round(totalTips * 100) / 100,
        occupancyRate: totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0,
        activeTables,
        totalTables
      },
      heatmapMatrix,
      topDishes: topDishesWithDetails
    };
  }
}
