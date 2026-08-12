import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Глобальный guard. Принимает `Authorization: Bearer <token>` —
 * предпочтительный способ. Для локальной разработки без BOT_TOKEN
 * разрешён также заголовок `x-init-data` (только в DEV_MODE).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const path = (context.switchToHttp().getRequest().path ?? '') as string;
    const isDocs = path.startsWith('/api/docs');
    if (isDocs) return true;

    const req = context.switchToHttp().getRequest();
    const headers = (req.headers ?? {}) as Record<string, string | undefined>;
    const authorization = headers.authorization ?? '';
    const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (bearer) {
      const sub = this.tokens.verify(bearer);
      if (!sub) throw new UnauthorizedException('Сессия недействительна или истекла');
      const user = await this.prisma.user.findUnique({ where: { id: BigInt(sub) } });
      if (!user) throw new UnauthorizedException('Пользователь не найден');
      req.user = user;
      return true;
    }

    const initData = headers['x-init-data'] ?? req.query?.initData;
    if (this.auth.isDevMode() && initData) {
      const tgUser = this.auth.extractUser(String(initData));
      if (tgUser) {
        const user = await this.auth.upsertUser(tgUser);
        await this.auth.seedDefaultCategories(user.id);
        req.user = user;
        return true;
      }
    }

    throw new UnauthorizedException('Невалидные данные входа Telegram');
  }
}