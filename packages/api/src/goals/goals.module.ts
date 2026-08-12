import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { BudgetsService } from '../budgets/budgets.service';

@Module({
  controllers: [GoalsController],
  providers: [BudgetsService],
})
export class GoalsModule {}