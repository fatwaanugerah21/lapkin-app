import { pgTable, uuid, varchar, pgEnum, timestamp } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'pegawai', 'manager']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nip: varchar('nip', { length: 50 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('pegawai'),
  jabatan: varchar('jabatan', { length: 255 }).notNull(),
  managerId: uuid('manager_id').references((): any => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
