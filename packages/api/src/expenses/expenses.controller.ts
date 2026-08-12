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
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser, AuthedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class CreateExpenseDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsDateString()
  spentAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}

class UpdateExpenseDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  spentAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment?: string;
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @CurrentUser() user: AuthedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('categoryId') categoryId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();
    const start = from ? new Date(from) : new Date(y, m - 1, 1);
    const end = to ? new Date(to) : new Date(y, m, 1);
    return this.prisma.expense.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        spentAt: { gte: start, lt: end },
      },
      include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
      orderBy: { spentAt: 'desc' },
      take: 200,
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthedUser, @Body() dto: CreateExpenseDto) {
    const owned = await this.prisma.category.count({
      where: { id: dto.categoryId, userId: user.id },
    });
    if (!owned) throw new BadRequestException('Категория не найдена');
    return this.prisma.expense.create({
      data: {
        userId: user.id,
        amount: dto.amount,
        categoryId: dto.categoryId,
        comment: dto.comment,
        spentAt: dto.spentAt ? new Date(dto.spentAt) : new Date(),
      },
      include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    if (dto.categoryId) {
      const owned = await this.prisma.category.count({
        where: { id: dto.categoryId, userId: user.id },
      });
      if (!owned) throw new BadRequestException('Категория не найдена');
    }
    const result = await this.prisma.expense.updateMany({
      where: { id, userId: user.id, deletedAt: null },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.spentAt ? { spentAt: new Date(dto.spentAt) } : {}),
        ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
      },
    });
    if (!result.count) throw new NotFoundException('Расход не найден');
    return this.prisma.expense.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, emoji: true, color: true } } },
    });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    const result = await this.prisma.expense.updateMany({
      where: { id, userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Расход не найден');
    return { id };
  }
}