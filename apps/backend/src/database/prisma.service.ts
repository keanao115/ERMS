import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Explicitly enforce port 5433 to connect to Docker PostgreSQL container
process.env.DATABASE_URL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('5433')
  ? process.env.DATABASE_URL
  : 'postgresql://erms_user:erms_password_2026@localhost:5433/erms_production?schema=public';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
