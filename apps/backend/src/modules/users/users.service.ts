import {
  Injectable, Inject, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { eq, ne, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import * as bcrypt from 'bcryptjs';
import { DRIZZLE } from '../../database/database.module';
import { users } from '../../database/schema';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './users.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async findAll(): Promise<UserResponseDto[]> {
    const managers = alias(users, 'managers');
    const result = await this.db
      .select({
        id: users.id,
        name: users.name,
        nip: users.nip,
        username: users.username,
        role: users.role,
        jobTitle: users.jobTitle,
        managerId: users.managerId,
        managerName: managers.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(managers, eq(users.managerId, managers.id))
      .orderBy(users.createdAt);

    return result;
  }

  async findById(id: string): Promise<UserResponseDto> {
    const managers = alias(users, 'managers');
    const [user] = await this.db
      .select({
        id: users.id,
        name: users.name,
        nip: users.nip,
        username: users.username,
        role: users.role,
        jobTitle: users.jobTitle,
        managerId: users.managerId,
        managerName: managers.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(managers, eq(users.managerId, managers.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findDirectReports(managerId: string): Promise<UserResponseDto[]> {
    return this.db
      .select({
        id: users.id,
        name: users.name,
        nip: users.nip,
        username: users.username,
        role: users.role,
        jobTitle: users.jobTitle,
        managerId: users.managerId,
        managerName: sql<string>`null`,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.managerId, managerId));
  }

  async findManagers(): Promise<{ id: string; name: string; jobTitle: string }[]> {
    return this.db
      .select({ id: users.id, name: users.name, jobTitle: users.jobTitle })
      .from(users)
      .where(eq(users.role, 'manager'));
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    await this.assertUsernameAndNipAreUnique(dto.username, dto.nip);
    if (dto.role === 'direktur') await this.assertNoOtherDirektur();

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    let managerId = dto.managerId ?? null;
    if (dto.role === 'manager') {
      const dirId = await this.getDirekturId();
      if (!dirId) {
        throw new BadRequestException('Create a director account before adding managers');
      }
      managerId = dirId;
    }

    const [created] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        nip: dto.nip,
        username: dto.username,
        passwordHash,
        role: dto.role,
        jobTitle: dto.jobTitle,
        managerId,
      })
      .returning();

    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.assertUserExists(id);

    if (dto.username || dto.nip) {
      await this.assertUsernameAndNipAreUnique(dto.username, dto.nip, id);
    }

    if (dto.role === 'direktur') await this.assertNoOtherDirektur(id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.nip) updateData.nip = dto.nip;
    if (dto.username) updateData.username = dto.username;
    if (dto.role) updateData.role = dto.role;
    if (dto.jobTitle !== undefined) updateData.jobTitle = dto.jobTitle;
    if (dto.password) updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const [existing] = await this.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const effectiveRole = dto.role ?? existing?.role;

    if (effectiveRole === 'manager') {
      const dirId = await this.getDirekturId();
      if (!dirId) {
        throw new BadRequestException('No director account exists. Add a director user first.');
      }
      updateData.managerId = dirId;
    } else if (effectiveRole === 'pegawai' && 'managerId' in dto) {
      updateData.managerId = dto.managerId;
    } else if (dto.role === 'admin' || dto.role === 'direktur') {
      updateData.managerId = null;
    }

    await this.db.update(users).set(updateData).where(eq(users.id, id));

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.assertUserExists(id);
    await this.db.delete(users).where(eq(users.id, id));
  }

  private async assertUserExists(id: string): Promise<void> {
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new NotFoundException('User not found');
  }

  private async getDirekturId(): Promise<string | null> {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'direktur'))
      .limit(1);
    return row?.id ?? null;
  }

  private async assertNoOtherDirektur(excludeUserId?: string): Promise<void> {
    const condition = excludeUserId
      ? and(eq(users.role, 'direktur'), ne(users.id, excludeUserId))
      : eq(users.role, 'direktur');
    const [other] = await this.db.select({ id: users.id }).from(users).where(condition).limit(1);
    if (other) throw new ConflictException('Only one director account is allowed in the system');
  }

  private async assertUsernameAndNipAreUnique(username?: string, nip?: string, excludeId?: string): Promise<void> {
    if (username) {
      const conditions = excludeId
        ? and(eq(users.username, username), ne(users.id, excludeId))
        : eq(users.username, username);
      const [existing] = await this.db.select({ id: users.id }).from(users).where(conditions).limit(1);
      if (existing) throw new ConflictException('Username already taken');
    }

    if (nip) {
      const conditions = excludeId
        ? and(eq(users.nip, nip), ne(users.id, excludeId))
        : eq(users.nip, nip);
      const [existing] = await this.db.select({ id: users.id }).from(users).where(conditions).limit(1);
      if (existing) throw new ConflictException('NIP already registered');
    }
  }
}
