import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import { JwtPayload } from '../../common/types';
import { LoginDto, LoginResponseDto, UserSignatureResponseDto, UpdateUserSignatureDto } from './auth.dto';

const MAX_SIGNATURE_LENGTH = 600_000;

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
        jobTitle: user.jobTitle,
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
        jobTitle: users.jobTitle,
        nip: users.nip,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async getSignature(userId: string): Promise<UserSignatureResponseDto> {
    const [row] = await this.db
      .select({ signatureDataUrl: users.signatureDataUrl })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) throw new UnauthorizedException('User not found');
    return { signatureDataUrl: row.signatureDataUrl ?? null };
  }

  async updateSignature(userId: string, dto: UpdateUserSignatureDto): Promise<UserSignatureResponseDto> {
    const { signatureDataUrl } = dto;

    if (signatureDataUrl !== null) {
      if (typeof signatureDataUrl !== 'string') {
        throw new BadRequestException('signatureDataUrl must be a string or null');
      }
      if (!signatureDataUrl.startsWith('data:image/png;base64,')) {
        throw new BadRequestException('Signature must be a PNG data URL');
      }
      if (signatureDataUrl.length > MAX_SIGNATURE_LENGTH) {
        throw new BadRequestException('Signature is too large');
      }
    }

    await this.db
      .update(users)
      .set({ signatureDataUrl, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { signatureDataUrl };
  }
}
