import { Injectable } from '@nestjs/common';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/**
 * Единственное место расчёта денежных показателей бюджета.
 * Все суммы — целые копейки (Int).
 */
@Injectable()
export class BudgetCalculatorService {
  remainingInCategory(limit: number, spent: number): number {
    return limit - spent;
  }

  distributed(limits: number[]): number {
    return sum(limits);
  }

  plannedToGoals(amounts: number[]): number {
    return sum(amounts);
  }

  savedToGoals(amounts: number[]): number {
    return sum(amounts);
  }

  totalSpent(amounts: number[]): number {
    return sum(amounts);
  }

  unallocated(income: number, categoryLimits: number[], plannedGoalAmounts: number[]): number {
    return income - sum(categoryLimits) - sum(plannedGoalAmounts);
  }

  availableToSpend(income: number, spent: number, actuallySaved: number): number {
    return income - spent - actuallySaved;
  }

  isOverBudget(limit: number, spent: number): boolean {
    return limit > 0 && spent > limit;
  }

  overrun(limit: number, spent: number): number {
    return Math.max(0, spent - limit);
  }

  goalProgress(saved: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(1, saved / target);
  }

  daysLeftInMonth(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
  }
}