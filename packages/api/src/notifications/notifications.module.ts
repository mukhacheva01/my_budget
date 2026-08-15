import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService, NotificationsScheduler],
  exports: [NotificationService],
})
export class NotificationsModule {}
