import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PosService, CancellationActor } from './pos.service';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus, TableStatus, OrderItemStatus } from '@prisma/client';

describe('PosService', () => {
  let service: PosService;
  let mockPrisma: any;
  let mockEventEmitter: any;
  let mockAdapters: any;

  beforeEach(() => {
    mockPrisma = {
      menuItem: { findUnique: vi.fn() },
      order: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn()
      },
      orderItem: { updateMany: vi.fn(), create: vi.fn() },
      ingredient: { update: vi.fn() },
      inventoryTransaction: { create: vi.fn() },
      table: { update: vi.fn(), findUnique: vi.fn() },
      payment: { create: vi.fn() },
      auditLog: { create: vi.fn() },
      $transaction: vi.fn((cb: any) => cb(mockPrisma))
    };

    mockEventEmitter = {
      emit: vi.fn()
    };

    mockAdapters = {
      processStripePayment: vi.fn(),
      syncQuickBooksLedger: vi.fn()
    };

    service = new PosService(mockPrisma as any, mockEventEmitter as any, mockAdapters as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute correct subtotal, tax (8.875%), and total for created order', async () => {
    mockPrisma.menuItem.findUnique.mockResolvedValue({
      id: 'item-1',
      basePrice: 40.00,
      station: 'GRILL',
      variants: [],
      addons: []
    });

    mockPrisma.order.create.mockImplementation((args: any) => Promise.resolve({
      id: 'order-123',
      orderNumber: 'ORD-100001',
      ...args.data
    }));

    const result = await service.createOrder({
      branchId: 'branch-1',
      items: [{ menuItemId: 'item-1', quantity: 2 }]
    }, 'user-1');

    expect(result.subtotal).toBe(80.00);
    expect(result.taxAmount).toBe(7.10);
    expect(result.totalAmount).toBe(87.10);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.placed', expect.anything());
  });

  it('should throw BadRequestException if voidOrder is called with empty reason', async () => {
    const actor: CancellationActor = {
      userId: 'user-1',
      name: 'Manager',
      role: 'STORE_MANAGER',
      source: 'POS_MANAGER'
    };

    await expect(service.voidOrder('order-1', actor, '')).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException (409) if atomic updateMany returns count === 0 on voidOrder', async () => {
    const actor: CancellationActor = {
      userId: 'user-1',
      name: 'Manager',
      role: 'STORE_MANAGER',
      source: 'POS_MANAGER'
    };

    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.CANCELLED,
      items: []
    });

    mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.voidOrder('order-1', actor, 'Duplicate void attempt')).rejects.toThrow(ConflictException);
  });

  it('should void order, restore stock, write InventoryTransaction and AuditLog when valid', async () => {
    const actor: CancellationActor = {
      userId: 'user-1',
      name: 'Manager',
      role: 'STORE_MANAGER',
      source: 'POS_MANAGER'
    };

    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      branchId: 'branch-1',
      tableId: 'table-1',
      status: OrderStatus.PLACED,
      totalAmount: 100,
      items: [
        {
          id: 'item-1',
          quantity: 2,
          status: OrderItemStatus.QUEUED,
          menuItem: {
            ingredients: [
              { ingredientId: 'ing-1', quantityRequired: 0.5 }
            ]
          }
        }
      ]
    });

    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.orderItem.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.ingredient.update.mockResolvedValue({});
    mockPrisma.inventoryTransaction.create.mockResolvedValue({});
    mockPrisma.order.findFirst.mockResolvedValue(null); // No other active order for table
    mockPrisma.table.update.mockResolvedValue({});
    mockPrisma.auditLog.create.mockResolvedValue({});

    await service.voidOrder('order-1', actor, 'Guest walked out');

    expect(mockPrisma.ingredient.update).toHaveBeenCalledWith({
      where: { id: 'ing-1' },
      data: { currentStock: { increment: 1.0 } } // 0.5 * 2
    });

    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ingredientId: 'ing-1',
        branchId: 'branch-1',
        delta: 1.0,
        reason: 'Order Void/Refund Restock'
      })
    });

    expect(mockPrisma.table.update).toHaveBeenCalledWith({
      where: { id: 'table-1' },
      data: { status: TableStatus.AVAILABLE }
    });

    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.voided', expect.anything());
  });

  it('should NOT reset table status to AVAILABLE if another active order exists for tableId', async () => {
    const actor: CancellationActor = {
      userId: 'user-1',
      name: 'Kitchen Staff',
      role: 'KITCHEN_STAFF',
      source: 'KDS_KITCHEN'
    };

    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      branchId: 'branch-1',
      tableId: 'table-1',
      status: OrderStatus.PLACED,
      items: []
    });

    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.orderItem.updateMany.mockResolvedValue({ count: 0 });
    // Another active order exists for table-1!
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-2', status: OrderStatus.PLACED });

    await service.voidOrder('order-1', actor, 'Kitchen error');

    expect(mockPrisma.table.update).not.toHaveBeenCalled();
  });

  it('should return active order for table in getActiveOrderForTable', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: 'table-1', branchId: 'branch-1' });
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'order-10',
      orderNumber: 'ORD-010',
      tableId: 'table-1',
      status: OrderStatus.PLACED
    });

    const activeOrder = await service.getActiveOrderForTable('table-1', 'branch-1');
    expect(activeOrder).toBeDefined();
    expect(activeOrder?.id).toBe('order-10');
  });

  it('should return null for getActiveOrderForTable when table has no active order or is paid/cancelled', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: 'table-1', branchId: 'branch-1' });
    mockPrisma.order.findFirst.mockResolvedValue(null);

    const activeOrder = await service.getActiveOrderForTable('table-1', 'branch-1');
    expect(activeOrder).toBeNull();
  });

  it('should throw ForbiddenException in getActiveOrderForTable if branch mismatch occurs (IDOR guard)', async () => {
    mockPrisma.table.findUnique.mockResolvedValue({ id: 'table-1', branchId: 'branch-branchB' });

    await expect(service.getActiveOrderForTable('table-1', 'branch-branchA')).rejects.toThrow(ForbiddenException);
  });

  it('should throw ConflictException (409) in appendItemsToOrder if order is not in cancelable/active state', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.READY,
      table: { tableNumber: '5' }
    });

    mockPrisma.menuItem.findUnique.mockResolvedValue({
      id: 'item-2',
      basePrice: 15.00,
      station: 'GRILL',
      variants: []
    });

    mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.appendItemsToOrder('order-1', [{ menuItemId: 'item-2', quantity: 1 }])).rejects.toThrow(ConflictException);
  });

  it('should append items to order and recalculate subtotal, tax (8.875%), and totalAmount', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      subtotal: 50.00,
      taxAmount: 4.44,
      totalAmount: 54.44,
      table: { tableNumber: '5' }
    });

    mockPrisma.menuItem.findUnique.mockResolvedValue({
      id: 'item-desert',
      basePrice: 20.00,
      station: 'COLD_PREP',
      variants: []
    });

    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.orderItem.create.mockResolvedValue({
      id: 'item-new',
      orderId: 'order-1',
      quantity: 1,
      unitPrice: 20.00,
      status: OrderItemStatus.QUEUED
    });

    await service.appendItemsToOrder('order-1', [{ menuItemId: 'item-desert', quantity: 1 }]);

    expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
        status: { in: [OrderStatus.PLACED, OrderStatus.IN_PREPARATION] }
      },
      data: {
        subtotal: { increment: 20.00 },
        taxAmount: { increment: 1.78 }, // Math.round(20 * 0.08875 * 100) / 100 = 1.78
        totalAmount: { increment: 21.78 }
      }
    });

    expect(mockEventEmitter.emit).toHaveBeenCalledWith('order.items_appended', expect.anything());
  });
});
