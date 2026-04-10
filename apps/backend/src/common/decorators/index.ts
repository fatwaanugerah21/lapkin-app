import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { RequestUser, UserRole } from '../types';
import { ROLES_KEY } from '../guards/roles.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
