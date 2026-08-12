-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'archived');

-- CreateTable
CREATE TABLE "User" (
    "id" BIGINT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "username" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🍂',
    "color" TEXT NOT NULL DEFAULT '#B09398',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBudget" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "income" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limit" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "comment" TEXT,
    "spentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "imageUrl" TEXT,
    "color" TEXT NOT NULL DEFAULT '#9B6A6C',
    "targetAmount" DECIMAL(14,2) NOT NULL,
    "savedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalContribution" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "budgetId" TEXT,
    "userId" BIGINT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

-- CreateIndex
CREATE INDEX "MonthlyBudget_userId_year_month_idx" ON "MonthlyBudget"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBudget_userId_year_month_key" ON "MonthlyBudget"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "BudgetCategory_budgetId_idx" ON "BudgetCategory"("budgetId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_budgetId_categoryId_key" ON "BudgetCategory"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "Expense_userId_spentAt_idx" ON "Expense"("userId", "spentAt");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "GoalContribution_goalId_idx" ON "GoalContribution"("goalId");

-- CreateIndex
CREATE INDEX "GoalContribution_budgetId_idx" ON "GoalContribution"("budgetId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBudget" ADD CONSTRAINT "MonthlyBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "MonthlyBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalContribution" ADD CONSTRAINT "GoalContribution_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalContribution" ADD CONSTRAINT "GoalContribution_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "MonthlyBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
