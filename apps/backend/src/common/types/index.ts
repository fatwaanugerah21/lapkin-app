export type UserRole = 'admin' | 'pegawai' | 'manager';

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
}
