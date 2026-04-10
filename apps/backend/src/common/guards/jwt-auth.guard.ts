import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, RequestUser } from '../types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);

    if (!token) throw new UnauthorizedException('No authentication token found');

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = { id: payload.sub, username: payload.username, role: payload.role } satisfies RequestUser;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromCookie(request: any): string | undefined {
    return request.cookies?.['access_token'];
  }
}
