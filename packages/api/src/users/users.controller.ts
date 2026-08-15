import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
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

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekStartsOn?: number;

  @IsOptional()
  @IsBoolean()
  notifyDailyReminder?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  notifyReminderHour?: number;

  @IsOptional()
  @IsBoolean()
  notifyLimitWarning?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyMonthStart?: boolean;
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
        ...(body.weekStartsOn !== undefined ? { weekStartsOn: body.weekStartsOn } : {}),
        ...(body.notifyDailyReminder !== undefined ? { notifyDailyReminder: body.notifyDailyReminder } : {}),
        ...(body.notifyReminderHour !== undefined ? { notifyReminderHour: body.notifyReminderHour } : {}),
        ...(body.notifyLimitWarning !== undefined ? { notifyLimitWarning: body.notifyLimitWarning } : {}),
        ...(body.notifyMonthStart !== undefined ? { notifyMonthStart: body.notifyMonthStart } : {}),
      },
    });
  }
}
