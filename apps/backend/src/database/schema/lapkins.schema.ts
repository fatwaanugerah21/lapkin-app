import {
  pgTable, uuid, date, pgEnum, timestamp, integer, numeric, varchar, text, boolean,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const lapkinStatusEnum = pgEnum('lapkin_status', ['draft', 'locked', 'evaluated']);

export const lapkins = pgTable('lapkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reportDate: date('report_date').notNull(),
  status: lapkinStatusEnum('status').notNull().default('draft'),
  employeeSignedAt: timestamp('employee_signed_at'),
  managerSignedAt: timestamp('manager_signed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lapkinRows = pgTable('lapkin_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  lapkinId: uuid('lapkin_id').notNull().references(() => lapkins.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  managerAcknowledged: boolean('manager_acknowledged').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lapkinRowActivities = pgTable('lapkin_row_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  lapkinRowId: uuid('lapkin_row_id').notNull().references(() => lapkinRows.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull(),
  taskDescription: text('task_description').notNull(),
  resultDescription: text('result_description').notNull(),
  performancePercent: numeric('performance_percent', { precision: 5, scale: 2 }),
  fieldDutyPercent: numeric('field_duty_percent', { precision: 5, scale: 2 }),
  finalScore: numeric('final_score', { precision: 5, scale: 2 }),
  notWorkingPercent: numeric('not_working_percent', { precision: 5, scale: 2 }),
  isRest: boolean('is_rest').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Lapkin = typeof lapkins.$inferSelect;
export type NewLapkin = typeof lapkins.$inferInsert;
export type LapkinRow = typeof lapkinRows.$inferSelect;
export type NewLapkinRow = typeof lapkinRows.$inferInsert;
export type LapkinRowActivity = typeof lapkinRowActivities.$inferSelect;
export type NewLapkinRowActivity = typeof lapkinRowActivities.$inferInsert;
