import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, AuthedUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthedUser) {
    return this.prisma.user.findUnique({ where: { id: user.id } });
  }

  @Patch('me')
  async update(@CurrentUser() user: AuthedUser, @Body() body: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.currency ? { currency: body.currency } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
      },
    });
  }
}