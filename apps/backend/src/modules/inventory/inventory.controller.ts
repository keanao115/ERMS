import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
}
