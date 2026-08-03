import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCoupon(data: { restaurantId: string; code: string; discountPercent: number; maxDiscount: number; expiresAt: string }) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: data.code }
    });
    if (existing) {
      throw new BadRequestException(`Coupon with code '${data.code}' already exists.`);
    }

    return this.prisma.coupon.create({
      data: {
        restaurantId: data.restaurantId,
        code: data.code.toUpperCase(),
        discountPercent: Number(data.discountPercent),
        maxDiscount: Number(data.maxDiscount),
        expiresAt: new Date(data.expiresAt),
        isActive: true
      }
    });
  }

  async getCoupons(restaurantId: string) {
    return this.prisma.coupon.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createGiftCard(data: { restaurantId: string; code: string; initialBalance: number; expiresAt: string }) {
    const existing = await this.prisma.giftCard.findUnique({
      where: { code: data.code }
    });
    if (existing) {
      throw new BadRequestException(`GiftCard with code '${data.code}' already exists.`);
    }

    const balance = Number(data.initialBalance);
    return this.prisma.giftCard.create({
      data: {
        restaurantId: data.restaurantId,
        code: data.code.toUpperCase(),
        initialBalance: balance,
        currentBalance: balance,
        expiresAt: new Date(data.expiresAt),
        isActive: true
      }
    });
  }

  async getGiftCards(restaurantId: string) {
    return this.prisma.giftCard.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
