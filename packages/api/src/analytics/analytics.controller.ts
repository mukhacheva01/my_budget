import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, AuthedUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    return this.analytics.monthSummary(
      user.id,
      month ? Number(month) : now.getMonth() + 1,
      year ? Number(year) : now.getFullYear(),
    );
  }

  @Get('compare')
  compare(
    @CurrentUser() user: AuthedUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.analytics.compareToPrevious(user.id, Number(month), Number(year));
  }

  @Get('daily')
  daily(
    @CurrentUser() user: AuthedUser,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    return this.analytics.dailyBreakdown(
      user.id,
      month ? Number(month) : now.getMonth() + 1,
      year ? Number(year) : now.getFullYear(),
    );
  }
}
