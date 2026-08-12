import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

class LoginDto {
  @IsString()
  initData: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    const tgUser = this.auth.extractUser(body.initData);
    if (!tgUser) throw new UnauthorizedException('Подпись initData недействительна');

    const user = await this.auth.upsertUser(tgUser);
    await this.auth.seedDefaultCategories(user.id);
    const token = this.tokens.sign(String(user.id));

    return { token, user };
  }
}