import {
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
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, AuthedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class CreateCategoryDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsString()
  @MaxLength(8)
  emoji: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class UpdateCategoryDto {
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
  color?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: AuthedUser, @Query('all') all?: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        userId: user.id,
        ...(all === 'true' ? {} : { isArchived: false }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return categories;
  }

  @Post()
  async create(@CurrentUser() user: AuthedUser, @Body() dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        userId: user.id,
        name: dto.name,
        emoji: dto.emoji,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.prisma.category.updateMany({
      where: { id, userId: user.id },
      data: dto,
    });
    if (!result.count) throw new NotFoundException('Категория не найдена');
    return this.prisma.category.findUnique({ where: { id } });
  }

  @Delete(':id')
  async archive(@CurrentUser() user: AuthedUser, @Param('id') id: string) {
    const result = await this.prisma.category.updateMany({
      where: { id, userId: user.id },
      data: { isArchived: true },
    });
    if (!result.count) throw new NotFoundException('Категория не найдена');
    return { id, isArchived: true };
  }
}