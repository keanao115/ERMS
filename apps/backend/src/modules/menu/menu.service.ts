import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditAction, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuCategories(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      include: {
        menuItems: {
          include: { variants: true, addons: true, ingredients: { include: { ingredient: true } } }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async createMenuItem(data: any, userId?: string) {
    const { categoryId, name, description, basePrice, station, isTaxExempt } = data;

    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category not found: ${categoryId}`);
    }

    const created = await this.prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description,
        basePrice: Number(basePrice),
        station,
        isTaxExempt: Boolean(isTaxExempt),
        isAvailable: true
      },
      include: { variants: true, addons: true, ingredients: { include: { ingredient: true } } }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId || 'SYSTEM',
        userRole: UserRole.STORE_MANAGER,
        action: AuditAction.CREATE,
        entityName: 'MenuItem',
        entityId: created.id,
        afterState: JSON.stringify({ name: created.name, basePrice: created.basePrice, station: created.station }),
        ipAddress: '127.0.0.1',
        traceId: `TRC-MENU-${uuidv4().slice(0, 8)}`
      }
    });

    return created;
  }

  async setAvailability(menuItemId: string, isAvailable: boolean, userId?: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!item) {
      throw new NotFoundException(`Menu item not found: ${menuItemId}`);
    }

    const beforeState = JSON.stringify({ isAvailable: item.isAvailable });
    const updated = await this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId || 'SYSTEM',
        userRole: UserRole.STORE_MANAGER,
        action: AuditAction.UPDATE,
        entityName: 'MenuItem',
        entityId: menuItemId,
        beforeState,
        afterState: JSON.stringify({ isAvailable: updated.isAvailable }),
        ipAddress: '127.0.0.1',
        traceId: `TRC-MENU-AVAIL-${uuidv4().slice(0, 8)}`
      }
    });

    return updated;
  }
}
