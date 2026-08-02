import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: any) {
    const { items, branchId } = event.payload;
    this.logger.log(`⚡ Processing automated stock deduction for branch ${branchId}`);

    for (const item of items) {
      const recipes = await this.prisma.recipeIngredient.findMany({
        where: { menuItemId: item.menuItemId },
        include: { ingredient: true }
      });

      for (const recipe of recipes) {
        const totalDeduction = recipe.quantityRequired * item.quantity;
        const updated = await this.prisma.ingredient.update({
          where: { id: recipe.ingredientId },
          data: {
            currentStock: { decrement: totalDeduction }
          }
        });

        // Record stock transaction log
        await this.prisma.inventoryTransaction.create({
          data: {
            ingredientId: updated.id,
            branchId,
            delta: -totalDeduction,
            reason: `POS Order Deduction (Order Item #${item.id})`
          }
        });

        // Trigger low stock threshold alert if applicable
        if (updated.currentStock <= updated.minThreshold) {
          await this.prisma.notification.create({
            data: {
              branchId,
              title: `⚠️ Low Stock Alert: ${updated.name}`,
              message: `Stock level for ${updated.name} dropped to ${updated.currentStock} ${updated.unit} (Min Threshold: ${updated.minThreshold} ${updated.unit}).`,
              type: 'WARNING'
            }
          });
        }
      }
    }
  }

  async getIngredients(branchId: string) {
    return this.prisma.ingredient.findMany({
      where: { branchId },
      orderBy: { name: 'asc' }
    });
  }

  async getPurchaseOrders(branchId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { branchId },
      include: { supplier: true, items: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
}
