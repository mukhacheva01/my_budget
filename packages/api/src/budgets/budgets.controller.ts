import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser, AuthedUser } from '../auth/current-user.decorator';
import { BudgetsService } from './budgets.service';

class CategoryAllocationDto {
  @IsString()
  categoryId: string;

  @IsInt()
  @Min(0)
  limit: number;
}

class GoalAllocationDto {
  @IsString()
  goalId: string;

  @IsInt()
  @Min(0)
  amount: number;
}

class UpsertBudgetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsInt()
  @Min(0)
  income: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryAllocationDto)
  categories?: CategoryAllocationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoalAllocationDto)
  goals?: GoalAllocationDto[];
}

class CopyBudgetDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  sourceMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  sourceYear?: number;
}

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get('current')
  getCurrent(
    @CurrentUser() user: AuthedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.budgets.getMonth(
      user.id,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Post('current')
  upsert(@CurrentUser() user: AuthedUser, @Body() dto: UpsertBudgetDto) {
    const now = new Date();
    return this.budgets.upsertMonth(user.id, {
      month: dto.month ?? now.getMonth() + 1,
      year: dto.year ?? now.getFullYear(),
      income: dto.income,
      categories: dto.categories ?? [],
      goals: dto.goals ?? [],
    });
  }

  @Post('copy')
  copy(@CurrentUser() user: AuthedUser, @Body() dto: CopyBudgetDto) {
    const sourceMonth = dto.sourceMonth ?? (dto.month === 1 ? 12 : dto.month - 1);
    const sourceYear = dto.sourceYear ?? (dto.month === 1 ? dto.year - 1 : dto.year);
    return this.budgets.copyMonth(
      user.id,
      { month: dto.month, year: dto.year },
      { month: sourceMonth, year: sourceYear },
    );
  }
}