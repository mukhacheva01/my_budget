import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContributionKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetCalculatorService } from './budget-calculator.service';
import { assertKopecks } from '../common/money';

interface MonthRange {
  start: Date;
  end: Date;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calc: BudgetCalculatorService,
  ) {}

  private monthRange(month: number, year: number): MonthRange {
    return {
      start: new Date(year, month - 1, 1, 0, 0, 0, 0),
      end: new Date(year, month, 1, 0, 0, 0, 0),
    };
  }

  async getMonth(userId: bigint, month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
    if (month < 1 || month > 12) throw new BadRequestException('Некорректный месяц');
    const { start, end } = this.monthRange(month, year);

    const budget = await this.prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: {
        categories: true,
        goals: {
          where: { kind: ContributionKind.planned },
          include: { goal: true },
        },
      },
    });

    const categories = await this.prisma.category.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const budgetLimits = new Map(
      (budget?.categories ?? []).map((bc) => [bc.categoryId, bc.limit]),
    );

    const expenses = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, deletedAt: null, spentAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const spentByCat = new Map(
      expenses.map((e) => [e.categoryId, { sum: e._sum.amount ?? 0, count: e._count._all }]),
    );

    const allExpenses = await this.prisma.expense.aggregate({
      where: { userId, deletedAt: null, spentAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const actualContributions = await this.prisma.goalContribution.aggregate({
      where: { userId, kind: ContributionKind.actual, date: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    const income = budget?.income ?? 0;
    const limits = (budget?.categories ?? []).map((bc) => bc.limit);
    const plannedAmounts = (budget?.goals ?? []).map((gc) => gc.amount);

    const distributed = this.calc.distributed(limits);
    const plannedToGoals = this.calc.plannedToGoals(plannedAmounts);
    const unallocated = this.calc.unallocated(income, limits, plannedAmounts);
    const spentTotal = this.calc.totalSpent([allExpenses._sum.amount ?? 0]);
    const savedToGoals = this.calc.savedToGoals([actualContributions._sum.amount ?? 0]);
    const availableToSpend = this.calc.availableToSpend(income, spentTotal, savedToGoals);

    return {
      month,
      year,
      budget: budget ?? null,
      income,
      distributed,
      plannedToGoals,
      unallocated,
      spentTotal,
      savedToGoals,
      availableToSpend,
      daysLeft: this.calc.daysLeftInMonth(new Date()),
      categories: categories.map((cat) => {
        const limit = budgetLimits.get(cat.id) ?? 0;
        const spent = spentByCat.get(cat.id)?.sum ?? 0;
        return {
          category: cat,
          limit,
          spent,
          remaining: this.calc.remainingInCategory(limit, spent),
          overrun: this.calc.overrun(limit, spent),
          count: spentByCat.get(cat.id)?.count ?? 0,
        };
      }),
      goals: (budget?.goals ?? []).map((gc) => ({
        amount: gc.amount,
        goal: gc.goal,
      })),
    };
  }

  async upsertMonth(
    userId: bigint,
    input: {
      month: number;
      year: number;
      income: number;
      categories?: { categoryId: string; limit: number }[];
      goals?: { goalId: string; amount: number }[];
    },
  ) {
    const { month, year, income, categories: catAlloc = [], goals: goalAlloc = [] } = input;

    if (month < 1 || month > 12) throw new BadRequestException('Некорректный месяц');
    assertKopecks(income, 'income');
    if (income < 0) throw new BadRequestException('Доход не может быть отрицательным');

    for (const c of catAlloc) {
      assertKopecks(c.limit, 'limit');
      const owned = await this.prisma.category.count({
        where: { id: c.categoryId, userId },
      });
      if (!owned) throw new BadRequestException('Неизвестная категория');
    }

    const goalIds = new Set<string>();
    for (const g of goalAlloc) {
      assertKopecks(g.amount, 'amount');
      const owned = await this.prisma.goal.count({
        where: { id: g.goalId, userId, status: 'active' },
      });
      if (!owned) throw new BadRequestException('Неизвестная или неактивная цель');
      goalIds.add(g.goalId);
    }

    const totalPlanned =
      catAlloc.reduce((acc, c) => acc + c.limit, 0) +
      goalAlloc.reduce((acc, g) => acc + g.amount, 0);
    if (totalPlanned > income) {
      throw new BadRequestException(
        'Распределение больше дохода: лимиты и планы в цели не могут превышать доход',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.monthlyBudget.findUnique({
        where: { userId_year_month: { userId, year, month } },
      });

      const budget = existing
        ? await tx.monthlyBudget.update({ where: { id: existing.id }, data: { income } })
        : await tx.monthlyBudget.create({ data: { userId, year, month, income } });

      await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
      if (catAlloc.length) {
        await tx.budgetCategory.createMany({
          data: catAlloc.map((c) => ({
            budgetId: budget.id,
            categoryId: c.categoryId,
            limit: c.limit,
          })),
        });
      }

      await tx.goalContribution.deleteMany({
        where: { budgetId: budget.id, kind: ContributionKind.planned },
      });
      if (goalAlloc.length) {
        await tx.goalContribution.createMany({
          data: goalAlloc.map((g) => ({
            budgetId: budget.id,
            goalId: g.goalId,
            userId,
            kind: ContributionKind.planned,
            amount: g.amount,
            date: new Date(year, month - 1, 1),
          })),
        });
      }
    });

    return this.getMonth(userId, month, year);
  }

  async copyMonth(
    userId: bigint,
    target: { month: number; year: number },
    source: { month: number; year: number },
  ) {
    if (target.month < 1 || target.month > 12 || source.month < 1 || source.month > 12) {
      throw new BadRequestException('Некорректный месяц');
    }

    const sourceBudget = await this.prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year: source.year, month: source.month } },
      include: {
        categories: true,
        goals: { where: { kind: ContributionKind.planned } },
      },
    });

    if (!sourceBudget) throw new NotFoundException('План исходного месяца не найден');

    const targetExists = await this.prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year: target.year, month: target.month } },
    });
    if (targetExists) {
      throw new BadRequestException(
        'В целевом месяце уже есть план. Сначала очистите его или отредактируйте через планирование',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const budget = await tx.monthlyBudget.create({
        data: { userId, year: target.year, month: target.month, income: sourceBudget.income },
      });
      if (sourceBudget.categories.length) {
        await tx.budgetCategory.createMany({
          data: sourceBudget.categories.map((bc) => ({
            budgetId: budget.id,
            categoryId: bc.categoryId,
            limit: bc.limit,
          })),
        });
      }
      if (sourceBudget.goals.length) {
        await tx.goalContribution.createMany({
          data: sourceBudget.goals.map((gc) => ({
            budgetId: budget.id,
            goalId: gc.goalId,
            userId,
            kind: ContributionKind.planned,
            amount: gc.amount,
            date: new Date(target.year, target.month - 1, 1),
          })),
        });
      }
    });

    return this.getMonth(userId, target.month, target.year);
  }

  async addActualContribution(
    userId: bigint,
    goalId: string,
    amount: number,
    date?: Date,
  ) {
    assertKopecks(amount, 'amount');
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId, status: { in: ['active', 'completed'] } },
    });
    if (!goal) throw new NotFoundException('Цель не найдена');
    if (amount <= 0) throw new BadRequestException('Сумма должна быть положительной');

    const contributionDate = date ?? new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.goalContribution.create({
        data: {
          goalId,
          userId,
          kind: ContributionKind.actual,
          amount,
          comment: 'Ручное пополнение',
          date: contributionDate,
        },
      });
      const updated = await tx.goal.update({
        where: { id: goalId },
        data: { savedAmount: { increment: amount } },
      });
      if (updated.savedAmount >= updated.targetAmount && updated.status === 'active') {
        await tx.goal.update({ where: { id: goalId }, data: { status: 'completed' } });
      }
    });

    return this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        contributions: {
          where: { kind: ContributionKind.actual },
          orderBy: { date: 'desc' },
          take: 25,
        },
      },
    });
  }

  async removeActualContribution(userId: bigint, contributionId: string) {
    const contribution = await this.prisma.goalContribution.findFirst({
      where: { id: contributionId, userId, kind: ContributionKind.actual },
    });
    if (!contribution) throw new NotFoundException('Пополнение не найдено');

    await this.prisma.$transaction(async (tx) => {
      await tx.goalContribution.delete({ where: { id: contributionId } });
      await tx.goal.update({
        where: { id: contribution.goalId },
        data: { savedAmount: { decrement: contribution.amount } },
      });
    });

    return this.prisma.goal.findUnique({ where: { id: contribution.goalId } });
  }

  async reallocateSaved(userId: bigint, fromGoalId: string, toGoalId: string, amount: number) {
    assertKopecks(amount, 'amount');
    if (fromGoalId === toGoalId) throw new BadRequestException('Нельзя перевести в ту же цель');

    const from = await this.prisma.goal.findFirst({ where: { id: fromGoalId, userId } });
    const to = await this.prisma.goal.findFirst({
      where: { id: toGoalId, userId, status: 'active' },
    });
    if (!from || !to) throw new NotFoundException('Цель не найдена');
    if (amount <= 0) throw new BadRequestException('Сумма должна быть положительной');
    if (amount > from.savedAmount) {
      throw new BadRequestException('Недостаточно накоплений для перераспределения');
    }

    await this.prisma.$transaction([
      this.prisma.goal.update({
        where: { id: fromGoalId },
        data: { savedAmount: { decrement: amount } },
      }),
      this.prisma.goal.update({
        where: { id: toGoalId },
        data: { savedAmount: { increment: amount } },
      }),
      this.prisma.goalContribution.create({
        data: {
          goalId: toGoalId,
          userId,
          kind: ContributionKind.actual,
          amount,
          comment: 'Перераспределено с другой цели',
        },
      }),
      this.prisma.goalContribution.create({
        data: {
          goalId: fromGoalId,
          userId,
          kind: ContributionKind.actual,
          amount: -amount,
          comment: 'Перераспределено на другую цель',
        },
      }),
    ]);

    return {
      from: await this.prisma.goal.findUnique({ where: { id: fromGoalId } }),
      to: await this.prisma.goal.findUnique({ where: { id: toGoalId } }),
    };
  }
}