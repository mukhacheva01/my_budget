import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseInitData, validateInitData, type TelegramUser } from './initdata';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_CATEGORIES = [
  { name: 'Продукты', emoji: '🛒', color: '#CEDFD9' },
  { name: 'Кафе и рестораны', emoji: '🍜', color: '#B09398' },
  { name: 'Транспорт', emoji: '🚇', color: '#9B6A6C' },
  { name: 'Развлечения', emoji: '🎬', color: '#5F5449' },
  { name: 'Здоровье', emoji: '💊', color: '#EBFCFB' },
  { name: 'Дом', emoji: '🏠', color: '#4DBA83' },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  isDevMode(): boolean {
    return this.config.get<string>('DEV_MODE') === 'true';
  }

  /** Валидирует initData и возвращает пользователя Telegram либо null. */
  extractUser(initData?: string): TelegramUser | null {
    if (!initData) return null;

    const botToken = this.config.get<string>('BOT_TOKEN');

    if (!botToken) {
      if (!this.isDevMode()) return null;
    } else if (!validateInitData(initData, botToken)) {
      return null;
    }

    return parseInitData(initData).user ?? null;
  }

  async upsertUser(tgUser: TelegramUser) {
    return this.prisma.user.upsert({
      where: { id: BigInt(tgUser.id) },
      create: {
        id: BigInt(tgUser.id),
        firstName: tgUser.firstName ?? 'Пользователь',
        lastName: tgUser.lastName,
        username: tgUser.username,
      },
      update: {
        firstName: tgUser.firstName ?? 'Пользователь',
        lastName: tgUser.lastName,
        username: tgUser.username,
      },
    });
  }

  async seedDefaultCategories(userId: bigint) {
    const count = await this.prisma.category.count({ where: { userId } });
    if (count > 0) return;
    await this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((d, i) => ({ ...d, userId, sortOrder: i })),
    });
  }
}