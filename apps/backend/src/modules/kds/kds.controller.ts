import { Controller, Get, Post, Body, Param, Query, UseGuards, UsePipes, Inject } from '@nestjs/common';
import { KdsService } from './kds.service';
import { PosService, CancellationActor } from '../pos/pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CancelOrderSchema } from '@erms/shared';
import { KitchenStation, UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Kitchen Display System (KDS)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER, UserRole.KITCHEN_STAFF)
@Controller('kds')
export class KdsController {
  constructor(
    private readonly kdsService: KdsService,
    @Inject(PosService) private readonly posService: PosService
  ) {}

  @ApiOperation({ summary: 'Get station tickets queue (Kitchen & Managers)' })
  @Get('queue')
  async getQueue(@Query('branchId') branchId: string, @Query('station') station?: KitchenStation) {
    return this.kdsService.getStationQueue(branchId, station);
  }

  @ApiOperation({ summary: 'Cancel order directly from KDS kitchen display (REST only)' })
  @Post('orders/:id/cancel')
  @UsePipes(new ZodValidationPipe(CancelOrderSchema))
  async cancelOrderFromKds(
    @Param('id') orderId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any
  ) {
    const actor: CancellationActor = {
      userId: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      role: user.role,
      source: 'KDS_KITCHEN'
    };
    return this.posService.voidOrder(orderId, actor, body.reason, false);
  }
}
