import { BudgetCalculatorService } from '../budgets/budget-calculator.service';

describe('BudgetCalculatorService', () => {
  const calc = new BudgetCalculatorService();

  it('нераспределено = доход − лимиты − планы в цели', () => {
    expect(calc.unallocated(10000000, [2500000, 1500000], [1000000])).toBe(5000000);
    expect(calc.unallocated(5000000, [3000000], [])).toBe(2000000);
  });

  it('доступно к тратам = доход − расходы − фактически накоплено', () => {
    expect(calc.availableToSpend(10000000, 205000, 700000)).toBe(9095000);
  });

  it('остаток категории и перерасход', () => {
    expect(calc.remainingInCategory(2500000, 120000)).toBe(2380000);
    expect(calc.isOverBudget(2500000, 2600000)).toBe(true);
    expect(calc.overrun(2500000, 2600000)).toBe(100000);
    expect(calc.isOverBudget(0, 2600000)).toBe(false);
  });

  it('прогресс цели ограничен 1 и не падает ниже 0', () => {
    expect(calc.goalProgress(500000, 1000000)).toBeCloseTo(0.5);
    expect(calc.goalProgress(2000000, 1000000)).toBe(1);
    expect(calc.goalProgress(0, 0)).toBe(0);
  });

  it('дней до конца месяца неотрицательно', () => {
    expect(calc.daysLeftInMonth(new Date())).toBeGreaterThanOrEqual(0);
  });
});