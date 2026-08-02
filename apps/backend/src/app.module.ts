import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PosModule } from './modules/pos/pos.module';
import { KdsModule } from './modules/kds/kds.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuModule } from './modules/menu/menu.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AdaptersModule } from './modules/adapters/adapters.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    PosModule,
    KdsModule,
    InventoryModule,
    AnalyticsModule,
    TablesModule,
    MenuModule,
    AuditLogModule,
    EmployeesModule,
    AdaptersModule
  ]
})
export class AppModule {}
