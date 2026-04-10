import { pgTable, uuid, date, pgEnum, timestamp, integer, text, numeric, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const lapkinStatusEnum = pgEnum('lapkin_status', ['draft', 'locked', 'evaluated']);

export const lapkins = pgTable('lapkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  pegawaiId: uuid('pegawai_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tanggal: date('tanggal').notNull(),
  status: lapkinStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const lapkinRows = pgTable('lapkin_rows', {
  id: uuid('id').primaryKey().defaultRandom(),
  lapkinId: uuid('lapkin_id').notNull().references(() => lapkins.id, { onDelete: 'cascade' }),
  no: integer('no').notNull(),
  waktuMulai: varchar('waktu_mulai', { length: 10 }).notNull(),
  waktuSelesai: varchar('waktu_selesai', { length: 10 }).notNull(),
  uraianTugas: text('uraian_tugas').notNull(),
  uraianHasil: text('uraian_hasil').notNull(),
  hasilKinerja: numeric('hasil_kinerja', { precision: 5, scale: 2 }),
  tugasDinasLuar: numeric('tugas_dinas_luar', { precision: 5, scale: 2 }),
  ket: text('ket'),
  nilaiAkhir: numeric('nilai_akhir', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Lapkin = typeof lapkins.$inferSelect;
export type NewLapkin = typeof lapkins.$inferInsert;
export type LapkinRow = typeof lapkinRows.$inferSelect;
export type NewLapkinRow = typeof lapkinRows.$inferInsert;
