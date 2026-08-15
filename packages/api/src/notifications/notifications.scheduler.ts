import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  /** Каждый час проверяем, кому нужно напомнить */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyReminders() {
    const nowUtc = new Date();
    const users = await this.prisma.user.findMany({
      where: { notifyDailyReminder: true },
      select: { id: true, timezone: true, notifyReminderHour: true },
    });

    for (const user of users) {
      try {
        const tz = user.timezone || 'Europe/Moscow';
        const localHour = Number(
          new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(nowUtc),
        );
        if (localHour !== user.notifyReminderHour) continue;

        // Проверяем, не отправляли ли уже сегодня
        const todayStart = new Date(nowUtc);
        todayStart.setUTCHours(0, 0, 0, 0);
        const alreadySent = await this.prisma.notificationLog.count({
          where: { userId: user.id, type: 'daily_reminder', sentAt: { gte: todayStart } },
        });
        if (alreadySent > 0) continue;

        await this.notifications.send({
          userId: user.id,
          type: 'daily_reminder',
          message: '\u041d\u0435 \u0437\u0430\u0431\u0443\u0434\u044c\u0442\u0435 \u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c \u0440\u0430\u0441\u0445\u043e\u0434\u044b \u0437\u0430 \u0441\u0435\u0433\u043e\u0434\u043d\u044f!',
        });

        await this.prisma.notificationLog.create({
          data: { userId: user.id, type: 'daily_reminder', message: 'sent' },
        });
      } catch (err) {
        this.logger.error(`Failed reminder for user ${user.id}`, err);
      }
    }
  }

  /** 1 число каждого месяца */
  @Cron('0 9 1 * *')
  async handleMonthStart() {
    const users = await this.prisma.user.findMany({
      where: { notifyMonthStart: true },
      select: { id: true },
    });

    for (const user of users) {
      await this.notifications.send({
        userId: user.id,
        type: 'month_start',
        message: '\u041d\u043e\u0432\u044b\u0439 \u043c\u0435\u0441\u044f\u0446! \u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u043f\u043b\u0430\u043d \u0431\u044e\u0434\u0436\u0435\u0442\u0430 \u043d\u0430 \u044d\u0442\u043e\u0442 \u043c\u0435\u0441\u044f\u0446.',
      });
    }
  }
}
