export interface CreateLapkinDto {
  reportDate: string; // ISO date YYYY-MM-DD
}

export interface LapkinRowActivityItemDto {
  taskDescription: string;
  resultDescription: string;
  performancePercent?: number | null;
  fieldDutyPercent?: number | null;
  finalScore?: number | null;
  notWorkingPercent?: number | null;
  isRest?: boolean;
  notes?: string | null;
}

export interface UpdateLapkinRowDto {
  startTime?: string;
  endTime?: string;
  activities?: LapkinRowActivityItemDto[];
}

export interface CreateLapkinRowDto {
  startTime: string;
  endTime: string;
  activities: LapkinRowActivityItemDto[];
}

/** Manager-only: replace activity percents for a locked row; task/result must match server. */
export interface ManagerUpdateRowScoresDto {
  activities: LapkinRowActivityItemDto[];
}

export interface LapkinRowActivityResponseDto {
  taskDescription: string;
  resultDescription: string;
  performancePercent: string | null;
  fieldDutyPercent: string | null;
  finalScore: string | null;
  notWorkingPercent: string | null;
  isRest: boolean;
  notes: string | null;
}

export interface LapkinRowResponseDto {
  id: string;
  lapkinId: string;
  lineNumber: number;
  startTime: string;
  endTime: string;
  activities: LapkinRowActivityResponseDto[];
  managerAcknowledged: boolean;
}

export interface LapkinResponseDto {
  id: string;
  reportDate: string;
  status: 'draft' | 'locked' | 'evaluated';
  employeeId: string;
  /** Role of the LAPKIN owner (users.role). */
  employeeRole: 'admin' | 'pegawai' | 'manager' | 'direktur';
  employeeName: string;
  employeeNip: string;
  employeeJobTitle: string;
  /** Employee's user.manager_id (appraiser). */
  managerId: string | null;
  managerName: string | null;
  managerNip: string | null;
  managerJobTitle: string | null;
  /** For pegawai LAPKIN: unit direktur (first user with role direktur) for "Mengetahui" footer. */
  directorName: string | null;
  directorNip: string | null;
  /** Direktur profile signature image (PNG data URL), for "Mengetahui" block on pegawai LAPKIN. */
  directorSignatureUrl: string | null;
  /** PNG data URL from employee profile, for footer. */
  employeeSignatureUrl: string | null;
  /** PNG data URL from manager profile, for footer. */
  managerSignatureUrl: string | null;
  /** Set when the employee confirms Sign this LAPKIN (while locked). */
  employeeSignedAt: string | null;
  /** True when employee_signed_at is set. */
  isSignedByEmployee: boolean;
  /** Set when manager confirms LAPKIN sign-off; status becomes evaluated at the same time. */
  managerSignedAt: string | null;
  /** True when manager_signed_at is set (Sign this LAPKIN). */
  isSignedByManager: boolean;
  rows: LapkinRowResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
