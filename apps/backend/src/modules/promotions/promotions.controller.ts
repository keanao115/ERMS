import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Promotions & Gift Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @ApiOperation({ summary: 'Create promotional coupon code' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Post('coupons')
  async createCoupon(@Body() body: { restaurantId: string; code: string; discountPercent: number; maxDiscount: number; expiresAt: string }) {
    return this.promotionsService.createCoupon(body);
  }

  @ApiOperation({ summary: 'List promotional coupons by restaurant' })
  @Get('coupons')
  async getCoupons(@Query('restaurantId') restaurantId: string) {
    return this.promotionsService.getCoupons(restaurantId);
  }

  @ApiOperation({ summary: 'Issue digital gift card' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Post('gift-cards')
  async createGiftCard(@Body() body: { restaurantId: string; code: string; initialBalance: number; expiresAt: string }) {
    return this.promotionsService.createGiftCard(body);
  }

  @ApiOperation({ summary: 'List digital gift cards by restaurant' })
  @Get('gift-cards')
  async getGiftCards(@Query('restaurantId') restaurantId: string) {
    return this.promotionsService.getGiftCards(restaurantId);
  }
}
