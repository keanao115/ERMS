import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Point of Sale (POS)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @ApiOperation({ summary: 'Create new POS order' })
  @Post('orders')
  async createOrder(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.posService.createOrder(body, userId);
  }

  @ApiOperation({ summary: 'List POS orders by branch' })
  @Get('orders')
  async getOrders(@Query('branchId') branchId: string, @Query('status') status?: OrderStatus) {
    return this.posService.getOrders(branchId, status);
  }

  @ApiOperation({ summary: 'Settle order payment (supports split bill)' })
  @Post('settle')
  async settlePayment(@Body() body: { orderId: string; payments: any[] }) {
    return this.posService.settlePayment(body);
  }
}
