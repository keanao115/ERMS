import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, OrderItemStatus, PaymentStatus, TableStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async createOrder(data: any, userId?: string) {
    const { branchId, tableId, orderType, customerName, customerPhone, items } = data;

    // Calculate item pricing & station mapping
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

    const taxAmount = Math.round(subtotal * 0.08875 * 100) / 100; // 8.875% tax
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

    // If table assigned, set status to OCCUPIED
    if (tableId) {
      await this.prisma.table.update({
        where: { id: tableId },
        data: { status: TableStatus.OCCUPIED }
      });
    }

    // Emit Domain Event: OrderPlaced (triggers KDS WS broadcast & inventory deduction monitor)
    this.eventEmitter.emit('order.placed', {
      eventId: uuidv4(),
      eventName: 'OrderPlaced',
      timestamp: new Date().toISOString(),
      aggregateId: order.id,
      payload: order
    });

    return order;
  }

  async getOrders(branchId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        ...(status ? { status } : {})
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
    }

    // Emit Domain Event: PaymentCompleted (triggers automated inventory stock deduction)
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
}
