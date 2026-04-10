export type UserRole = 'admin' | 'pegawai' | 'manager';
export type LapkinStatus = 'draft' | 'locked' | 'evaluated';

export interface User {
  id: string;
  name: string;
  nip: string;
  username: string;
  role: UserRole;
  jabatan: string;
  managerId: string | null;
  managerName: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  nip: string;
  username: string;
  role: UserRole;
  jabatan: string;
}

export interface LapkinRow {
  id: string;
  lapkinId: string;
  no: number;
  waktuMulai: string;
  waktuSelesai: string;
  uraianTugas: string;
  uraianHasil: string;
  hasilKinerja: string | null;
  tugasDinasLuar: string | null;
  ket: string | null;
  nilaiAkhir: string | null;
}

export interface Lapkin {
  id: string;
  tanggal: string;
  status: LapkinStatus;
  pegawaiId: string;
  pegawaiName: string;
  pegawaiNip: string;
  pegawaiJabatan: string;
  managerName: string | null;
  managerJabatan: string | null;
  rows: LapkinRow[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLapkinRowPayload {
  waktuMulai: string;
  waktuSelesai: string;
  uraianTugas: string;
  uraianHasil: string;
  hasilKinerja?: number | null;
  tugasDinasLuar?: number | null;
  ket?: string | null;
}

export interface UpdateLapkinRowPayload extends Partial<CreateLapkinRowPayload> { }

export interface CreateUserPayload {
  name: string;
  nip: string;
  username: string;
  password: string;
  role: UserRole;
  jabatan: string;
  managerId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  nip?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  jabatan?: string;
  managerId?: string | null;
}
