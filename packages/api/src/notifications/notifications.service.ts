import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationPayload {
  userId: bigint;
  type: 'limit_warning' | 'overspend' | 'month_start' | 'daily_reminder' | 'goal_completed';
  message: string;
}

/**
 * Сервис уведомлений. На данном этапе логирует события;
 * позже интегрируется с ботом через BullMQ / Redis.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[Уведомление] user=${payload.userId} type=${payload.type}: ${payload.message}`,
    );
    // TODO: интеграция с ботом и сохранение в журнал
  }

  async checkLimitWarnings(userId: bigint, month: number, year: number): Promise<void> {
    // TODO: проверять категории с расходом > 80% лимита
    this.logger.debug(`checkLimitWarnings user=${userId} ${year}-${month}`);
  }
}
