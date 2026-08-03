import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Get stock ingredients ledger' })
  @Get('ingredients')
  async getIngredients(@Query('branchId') branchId: string) {
    return this.inventoryService.getIngredients(branchId);
  }

  @ApiOperation({ summary: 'Get purchase orders' })
  @Get('purchase-orders')
  async getPurchaseOrders(@Query('branchId') branchId: string) {
    return this.inventoryService.getPurchaseOrders(branchId);
  }

  @ApiOperation({ summary: 'Create purchase order (Inventory Managers & Store Managers)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @Post('purchase-orders')
  async createPurchaseOrder(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.inventoryService.createPurchaseOrder(body, userId);
  }

  @ApiOperation({ summary: 'Mark purchase order as RECEIVED (Increments ingredient stock)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @Patch('purchase-orders/:id/receive')
  async receivePurchaseOrder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.inventoryService.receivePurchaseOrder(id, userId);
  }

  @ApiOperation({ summary: 'Get recent inventory transaction ledger' })
  @Get('transactions')
  async getTransactions(@Query('branchId') branchId: string) {
    return this.inventoryService.getTransactions(branchId);
  }

  @ApiOperation({ summary: 'Manually restock an ingredient' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @Post('restock')
  async restock(
    @Body('ingredientId') ingredientId: string,
    @Body('quantity') quantity: number,
    @CurrentUser('id') userId: string
  ) {
    return this.inventoryService.restockIngredient(ingredientId, Number(quantity), userId);
  }
}
