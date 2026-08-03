import { Controller, Post, Body, Get, Headers, UseGuards } from '@nestjs/common';
import { AdaptersService, StripePaymentIntent, QuickBooksLedgerEntry } from './adapters.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('External System Integration Adapters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_OWNER, UserRole.STORE_MANAGER)
@Controller('adapters')
export class AdaptersController {
  constructor(private readonly adaptersService: AdaptersService) {}

  @ApiOperation({ summary: 'Get integration status' })
  @Get('status')
  async getStatus() {
    return this.adaptersService.getStatus();
  }

  @ApiOperation({ summary: 'Process Stripe Payment Intent' })
  @Post('stripe/charge')
  async processStripe(@Body() intent: StripePaymentIntent) {
    return this.adaptersService.processStripePayment(intent);
  }

  @ApiOperation({ summary: 'Sync General Ledger entry to QuickBooks' })
  @Post('quickbooks/sync')
  async syncQuickBooks(@Body() entry: QuickBooksLedgerEntry) {
    return this.adaptersService.syncQuickBooksLedger(entry);
  }

  @ApiOperation({ summary: 'Ingest Uber Eats Webhook Order' })
  @Post('ubereats/webhook')
  async ingestUberEats(
    @Body() payload: any,
    @Headers('x-uber-signature') signature?: string
  ) {
    return this.adaptersService.ingestUberEatsOrder(payload, signature);
  }
}
