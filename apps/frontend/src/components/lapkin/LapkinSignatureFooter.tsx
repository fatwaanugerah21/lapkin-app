import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lapkin } from '../../types';
import { Button } from '../ui/Button';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { lapkinAllWorkActivitiesHaveFinalScore } from './lapkinTableScoreUtils';

function ManagerSignatureZone({
  lapkin,
  isLineAppraiser,
  accountHref,
  managerScoreSign,
}: {
  lapkin: Lapkin;
  isLineAppraiser: boolean;
  accountHref: string;
  managerScoreSign?: { persistBeforeSign: () => Promise<void>; draftsReadyForSign: boolean };
}) {
  const signLapkinByManager = useLapkinStore((s) => s.signLapkinByManager);
  const { isLoading, run } = useAsyncAction();

  const dashedBoxClass =
    'flex min-h-[5.5rem] w-full max-w-[14rem] mx-auto flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs text-gray-600 transition-colors';

  const unsignedEmptySpace = (
    <div className="min-h-[5.5rem] w-full max-w-[14rem] mx-auto" aria-hidden />
  );

  const handleSignLapkin = () =>
    run(
      async () => {
        if (managerScoreSign) {
          await managerScoreSign.persistBeforeSign();
        }
        await signLapkinByManager(lapkin.id);
      },
      { successToast: 'LAPKIN berhasil ditandatangani' },
    );

  if (lapkin.isSignedByManager === true) {
    return lapkin.managerSignatureUrl ? (
      <img
        src={lapkin.managerSignatureUrl}
        alt=""
        className="max-h-20 max-w-[12rem] object-contain"
      />
    ) : (
      <span className="text-xs font-medium text-gray-600">Sudah ditandatangani</span>
    );
  }

  if (lapkin.managerSignatureUrl) {
    if (!isLineAppraiser) {
      return unsignedEmptySpace;
    }
    const canSignThisLapkin = managerScoreSign
      ? lapkin.status === 'locked' && managerScoreSign.draftsReadyForSign
      : lapkin.status === 'locked' && lapkinAllWorkActivitiesHaveFinalScore(lapkin);

    const managerSignDisabledTitle = (() => {
      if (canSignThisLapkin) return undefined;
      if (lapkin.status !== 'locked') {
        if (lapkin.status === 'draft') {
          return 'Pejabat penilai hanya dapat menandatangani setelah LAPKIN dikunci oleh pegawai (bukan draf).';
        }
        if (lapkin.status === 'evaluated') {
          return 'LAPKIN sudah ditandatangani dan dievaluasi; tidak perlu menandatangani lagi.';
        }
        return 'Penandatanganan pejabat penilai tidak tersedia pada status LAPKIN ini.';
      }
      if (managerScoreSign && !managerScoreSign.draftsReadyForSign) {
        return 'Lengkapi penilaian: pada setiap baris dan setiap kegiatan kerja, isi minimal salah satu dari hasil kinerja (%), tugas dinas luar (%), atau centang tidak masuk kerja, serta isi nilai akhir (%).';
      }
      if (!managerScoreSign && !lapkinAllWorkActivitiesHaveFinalScore(lapkin)) {
        return 'Setiap kegiatan kerja harus memiliki nilai akhir yang sudah tersimpan sebelum penandatanganan.';
      }
      return 'Tidak dapat menandatangani saat ini.';
    })();

    return (
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={!canSignThisLapkin}
        isLoading={isLoading}
        onClick={handleSignLapkin}
        title={managerSignDisabledTitle}
      >
        Tandatangani LAPKIN ini
      </Button>
    );
  }

  if (isLineAppraiser) {
    return (
      <Link
        to={accountHref}
        className={`${dashedBoxClass} hover:border-primary-400 hover:bg-primary-50/40 cursor-pointer`}
      >
        <span className="font-medium text-gray-800">Belum ada tanda tangan</span>
        <span className="mt-1.5 font-medium text-primary-600">Klik di sini untuk mengisi tanda tangan</span>
      </Link>
    );
  }

  return unsignedEmptySpace;
}

function EmployeeSignatureZone({
  lapkin,
  isEmployeeForThisLapkin,
  accountHref,
}: {
  lapkin: Lapkin;
  isEmployeeForThisLapkin: boolean;
  accountHref: string;
}) {
  const signLapkinByEmployee = useLapkinStore((s) => s.signLapkinByEmployee);
  const { isLoading, run } = useAsyncAction();

  const dashedBoxClass =
    'flex min-h-[5.5rem] w-full max-w-[14rem] mx-auto flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs text-gray-600 transition-colors';

  const unsignedEmptySpace = (
    <div className="min-h-[5.5rem] w-full max-w-[14rem] mx-auto" aria-hidden />
  );

  const handleSignLapkin = () =>
    run(() => signLapkinByEmployee(lapkin.id), { successToast: 'LAPKIN berhasil ditandatangani' });

  if (lapkin.isSignedByEmployee === true) {
    return lapkin.employeeSignatureUrl ? (
      <img
        src={lapkin.employeeSignatureUrl}
        alt=""
        className="max-h-20 max-w-[12rem] object-contain"
      />
    ) : (
      <span className="text-xs font-medium text-gray-600">Sudah ditandatangani</span>
    );
  }

  if (lapkin.employeeSignatureUrl) {
    if (!isEmployeeForThisLapkin) {
      return unsignedEmptySpace;
    }
    const canSignThisLapkin = lapkin.status === 'locked' || lapkin.status === 'evaluated';

    const employeeSignDisabledTitle = (() => {
      if (canSignThisLapkin) return undefined;
      if (lapkin.status === 'draft') {
        return 'Anda dapat menandatangani setelah LAPKIN dikunci (dikirim ke penilai) atau setelah LAPKIN selesai dinilai. Saat ini LAPKIN masih draf.';
      }
      return 'Penandatanganan tidak tersedia pada status LAPKIN ini.';
    })();

    return (
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={!canSignThisLapkin}
        isLoading={isLoading}
        onClick={handleSignLapkin}
        title={employeeSignDisabledTitle}
      >
        Tandatangani LAPKIN ini
      </Button>
    );
  }

  if (isEmployeeForThisLapkin) {
    return (
      <Link
        to={accountHref}
        className={`${dashedBoxClass} hover:border-primary-400 hover:bg-primary-50/40 cursor-pointer`}
      >
        <span className="font-medium text-gray-800">Belum ada tanda tangan</span>
        <span className="mt-1.5 font-medium text-primary-600">Tambah tanda tangan</span>
      </Link>
    );
  }

  return unsignedEmptySpace;
}

function DirekturSignatureZone({
  lapkin,
  accountHref,
  isDirectorUser,
}: {
  lapkin: Lapkin;
  accountHref: string;
  isDirectorUser: boolean;
}) {
  const dashedBoxClass =
    'flex min-h-[5.5rem] w-full max-w-[14rem] mx-auto flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs text-gray-600 transition-colors';

  const unsignedEmptySpace = (
    <div className="min-h-[5.5rem] w-full max-w-[14rem] mx-auto" aria-hidden />
  );

  if (lapkin.directorSignatureUrl) {
    return (
      <img
        src={lapkin.directorSignatureUrl}
        alt=""
        className="max-h-20 max-w-[12rem] object-contain mx-auto"
      />
    );
  }

  if (isDirectorUser) {
    return (
      <Link
        to={accountHref}
        className={`${dashedBoxClass} hover:border-primary-400 hover:bg-primary-50/40 cursor-pointer`}
      >
        <span className="font-medium text-gray-800">Belum ada tanda tangan</span>
        <span className="mt-1.5 font-medium text-primary-600">Tambah tanda tangan di Akun</span>
      </Link>
    );
  }

  return unsignedEmptySpace;
}

export function LapkinSignatureFooter({
  lapkin,
  managerScoreSign,
}: {
  lapkin: Lapkin;
  managerScoreSign?: { persistBeforeSign: () => Promise<void>; draftsReadyForSign: boolean };
}) {
  const user = useAuthStore((s) => s.user);
  const accountHref = useMemo(() => {
    if (user?.role === 'manager') return '/manager/account';
    if (user?.role === 'direktur') return '/direktur/account';
    if (user?.role === 'admin') return '/admin/account';
    return '/pegawai/account';
  }, [user?.role]);

  const isLineAppraiser =
    lapkin.managerId != null &&
    user?.id === lapkin.managerId &&
    (user?.role === 'manager' || user?.role === 'direktur');
  const isEmployeeForThisLapkin = user?.id === lapkin.employeeId;
  const isDirectorUser = user?.role === 'direktur';

  const showMengetahui = lapkin.employeeRole === 'pegawai';

  return (
    <div className="lapkin-print-signature-zone border-t border-gray-200 px-4 py-4 text-xs sm:text-sm">
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <p className="font-medium text-gray-700 mb-1.5">PEJABAT PENILAI,</p>
          <div className="min-h-[4.5rem] flex flex-col items-center justify-center gap-2 mb-2">
            <ManagerSignatureZone
              lapkin={lapkin}
              isLineAppraiser={isLineAppraiser}
              accountHref={accountHref}
              managerScoreSign={managerScoreSign}
            />
          </div>
          <p className="font-semibold text-gray-900">{lapkin.managerName ?? '_______________'}</p>
          {lapkin.managerName != null && (
            <p className="text-gray-500 text-xs mt-0.5">NIP. {lapkin.managerNip ?? '—'}</p>
          )}
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700 mb-1.5">YANG MEMBUAT LAPORAN,</p>
          <div className="min-h-[4.5rem] flex flex-col items-center justify-center gap-2 mb-2">
            <EmployeeSignatureZone
              lapkin={lapkin}
              isEmployeeForThisLapkin={isEmployeeForThisLapkin}
              accountHref={accountHref}
            />
          </div>
          <p className="font-semibold text-gray-900">{lapkin.employeeName}</p>
          <p className="text-gray-500 text-xs mt-0.5">NIP. {lapkin.employeeNip}</p>
        </div>
      </div>
      {showMengetahui && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="font-medium text-gray-700 mb-1.5">Mengetahui</p>
          <div className="min-h-[4.5rem] flex flex-col items-center justify-center gap-2 mb-2">
            <DirekturSignatureZone
              lapkin={lapkin}
              accountHref={accountHref}
              isDirectorUser={isDirectorUser}
            />
          </div>
          <p className="font-semibold text-gray-900">
            {lapkin.directorName?.trim() || '_______________'}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">NIP. {lapkin.directorNip ?? '—'}</p>
        </div>
      )}
    </div>
  );
}
