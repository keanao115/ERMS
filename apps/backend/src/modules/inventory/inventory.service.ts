import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async createPurchaseOrder(data: { branchId: string; supplierId: string; expectedDate?: string; items: { ingredientId: string; quantity: number; unitCost: number }[] }, userId?: string) {
    let totalCost = 0;
    const itemsToCreate = data.items.map((it) => {
      const cost = it.quantity * it.unitCost;
      totalCost += cost;
      return {
        ingredientId: it.ingredientId,
        quantity: it.quantity,
        unitCost: it.unitCost,
        totalCost: cost
      };
    });

    const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    return this.prisma.purchaseOrder.create({
      data: {
        branchId: data.branchId,
        supplierId: data.supplierId,
        poNumber,
        status: 'SUBMITTED',
        totalCost,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : new Date(Date.now() + 86400000 * 3),
        items: {
          create: itemsToCreate
        }
      },
      include: { supplier: true, items: { include: { ingredient: true } } }
    });
  }

  async receivePurchaseOrder(poId: string, userId?: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true }
    });

    if (!po) throw new NotFoundException(`Purchase Order not found: ${poId}`);
    if (po.status === 'RECEIVED') throw new BadRequestException('Purchase order has already been received.');

    // Increment ingredient stock for every item in PO
    for (const item of po.items) {
      await this.prisma.ingredient.update({
        where: { id: item.ingredientId },
        data: { currentStock: { increment: item.quantity } }
      });

      await this.prisma.inventoryTransaction.create({
        data: {
          ingredientId: item.ingredientId,
          branchId: po.branchId,
          delta: item.quantity,
          reason: `Purchase Order Received (#${po.poNumber})`,
          createdById: userId
        }
      });
    }

    return this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'RECEIVED' },
      include: { supplier: true, items: { include: { ingredient: true } } }
    });
  }

  async restockIngredient(ingredientId: string, quantity: number, userId?: string) {
    if (!quantity || quantity <= 0) {
      throw new BadRequestException('Restock quantity must be positive');
    }

    const updated = await this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: { increment: quantity } }
    });

    await this.prisma.inventoryTransaction.create({
      data: {
        ingredientId,
        branchId: updated.branchId,
        delta: quantity,
        reason: 'Manual Restock',
        createdById: userId
      }
    });

    this.logger.log(`📦 Restocked ${quantity} ${updated.unit} of ${updated.name}`);
    return updated;
  }

  async getTransactions(branchId: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: { branchId },
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
