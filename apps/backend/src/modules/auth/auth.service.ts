import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import { JwtPayload } from '../../common/types';
import { LoginDto, LoginResponseDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ token: string; user: LoginResponseDto }> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, dto.username))
      .limit(1);

    if (!user) throw new UnauthorizedException('Invalid username or password');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Invalid username or password');

    const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        jabatan: user.jabatan,
        nip: user.nip,
      },
    };
  }

  async getMe(userId: string): Promise<LoginResponseDto> {
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        jabatan: users.jabatan,
        nip: users.nip,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
