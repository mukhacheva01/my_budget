import { Global, Module } from '@nestjs/common';
import { BudgetCalculatorService } from '../budgets/budget-calculator.service';

@Global()
@Module({
  providers: [BudgetCalculatorService],
  exports: [BudgetCalculatorService],
})
export class CalculatorModule {}