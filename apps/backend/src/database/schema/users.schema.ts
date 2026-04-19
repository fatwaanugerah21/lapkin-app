import { pgTable, uuid, varchar, pgEnum, timestamp, text } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'pegawai', 'manager']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  nip: varchar('nip', { length: 50 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('pegawai'),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  managerId: uuid('manager_id').references((): any => users.id, { onDelete: 'set null' }),
  /** PNG data URL for LAPKIN footer signature (optional). */
  signatureDataUrl: text('signature_data_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
