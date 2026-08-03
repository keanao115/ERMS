import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      recipeIngredient: { findMany: vi.fn() },
      ingredient: { update: vi.fn(), findMany: vi.fn() },
      inventoryTransaction: { create: vi.fn() },
      notification: { create: vi.fn() }
    };

    service = new InventoryService(mockPrisma as any);
  });

  it('should deduct ingredient stock and trigger low-stock alert when below threshold', async () => {
    mockPrisma.recipeIngredient.findMany.mockResolvedValue([
      {
        ingredientId: 'ing-1',
        quantityRequired: 0.25,
        ingredient: { id: 'ing-1', name: 'Wagyu Beef', costPerUnit: 180.0 }
      }
    ]);

    mockPrisma.ingredient.update.mockResolvedValue({
      id: 'ing-1',
      name: 'Wagyu Beef',
      unit: 'KG',
      currentStock: 2.0,
      minThreshold: 5.0,
      branchId: 'branch-1'
    });

    await service.handlePaymentCompleted({
      payload: {
        branchId: 'branch-1',
        items: [{ menuItemId: 'dish-wagyu', quantity: 2, id: 'item-1' }]
      }
    });

    expect(mockPrisma.ingredient.update).toHaveBeenCalledWith({
      where: { id: 'ing-1' },
      data: { currentStock: { decrement: 0.50 } }
    });

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'WARNING',
        title: expect.stringContaining('Low Stock Alert')
      })
    });
  });
});
