import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { GoalStatus } from '@prisma/client';
import { CurrentUser, AuthedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsService } from '../budgets/budgets.service';

class CreateGoalDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsString()
  @MaxLength(8)
  emoji: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  color: string;

  @IsInt()
  @Min(1)
  targetAmount: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}

class ContributeDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;
}

class TransferDto {
  @IsString()
  fromGoalId: string;

  @IsString()
  toGoalId: string;

  @IsInt()
  @Min(1)
  amount: number;
}

@Controller('goals')
export class GoalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgets: BudgetsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthedUser, @Query('status') status?: GoalStatus) {
    return this.prisma.goal.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : { status: { not: 'archived' } }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        contributions: {
          where: { kind: 'actual' },
          orderBy: { date: 'desc' },
          take: 25,
        },
      },
    });
  }

  @Post()
  create(@CurrentUser() user: AuthedUser, @Body() dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId: user.id,
        name: dto.name,
        emoji: dto.emoji,
        imageUrl: dto.imageUrl,
        color: dto.color,
        targetAmount: dto.targetAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    const result = await this.prisma.goal.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.emoji !== undefined ? { emoji: dto.emoji } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.targetAmount !== undefined ? { targetAmount: dto.targetAmount } : {}),
        ...(dto.deadline !== undefined
          ? { deadline: dto.deadline ? new Date(dto.deadline) : null }
          : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
    if (!result.count) throw new NotFoundException('Цель не найдена');
    return this.prisma.goal.findUnique({ where: { id } });
  }

  @Post(':id/contribute')
  contribute(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: ContributeDto,
  ) {
    return this.budgets.addActualContribution(
      user.id,
      id,
      dto.amount,
      dto.date ? new Date(dto.date) : undefined,
    );
  }

  @Delete(':id/contribution/:contributionId')
  removeContribution(
    @CurrentUser() user: AuthedUser,
    @Param('contributionId') contributionId: string,
  ) {
    return this.budgets.removeActualContribution(user.id, contributionId);
  }

  @Post('transfer')
  transfer(@CurrentUser() user: AuthedUser, @Body() dto: TransferDto) {
    if (dto.fromGoalId === dto.toGoalId) {
      throw new BadRequestException('Нельзя перевести в ту же цель');
    }
    return this.budgets.reallocateSaved(user.id, dto.fromGoalId, dto.toGoalId, dto.amount);
  }

  @Delete(':id')
  async archive(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    const result = await this.prisma.goal.updateMany({
      where: { id, userId: user.id },
      data: { status: GoalStatus.archived },
    });
    if (!result.count) throw new NotFoundException('Цель не найдена');
    return { id, status: GoalStatus.archived };
  }
}