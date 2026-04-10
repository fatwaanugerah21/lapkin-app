import { clsx } from 'clsx';
import { LapkinStatus } from '../../types';

interface StatusBadgeProps {
  status: LapkinStatus;
}

const statusConfig: Record<LapkinStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  locked: { label: 'Terkunci', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  evaluated: { label: 'Dievaluasi', className: 'bg-green-100 text-green-800 border-green-200' },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, className } = statusConfig[status];
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', className)}>
      {label}
    </span>
  );
};

interface RoleBadgeProps {
  role: string;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
  manager: { label: 'Manager', className: 'bg-blue-100 text-blue-800' },
  pegawai: { label: 'Pegawai', className: 'bg-gray-100 text-gray-700' },
};

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const config = roleConfig[role] ?? { label: role, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
};
