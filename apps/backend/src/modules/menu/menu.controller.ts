import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Menu & Dish Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @ApiOperation({ summary: 'Get full restaurant menu hierarchy' })
  @Get('categories')
  async getMenuCategories(@Query('restaurantId') restaurantId: string) {
    return this.menuService.getMenuCategories(restaurantId);
  }
}
