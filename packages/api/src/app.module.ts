import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CalculatorModule } from './common/calculator.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { CategoriesModule } from './categories/categories.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ExpensesModule } from './expenses/expenses.module';
import { GoalsModule } from './goals/goals.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 120 },
    ]),
    PrismaModule,
    CalculatorModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    BudgetsModule,
    ExpensesModule,
    GoalsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}