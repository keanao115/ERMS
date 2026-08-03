import { Controller, Post, Get, Body, Query, Param, UseGuards, UsePipes, Inject } from '@nestjs/common';
import { PosService, CancellationActor } from './pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CancelOrderSchema, AppendOrderItemsSchema } from '@erms/shared';
import { OrderStatus, UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Point of Sale (POS)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('pos')
export class PosController {
  constructor(@Inject(PosService) private readonly posService: PosService) {}

  @ApiOperation({ summary: 'Create new POS order' })
  @Post('orders')
  async createOrder(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.posService.createOrder(body, userId);
  }

  @ApiOperation({ summary: 'Append items to existing active table order' })
  @Post('orders/:id/append-items')
  @UsePipes(new ZodValidationPipe(AppendOrderItemsSchema))
  async appendItems(
    @Param('id') orderId: string,
    @Body() body: { items: any[] },
    @CurrentUser('id') userId: string
  ) {
    return this.posService.appendItemsToOrder(orderId, body.items, userId);
  }

  @ApiOperation({ summary: 'Get in-flight active order for an occupied table' })
  @Get('tables/:tableId/active-order')
  async getActiveOrderForTable(
    @Param('tableId') tableId: string,
    @Query('branchId') branchId?: string
  ) {
    return this.posService.getActiveOrderForTable(tableId, branchId);
  }

  @ApiOperation({ summary: 'List POS orders by branch' })
  @Get('orders')
  async getOrders(@Query('branchId') branchId: string, @Query('status') status?: OrderStatus, @Query('tableId') tableId?: string) {
    return this.posService.getOrders(branchId, status, tableId);
  }

  @ApiOperation({ summary: 'Settle order payment (supports split bill)' })
  @Post('settle')
  async settlePayment(@Body() body: { orderId: string; payments: any[] }) {
    return this.posService.settlePayment(body);
  }

  @ApiOperation({ summary: 'Void order (Managers only - restores inventory stock)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Post('orders/:id/void')
  @UsePipes(new ZodValidationPipe(CancelOrderSchema))
  async voidOrder(
    @Param('id') orderId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any
  ) {
    const actor: CancellationActor = {
      userId: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      role: user.role,
      source: 'POS_MANAGER'
    };
    return this.posService.voidOrder(orderId, actor, body.reason, false);
  }

  @ApiOperation({ summary: 'Refund order (Managers only - restores inventory stock)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Post('orders/:id/refund')
  @UsePipes(new ZodValidationPipe(CancelOrderSchema))
  async refundOrder(
    @Param('id') orderId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any
  ) {
    const actor: CancellationActor = {
      userId: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      role: user.role,
      source: 'POS_MANAGER'
    };
    return this.posService.refundOrder(orderId, actor, body.reason);
  }
}
