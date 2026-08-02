import { Injectable, Logger } from '@nestjs/common';

export interface StripePaymentIntent {
  amount: number;
  currency: string;
  paymentMethodId: string;
}

export interface QuickBooksLedgerEntry {
  transactionDate: string;
  totalRevenue: number;
  totalTax: number;
  totalTips: number;
}

@Injectable()
export class AdaptersService {
  private readonly logger = new Logger(AdaptersService.name);

  async processStripePayment(intent: StripePaymentIntent) {
    this.logger.log(`💳 [Stripe Gateway Adapter] Processing charge of ${intent.amount} ${intent.currency}`);
    return {
      success: true,
      transactionId: `ch_stripe_${Date.now()}`,
      status: 'succeeded'
    };
  }

  async syncQuickBooksLedger(entry: QuickBooksLedgerEntry) {
    this.logger.log(`📊 [QuickBooks ERP Adapter] Syncing daily revenue ledger entry for ${entry.transactionDate}`);
    return {
      success: true,
      syncId: `qb_journal_${Date.now()}`,
      syncedAt: new Date().toISOString()
    };
  }

  async ingestUberEatsOrder(payload: any) {
    this.logger.log(`🛵 [Uber Eats Sync Adapter] Ingesting delivery webhook order #${payload.id}`);
    return {
      success: true,
      internalOrderId: `ORD-UBER-${payload.id}`
    };
  }
}
