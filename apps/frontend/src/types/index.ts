export type UserRole = 'admin' | 'pegawai' | 'manager';
export type LapkinStatus = 'draft' | 'locked' | 'evaluated';

/** Label persisted for rest activities (must match backend). */
export const LAPKIN_REST_ACTIVITY_LABEL = 'Istirahat';

export interface User {
  id: string;
  name: string;
  nip: string;
  username: string;
  role: UserRole;
  jobTitle: string;
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
  jobTitle: string;
}

export interface LapkinRowActivity {
  taskDescription: string;
  resultDescription: string;
  performancePercent: string | null;
  fieldDutyPercent: string | null;
  notWorkingPercent: string | null;
  finalScore: string | null;
  /** Rest break activity (label: Istirahat). Omitted/false for normal work lines. */
  isRest?: boolean;
  notes: string | null;
}

export interface LapkinRow {
  id: string;
  lapkinId: string;
  lineNumber: number;
  startTime: string;
  endTime: string;
  activities: LapkinRowActivity[];
  managerAcknowledged: boolean;
}

export interface Lapkin {
  id: string;
  reportDate: string;
  status: LapkinStatus;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  employeeJobTitle: string;
  managerId: string | null;
  managerName: string | null;
  managerNip: string | null;
  managerJobTitle: string | null;
  /** PNG data URL from employee profile. */
  employeeSignatureUrl: string | null;
  /** Set when the employee confirms Sign this LAPKIN (while locked). */
  employeeSignedAt: string | null;
  /** True when employee_signed_at is set. */
  isSignedByEmployee: boolean;
  /** PNG data URL from manager profile. */
  managerSignatureUrl: string | null;
  /** ISO timestamp when appraiser signed off this LAPKIN. */
  managerSignedAt: string | null;
  /** True after appraiser uses Sign this LAPKIN (status becomes evaluated at the same time). */
  isSignedByManager: boolean;
  rows: LapkinRow[];
  createdAt: string;
  updatedAt: string;
}

export interface LapkinRowActivityInput {
  taskDescription: string;
  resultDescription: string;
  performancePercent?: number | null;
  fieldDutyPercent?: number | null;
  finalScore?: number | null;
  notWorkingPercent?: number | null;
  isRest?: boolean;
  notes?: string | null;
}

export interface CreateLapkinRowPayload {
  startTime: string;
  endTime: string;
  activities: LapkinRowActivityInput[];
}

export interface UpdateLapkinRowPayload extends Partial<CreateLapkinRowPayload> { }

export interface CreateUserPayload {
  name: string;
  nip: string;
  username: string;
  password: string;
  role: UserRole;
  jobTitle: string;
  managerId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  nip?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  jobTitle?: string;
  managerId?: string | null;
}
