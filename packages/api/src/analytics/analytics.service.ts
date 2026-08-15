import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private range(month: number, year: number) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 1),
    };
  }

  async monthSummary(userId: bigint, month: number, year: number) {
    const { start, end } = this.range(month, year);

    const byCategory = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, deletedAt: null, spentAt: { gte: start, lt: end } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, emoji: true, color: true },
    });
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const total = byCategory.reduce((s, r) => s + (r._sum.amount ?? 0), 0);

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysElapsed = month === new Date().getMonth() + 1 && year === new Date().getFullYear()
      ? new Date().getDate()
      : daysInMonth;

    const savingsContributions = await this.prisma.goalContribution.aggregate({
      where: { userId, kind: 'actual', date: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    const budget = await this.prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      select: { income: true },
    });

    return {
      month,
      year,
      totalSpent: total,
      averagePerDay: daysElapsed > 0 ? Math.round(total / daysElapsed) : 0,
      savingsTotal: savingsContributions._sum.amount ?? 0,
      savingsRate: budget?.income ? Math.round(((savingsContributions._sum.amount ?? 0) / budget.income) * 100) : 0,
      budgetUsedPercent: budget?.income ? Math.round((total / budget.income) * 100) : 0,
      byCategory: byCategory
        .map((r) => ({
          category: catMap.get(r.categoryId) ?? { id: r.categoryId, name: '?', emoji: '❓', color: '#ccc' },
          amount: r._sum.amount ?? 0,
          count: r._count._all,
          percent: total > 0 ? Math.round(((r._sum.amount ?? 0) / total) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    };
  }

  async compareToPrevious(userId: bigint, month: number, year: number) {
    const current = await this.monthSummary(userId, month, year);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previous = await this.monthSummary(userId, prevMonth, prevYear);

    return {
      current,
      previous,
      diff: {
        totalSpent: current.totalSpent - previous.totalSpent,
        averagePerDay: current.averagePerDay - previous.averagePerDay,
        savingsRate: current.savingsRate - previous.savingsRate,
      },
    };
  }

  async dailyBreakdown(userId: bigint, month: number, year: number) {
    const { start, end } = this.range(month, year);
    const expenses = await this.prisma.expense.findMany({
      where: { userId, deletedAt: null, spentAt: { gte: start, lt: end } },
      select: { amount: true, spentAt: true },
      orderBy: { spentAt: 'asc' },
    });

    const days: Record<string, number> = {};
    for (const e of expenses) {
      const key = e.spentAt.toISOString().slice(0, 10);
      days[key] = (days[key] ?? 0) + e.amount;
    }

    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }
}
