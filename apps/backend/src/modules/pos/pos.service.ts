import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, OrderItemStatus, PaymentStatus, TableStatus, UserRole, AuditAction } from '@prisma/client';
import { AdaptersService } from '../adapters/adapters.service';
import { v4 as uuidv4 } from 'uuid';

export interface CancellationActor {
  userId: string;
  name: string;
  role: string;
  source: 'POS_MANAGER' | 'KDS_KITCHEN';
}

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly adaptersService: AdaptersService
  ) {}

  async createOrder(data: any, userId?: string) {
    const { branchId, tableId, orderType, customerName, customerPhone, items } = data;

    let subtotal = 0;
    const orderItemsToCreate: any[] = [];

    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { variants: true, addons: true }
      });

      if (!menuItem) {
        throw new NotFoundException(`Menu item not found: ${item.menuItemId}`);
      }

      let unitPrice = menuItem.basePrice;
      if (item.variantId) {
        const variant = menuItem.variants.find((v) => v.id === item.variantId);
        if (variant) {
          unitPrice += variant.priceDelta;
        }
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItemsToCreate.push({
        menuItemId: item.menuItemId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        notes: item.notes,
        status: OrderItemStatus.QUEUED,
        station: menuItem.station,
        timerStartedAt: new Date()
      });
    }

    const taxAmount = Math.round(subtotal * 0.08875 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const order = await this.prisma.order.create({
      data: {
        branchId,
        tableId,
        createdById: userId,
        orderNumber,
        orderType,
        status: OrderStatus.PLACED,
        customerName,
        customerPhone,
        subtotal,
        taxAmount,
        totalAmount,
        items: {
          create: orderItemsToCreate
        }
      },
      include: {
        items: {
          include: { menuItem: true, variant: true }
        },
        table: true
      }
    });

    if (tableId) {
      await this.prisma.table.update({
        where: { id: tableId },
        data: { status: TableStatus.OCCUPIED }
      });
    }

    this.eventEmitter.emit('order.placed', {
      eventId: uuidv4(),
      eventName: 'OrderPlaced',
      timestamp: new Date().toISOString(),
      aggregateId: order.id,
      payload: order
    });

    return order;
  }

  async appendItemsToOrder(orderId: string, items: any[], userId?: string) {
    if (!items || items.length === 0) {
      throw new BadRequestException('At least one item is required to append');
    }

    const existingOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true }
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }

    let addedSubtotal = 0;
    const orderItemsToCreate: any[] = [];

    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { variants: true }
      });

      if (!menuItem) {
        throw new NotFoundException(`Menu item not found: ${item.menuItemId}`);
      }

      let unitPrice = menuItem.basePrice;
      if (item.variantId) {
        const variant = menuItem.variants.find((v) => v.id === item.variantId);
        if (variant) unitPrice += variant.priceDelta;
      }

      const itemTotal = unitPrice * item.quantity;
      addedSubtotal += itemTotal;

      orderItemsToCreate.push({
        orderId,
        menuItemId: item.menuItemId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        notes: item.notes,
        status: OrderItemStatus.QUEUED,
        station: menuItem.station,
        timerStartedAt: new Date()
      });
    }

    const addedTax = Math.round(addedSubtotal * 0.08875 * 100) / 100;
    const addedTotal = Math.round((addedSubtotal + addedTax) * 100) / 100;

    let createdItems: any[] = [];

    await this.prisma.$transaction(async (tx) => {
      // Atomic status lock
      const lockResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: [OrderStatus.PLACED, OrderStatus.IN_PREPARATION] }
        },
        data: {
          subtotal: { increment: addedSubtotal },
          taxAmount: { increment: addedTax },
          totalAmount: { increment: addedTotal }
        }
      });

      if (lockResult.count === 0) {
        throw new ConflictException(`Cannot append items: Order #${existingOrder.orderNumber} is no longer active.`);
      }

      for (const itemData of orderItemsToCreate) {
        const created = await tx.orderItem.create({
          data: itemData,
          include: { menuItem: true, variant: true }
        });
        createdItems.push(created);
      }
    });

    // Broadcast newly added items to KDS via dedicated event
    this.eventEmitter.emit('order.items_appended', {
      eventId: uuidv4(),
      eventName: 'OrderItemsAppended',
      timestamp: new Date().toISOString(),
      aggregateId: orderId,
      payload: {
        orderId,
        orderNumber: existingOrder.orderNumber,
        tableNumber: existingOrder.table?.tableNumber ?? 'Takeout',
        items: createdItems
      }
    });

    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true, variant: true } },
        table: true,
        payments: true
      }
    });
  }

  async getActiveOrderForTable(tableId: string, userBranchId?: string) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundException(`Table not found: ${tableId}`);

    if (userBranchId && table.branchId !== userBranchId) {
      throw new ForbiddenException(`Tenant Isolation Security Violation: Table branch '${table.branchId}' does not match user branch '${userBranchId}'.`);
    }

    return this.prisma.order.findFirst({
      where: {
        tableId,
        status: { notIn: [OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED] }
      },
      include: {
        items: { include: { menuItem: { include: { variants: true, addons: true } }, variant: true } },
        payments: true,
        table: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrders(branchId: string, status?: OrderStatus, tableId?: string) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        ...(status ? { status } : {}),
        ...(tableId ? { tableId } : {})
      },
      include: {
        items: { include: { menuItem: true, variant: true } },
        table: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async settlePayment(data: { orderId: string; payments: any[] }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: { include: { menuItem: true } } }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const createdPayments: any[] = [];
    let totalPaid = 0;
    let totalTips = 0;

    for (const p of data.payments) {
      if (p.paymentMethod === 'CREDIT_CARD' || p.paymentMethod === 'APPLE_PAY') {
        await this.adaptersService.processStripePayment({
          amount: p.amount,
          currency: 'usd',
          paymentMethodId: `pm_${uuidv4().slice(0, 8)}`
        });
      }

      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          tipAmount: p.tipAmount || 0,
          seatNumber: p.seatNumber,
          status: PaymentStatus.COMPLETED,
          transactionRef: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`
        }
      });
      createdPayments.push(payment);
      totalPaid += p.amount;
      totalTips += p.tipAmount || 0;
    }

    const isFullyPaid = totalPaid >= order.totalAmount;
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        tipAmount: totalTips,
        status: isFullyPaid ? OrderStatus.PAID : OrderStatus.PLACED
      },
      include: { payments: true, table: true }
    });

    if (isFullyPaid && order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: TableStatus.BUSSING }
      });

      await this.adaptersService.syncQuickBooksLedger({
        transactionDate: new Date().toISOString(),
        totalRevenue: updatedOrder.totalAmount,
        totalTax: updatedOrder.taxAmount,
        totalTips: updatedOrder.tipAmount
      });
    }

    this.eventEmitter.emit('payment.completed', {
      eventId: uuidv4(),
      eventName: 'PaymentCompleted',
      timestamp: new Date().toISOString(),
      aggregateId: order.id,
      payload: {
        orderId: order.id,
        branchId: order.branchId,
        items: order.items,
        totalPaid
      }
    });

    return updatedOrder;
  }

  async voidOrder(
    orderId: string,
    actor: CancellationActor,
    reason: string,
    isRefund: boolean = false
  ) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Cancellation reason is required and cannot be empty.');
    }

    const trimmedReason = reason.trim();
    let voidedItemIds: string[] = [];
    let targetOrder: any = null;

    await this.prisma.$transaction(async (tx) => {
      // 1. Fetch order with items and ingredients
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              menuItem: {
                include: { ingredients: true }
              }
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order not found: ${orderId}`);
      }

      targetOrder = order;

      // 2. Atomic status lock against concurrent cancellations
      const lockResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: [OrderStatus.PLACED, OrderStatus.IN_PREPARATION] }
        },
        data: {
          status: isRefund ? OrderStatus.REFUNDED : OrderStatus.CANCELLED
        }
      });

      if (lockResult.count === 0) {
        throw new ConflictException(`Order #${order.orderNumber} is not in an active cancelable state or was already processed.`);
      }

      // 3. Mark all non-SERVED order items as VOIDED
      const nonServedItems = order.items.filter((it) => it.status !== OrderItemStatus.SERVED);
      voidedItemIds = nonServedItems.map((it) => it.id);

      if (nonServedItems.length > 0) {
        await tx.orderItem.updateMany({
          where: {
            id: { in: voidedItemIds }
          },
          data: { status: OrderItemStatus.VOIDED }
        });
      }

      // 4. Restore ingredient stock & record InventoryTransaction rows
      for (const item of nonServedItems) {
        if (item.menuItem?.ingredients) {
          for (const recipeItem of item.menuItem.ingredients) {
            const qtyToRestore = recipeItem.quantityRequired * item.quantity;

            await tx.ingredient.update({
              where: { id: recipeItem.ingredientId },
              data: { currentStock: { increment: qtyToRestore } }
            });

            await tx.inventoryTransaction.create({
              data: {
                ingredientId: recipeItem.ingredientId,
                branchId: order.branchId,
                delta: qtyToRestore,
                reason: 'Order Void/Refund Restock',
                createdById: actor.userId
              }
            });
          }
        }
      }

      // 5. Smart table release (R3): Only release table if no other active order exists for table
      if (order.tableId) {
        const otherActiveOrder = await tx.order.findFirst({
          where: {
            tableId: order.tableId,
            id: { not: orderId },
            status: { notIn: [OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED] }
          }
        });

        if (!otherActiveOrder) {
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: TableStatus.AVAILABLE }
          });
        }
      }

      // 6. Write AuditLog entry with actor attribution & payload
      const beforeState = JSON.stringify({ status: order.status, totalAmount: order.totalAmount });
      const afterState = JSON.stringify({
        status: isRefund ? 'REFUNDED' : 'CANCELLED',
        reason: trimmedReason,
        actorName: actor.name,
        source: actor.source
      });

      const auditPayload = JSON.stringify({
        actorUserId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        source: actor.source,
        reason: trimmedReason,
        cancelledAt: new Date().toISOString()
      });

      await tx.auditLog.create({
        data: {
          userId: actor.userId || 'SYSTEM',
          userRole: (actor.role as UserRole) || UserRole.STORE_MANAGER,
          action: isRefund ? AuditAction.REFUND_OVERRIDE : AuditAction.VOID_OVERRIDE,
          entityName: 'Order',
          entityId: orderId,
          beforeState,
          afterState,
          payload: auditPayload,
          ipAddress: '127.0.0.1',
          traceId: `TRC-VOID-${uuidv4().slice(0, 8)}`
        }
      });
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, table: true }
    });

    // 7. Emit order.voided event outside transaction for gateway broadcast
    this.eventEmitter.emit('order.voided', {
      eventId: uuidv4(),
      eventName: 'OrderVoided',
      timestamp: new Date().toISOString(),
      aggregateId: orderId,
      payload: {
        orderId,
        orderNumber: targetOrder?.orderNumber ?? 'N/A',
        tableId: targetOrder?.tableId ?? null,
        orderItemIds: voidedItemIds,
        reason: trimmedReason,
        actorName: actor.name,
        actorRole: actor.role,
        source: actor.source
      }
    });

    return updatedOrder;
  }

  async refundOrder(
    orderId: string,
    actor: CancellationActor,
    reason: string
  ) {
    return this.voidOrder(orderId, actor, reason, true);
  }
}
