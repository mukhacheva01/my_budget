import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthedUser {
  id: bigint;
  firstName: string;
  lastName: string | null;
  username: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);