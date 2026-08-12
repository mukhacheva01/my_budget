export interface User {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  currency: string;
  timezone: string | null;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
  isArchived: boolean;
}

export type GoalStatus = 'active' | 'completed' | 'archived';
export type ContributionKind = 'planned' | 'actual';

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  imageUrl: string | null;
  color: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  status: GoalStatus;
  contributions?: Contribution[];
}

export interface Contribution {
  id: string;
  amount: number;
  kind: ContributionKind;
  date: string;
  comment: string | null;
}

export interface BudgetCategoryAlloc {
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  overrun: number;
  count: number;
}

export interface BudgetGoalAlloc {
  amount: number;
  goal: Goal;
}

export interface MonthView {
  month: number;
  year: number;
  budget: { id: string; income: number } | null;
  income: number;
  distributed: number;
  plannedToGoals: number;
  unallocated: number;
  spentTotal: number;
  savedToGoals: number;
  availableToSpend: number;
  daysLeft: number;
  categories: BudgetCategoryAlloc[];
  goals: BudgetGoalAlloc[];
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  comment: string | null;
  spentAt: string;
  category?: { id: string; name: string; emoji: string; color: string };
}