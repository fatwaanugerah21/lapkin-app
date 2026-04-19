import { clsx } from 'clsx';
import { LapkinStatus } from '../../types';

interface StatusBadgeProps {
  status: LapkinStatus;
}

const statusConfig: Record<LapkinStatus, { label: string; className: string }> = {
  draft: { label: 'Draf', className: 'bg-gray-100 text-gray-700 border-gray-200' },
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

interface SignedByManagerBadgeProps {
  isSigned: boolean;
}

interface SignedByEmployeeBadgeProps {
  isSigned: boolean;
}

/** Status paraf penilai pada LAPKIN (ditampilkan selalu: sudah atau belum). */
export const SignedByManagerBadge = ({ isSigned }: SignedByManagerBadgeProps) => {
  if (isSigned) {
    return (
      <span
        className={clsx(
          'px-2.5 py-0.5 rounded-full text-xs font-medium border',
          'bg-teal-50 text-teal-800 border-teal-200',
        )}
        title="Penilai telah menandatangani LAPKIN ini pada laporan."
      >
        Ditandatangani penilai
      </span>
    );
  }
  return (
    <span
      className={clsx(
        'px-2.5 py-0.5 rounded-full text-xs font-medium border',
        'bg-amber-50 text-amber-900 border-amber-200',
      )}
      title="Belum ditandatangani penilai. Paraf dilakukan setelah semua baris yang berisi tugas ditinjau dan persyaratan penandatanganan terpenuhi."
    >
      Belum ditandatangani penilai
    </span>
  );
};

/** Status paraf pembuat laporan pada LAPKIN (ditampilkan selalu: sudah atau belum). */
export const SignedByEmployeeBadge = ({ isSigned }: SignedByEmployeeBadgeProps) => {
  if (isSigned) {
    return (
      <span
        className={clsx(
          'px-2.5 py-0.5 rounded-full text-xs font-medium border',
          'bg-teal-50 text-teal-800 border-teal-200',
        )}
        title="Pembuat laporan telah menandatangani LAPKIN ini pada laporan."
      >
        Ditandatangani pembuat laporan
      </span>
    );
  }
  return (
    <span
      className={clsx(
        'px-2.5 py-0.5 rounded-full text-xs font-medium border',
        'bg-amber-50 text-amber-900 border-amber-200',
      )}
      title="Belum ditandatangani pembuat laporan. Paraf dilakukan setelah LAPKIN dikunci atau selesai dievaluasi, dan tanda tangan profil sudah diisi di halaman Akun."
    >
      Belum ditandatangani pembuat laporan
    </span>
  );
};

interface RoleBadgeProps {
  role: string;
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: 'Administrator', className: 'bg-purple-100 text-purple-800' },
  manager: { label: 'Manajer', className: 'bg-blue-100 text-blue-800' },
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
