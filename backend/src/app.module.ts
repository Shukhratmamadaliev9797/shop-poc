import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CustomerModule } from './customer/customer.module';
import { Customer } from './customer/entities/customer.entity';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { InventoryItem } from './inventory/entities/inventory-item.entity';
import { PaymentModule } from './payment/payment.module';
import { PaymentAllocation } from './payment/entities/payment-allocation.entity';
import { Payment } from './payment/entities/payment.entity';
import { PurchaseModule } from './purchase/purchase.module';
import { PurchaseItem } from './purchase/entities/purchase-item.entity';
import { PurchaseActivity } from './purchase/entities/purchase-activity.entity';
import { Purchase } from './purchase/entities/purchase.entity';
import { RepairModule } from './repair/repair.module';
import { RepairEntry } from './repair/entities/repair-entry.entity';
import { Repair } from './repair/entities/repair.entity';
import { ReportsModule } from './reports/reports.module';
import { SaleModule } from './sale/sale.module';
import { SaleItem } from './sale/entities/sale-item.entity';
import { SaleActivity } from './sale/entities/sale-activity.entity';
import { Sale } from './sale/entities/sale.entity';
import { User } from './user/user/entities/user.entity';
import { UserModule } from './user/user/user.module';
import { WorkerModule } from './worker/worker.module';
import { WorkerSalaryPayment } from './worker/entities/worker-salary-payment.entity';
import { Worker } from './worker/entities/worker.entity';
import { SupportRequest } from './support-request/entities/support-request.entity';
import { SupportRequestModule } from './support-request/support-request.module';

type EnvVars = {
  APP_ENV?: string;
  DB_HOST?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  [key: string]: unknown;
};

function validateEnvironment(env: EnvVars): EnvVars {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ] as const;

  const missing = required.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return env;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appEnv = config.get<string>('APP_ENV', { infer: true });
        const isProduction = appEnv === 'production';

        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', { infer: true }),
          port: Number(config.get<string>('DB_PORT', { infer: true }) ?? 5432),
          username: config.get<string>('DB_USER', { infer: true }),
          password: config.get<string>('DB_PASSWORD', { infer: true }),
          database: config.get<string>('DB_NAME', { infer: true }),
          entities: [
            User,
            Customer,
            InventoryItem,
            Purchase,
            PurchaseItem,
            PurchaseActivity,
            Repair,
            RepairEntry,
            Sale,
            SaleItem,
            SaleActivity,
            Payment,
            PaymentAllocation,
            Worker,
            WorkerSalaryPayment,
            SupportRequest,
          ],
          synchronize: !isProduction,
          logging: !isProduction,
        };
      },
    }),
    UserModule,
    AuthModule,
    DashboardModule,
    CustomerModule,
    InventoryModule,
    PurchaseModule,
    RepairModule,
    ReportsModule,
    SaleModule,
    PaymentModule,
    WorkerModule,
    SupportRequestModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
