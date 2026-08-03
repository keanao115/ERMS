import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Menu & Dish Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @ApiOperation({ summary: 'Get full restaurant menu hierarchy' })
  @Get('categories')
  async getMenuCategories(@Query('restaurantId') restaurantId: string) {
    return this.menuService.getMenuCategories(restaurantId);
  }

  @ApiOperation({ summary: 'Create a new dish under a category (Managers only)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Post('items')
  async createMenuItem(@Body() body: any) {
    return this.menuService.createMenuItem(body);
  }

  @ApiOperation({ summary: 'Toggle dish availability 86 (Managers & Kitchen Staff)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.KITCHEN_STAFF)
  @Patch('items/:id/availability')
  async setAvailability(@Param('id') id: string, @Body('isAvailable') isAvailable: boolean) {
    return this.menuService.setAvailability(id, isAvailable);
  }
}
