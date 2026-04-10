import { UserRole } from '../../common/types';

export interface CreateUserDto {
  name: string;
  nip: string;
  username: string;
  password: string;
  role: UserRole;
  jabatan: string;
  managerId?: string;
}

export interface UpdateUserDto {
  name?: string;
  nip?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  jabatan?: string;
  managerId?: string | null;
}

export interface UserResponseDto {
  id: string;
  name: string;
  nip: string;
  username: string;
  role: UserRole;
  jabatan: string;
  managerId: string | null;
  managerName: string | null;
  createdAt: Date;
}
