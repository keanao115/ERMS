import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Restaurant & Branch Enterprise Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: 'Get enterprise organization details' })
  @Get(':id')
  async getRestaurant(@Param('id') id: string) {
    return this.restaurantsService.getRestaurant(id);
  }

  @ApiOperation({ summary: 'Update enterprise organization details (Managers only)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Put(':id')
  async updateRestaurant(
    @Param('id') id: string,
    @Body() body: { name?: string; logoUrl?: string; taxRegistrationNumber?: string }
  ) {
    return this.restaurantsService.updateRestaurant(id, body);
  }

  @ApiOperation({ summary: 'Get branch details' })
  @Get('branches/:branchId')
  async getBranch(@Param('branchId') branchId: string) {
    return this.restaurantsService.getBranch(branchId);
  }

  @ApiOperation({ summary: 'Update branch details (Managers only)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
  @Put('branches/:branchId')
  async updateBranch(
    @Param('branchId') branchId: string,
    @Body() body: { name?: string; address?: string; city?: string; phone?: string; capacity?: number }
  ) {
    return this.restaurantsService.updateBranch(branchId, body);
  }
}
