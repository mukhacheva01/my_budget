import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenPayload {
  sub: string;
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  private get secret(): string {
    return this.config.get<string>('AUTH_SECRET') ?? '';
  }

  sign(sub: string, ttlSeconds = 30 * 24 * 60 * 60): string {
    const payload: TokenPayload = {
      sub,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  verify(token: string): string | null {
    if (!this.secret) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;

    const expected = createHmac('sha256', this.secret).update(body).digest();
    const provided = Buffer.from(sig, 'base64url');
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
      if (!payload.sub || typeof payload.exp !== 'number') return null;
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload.sub;
    } catch {
      return null;
    }
  }
}