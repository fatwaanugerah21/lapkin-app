import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcryptjs';
import * as schema from '../schema';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const pegawaiPassword = await bcrypt.hash('pegawai123', 12);

  // Create admin
  const [admin] = await db.insert(schema.users).values({
    name: 'Administrator',
    nip: '000000000000000001',
    username: 'admin',
    passwordHash: adminPassword,
    role: 'admin',
    jabatan: 'System Administrator',
  }).onConflictDoNothing().returning();

  // Create manager
  const [manager] = await db.insert(schema.users).values({
    name: 'IRHAM, S.Kep., Ns',
    nip: '19861025201101 1004',
    username: 'irham',
    passwordHash: managerPassword,
    role: 'manager',
    jabatan: 'Kepala Seksi Pelayanan Medik dan Keperawatan',
  }).onConflictDoNothing().returning();

  // Create pegawai
  if (manager) {
    await db.insert(schema.users).values({
      name: 'Ruslan Dg. Mananring, S.Kep., Ns',
      nip: '19890320 202203 1 001',
      username: 'ruslan',
      passwordHash: pegawaiPassword,
      role: 'pegawai',
      jabatan: 'Infection Prevention and Control Nurse (IPCN)',
      managerId: manager.id,
    }).onConflictDoNothing();
  }

  console.log('✅ Seed complete!');
  console.log('   admin   / admin123');
  console.log('   irham   / manager123');
  console.log('   ruslan  / pegawai123');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
