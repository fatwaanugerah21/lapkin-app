import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
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

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const [created] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        nip: dto.nip,
        username: dto.username,
        passwordHash,
        role: dto.role,
        jobTitle: dto.jobTitle,
        managerId: dto.managerId ?? null,
      })
      .returning();

    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.assertUserExists(id);

    if (dto.username || dto.nip) {
      await this.assertUsernameAndNipAreUnique(dto.username, dto.nip, id);
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.nip) updateData.nip = dto.nip;
    if (dto.username) updateData.username = dto.username;
    if (dto.role) updateData.role = dto.role;
    if (dto.jobTitle !== undefined) updateData.jobTitle = dto.jobTitle;
    if ('managerId' in dto) updateData.managerId = dto.managerId;
    if (dto.password) updateData.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

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
