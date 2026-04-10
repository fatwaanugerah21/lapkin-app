export interface CreateLapkinDto {
  tanggal: string; // ISO date string YYYY-MM-DD
}

export interface UpdateLapkinRowDto {
  waktuMulai?: string;
  waktuSelesai?: string;
  uraianTugas?: string;
  uraianHasil?: string;
  hasilKinerja?: number | null;
  tugasDinasLuar?: number | null;
  ket?: string | null;
}

export interface CreateLapkinRowDto {
  waktuMulai: string;
  waktuSelesai: string;
  uraianTugas: string;
  uraianHasil: string;
  hasilKinerja?: number | null;
  tugasDinasLuar?: number | null;
  ket?: string | null;
}

export interface EvaluateRowDto {
  nilaiAkhir: number;
}

export interface LapkinRowResponseDto {
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

export interface LapkinResponseDto {
  id: string;
  tanggal: string;
  status: 'draft' | 'locked' | 'evaluated';
  pegawaiId: string;
  pegawaiName: string;
  pegawaiNip: string;
  pegawaiJabatan: string;
  managerName: string | null;
  managerJabatan: string | null;
  rows: LapkinRowResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
