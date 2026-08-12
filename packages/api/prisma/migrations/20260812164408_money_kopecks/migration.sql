/*
  Warnings:

  - You are about to alter the column `limit` on the `BudgetCategory` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Integer`.
  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Integer`.
  - You are about to alter the column `targetAmount` on the `Goal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Integer`.
  - You are about to alter the column `savedAmount` on the `Goal` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Integer`.
  - You are about to alter the column `amount` on the `GoalContribution` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Integer`.
  - You are about to alter the column `income` on the `MonthlyBudget` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Integer`.

*/
-- CreateEnum
CREATE TYPE "ContributionKind" AS ENUM ('planned', 'actual');

-- AlterTable
ALTER TABLE "BudgetCategory" ALTER COLUMN "limit" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "targetAmount" SET DATA TYPE INTEGER,
ALTER COLUMN "savedAmount" SET DEFAULT 0,
ALTER COLUMN "savedAmount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "GoalContribution" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "kind" "ContributionKind" NOT NULL DEFAULT 'actual',
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "MonthlyBudget" ALTER COLUMN "income" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'RUB',
ADD COLUMN     "timezone" TEXT;

-- CreateIndex
CREATE INDEX "GoalContribution_userId_date_idx" ON "GoalContribution"("userId", "date");
