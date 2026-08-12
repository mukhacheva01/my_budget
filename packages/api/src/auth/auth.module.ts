import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthService, TokenService, AuthGuard],
  exports: [AuthService, TokenService, AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}