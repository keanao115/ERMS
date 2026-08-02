import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
}
