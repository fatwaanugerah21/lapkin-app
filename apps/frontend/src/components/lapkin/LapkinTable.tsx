import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Star } from 'lucide-react';
import {
  Lapkin,
  LapkinRow,
  LapkinRowActivityInput,
  CreateLapkinRowPayload,
  LAPKIN_REST_ACTIVITY_LABEL,
} from '../../types';
import { Button } from '../ui/Button';
import { RowFormModal } from './RowFormModal';
import { EvaluateRowModal } from './EvaluateRowModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAsyncAction } from '../../hooks/useAsyncAction';

type ScoreDraft = { performance: string; fieldDuty: string; notWorking: string };

const parsePercentInput = (s: string): number | null => {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const computeFinalDisplay = (perf: string, field: string): string | null => {
  const p = parsePercentInput(perf);
  const f = parsePercentInput(field);
  if (p == null || f == null) return null;
  const avg = (p + f) / 2;
  return String(avg);
};

const draftsFromRow = (row: LapkinRow): ScoreDraft[] =>
  row.activities.map((a) => ({
    performance: a.performancePercent ?? '',
    fieldDuty: a.fieldDutyPercent ?? '',
    notWorking:
      a.notWorkingPercent != null && a.notWorkingPercent !== ''
        ? a.notWorkingPercent
        : '0',
  }));

const buildManagerPayload = (row: LapkinRow, drafts: ScoreDraft[]): LapkinRowActivityInput[] =>
  row.activities.map((a, i) => {
    const d = drafts[i];
    if (a.isRest) {
      return {
        taskDescription: a.taskDescription,
        resultDescription: a.resultDescription,
        isRest: true,
        notes: a.notes,
        performancePercent: null,
        fieldDutyPercent: null,
        notWorkingPercent: null,
        finalScore: null,
      };
    }
    return {
      taskDescription: a.taskDescription,
      resultDescription: a.resultDescription,
      isRest: false,
      notes: a.notes,
      performancePercent: parsePercentInput(d.performance),
      fieldDutyPercent: parsePercentInput(d.fieldDuty),
      notWorkingPercent: parsePercentInput(d.notWorking) ?? 0,
      finalScore: null,
    };
  });

const rowScoresComplete = (row: LapkinRow, drafts: ScoreDraft[] | undefined): boolean => {
  if (!drafts || drafts.length !== row.activities.length) return false;
  return row.activities.every((a, i) => {
    if (a.isRest) return true;
    const d = drafts[i];
    return (
      parsePercentInput(d.performance) != null &&
      parsePercentInput(d.fieldDuty) != null &&
      parsePercentInput(d.notWorking) != null
    );
  });
};

interface LapkinTableProps {
  lapkin: Lapkin;
}

function allEvaluableRowsAcknowledgedForSign(lapkin: Lapkin): boolean {
  const rowsNeedingAck = lapkin.rows.filter((r) => {
    const acts = r.activities ?? [];
    return acts.length > 0 && acts.some((a) => a.isRest !== true);
  });
  if (rowsNeedingAck.length === 0) return true;
  return rowsNeedingAck.every((r) => r.managerAcknowledged);
}

function ManagerSignatureZone({
  lapkin,
  isLineAppraiser,
  accountHref,
}: {
  lapkin: Lapkin;
  isLineAppraiser: boolean;
  accountHref: string;
}) {
  const signLapkinByManager = useLapkinStore((s) => s.signLapkinByManager);
  const { isLoading, run } = useAsyncAction();

  const dashedBoxClass =
    'flex min-h-[5.5rem] w-full max-w-[14rem] mx-auto flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-center text-xs text-gray-600 transition-colors';

  const unsignedEmptySpace = (
    <div className="min-h-[5.5rem] w-full max-w-[14rem] mx-auto" aria-hidden />
  );

  const handleSignLapkin = () =>
    run(() => signLapkinByManager(lapkin.id), { successToast: 'LAPKIN berhasil ditandatangani' });

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
    const canSignThisLapkin =
      lapkin.status === 'locked' && allEvaluableRowsAcknowledgedForSign(lapkin);
    return (
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={!canSignThisLapkin}
        isLoading={isLoading}
        onClick={handleSignLapkin}
        title={
          !canSignThisLapkin && lapkin.status === 'locked'
            ? 'Tandai semua baris tugas sebelum menandatangani LAPKIN ini'
            : undefined
        }
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
    return (
      <Button
        type="button"
        size="sm"
        variant="primary"
        disabled={!canSignThisLapkin}
        isLoading={isLoading}
        onClick={handleSignLapkin}
        title={
          !canSignThisLapkin
            ? 'Kunci LAPKIN terlebih dahulu, atau tunggu hingga LAPKIN selesai dievaluasi'
            : undefined
        }
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

function LapkinSignatureFooter({ lapkin }: { lapkin: Lapkin }) {
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

interface RowActionButtonsProps {
  canEdit: boolean;
  canEvaluate: boolean;
  evaluateDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
}

function RowActionButtons({
  canEdit,
  canEvaluate,
  evaluateDisabled,
  onEdit,
  onDelete,
  onEvaluate,
}: RowActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      {canEdit && (
        <>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
            title="Ubah"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
      {canEvaluate && (
        <button
          type="button"
          onClick={onEvaluate}
          disabled={evaluateDisabled}
          title={
            evaluateDisabled
              ? 'Isi ketiga kolom persentase untuk semua kegiatan kerja pada baris ini'
              : 'Tandai baris ditinjau'
          }
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            evaluateDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-yellow-50 text-yellow-600',
          )}
        >
          <Star className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

const scoreInputClass = clsx(
  'input-number-no-spin w-full min-w-0 max-w-[4.25rem] mx-auto block text-center',
  'rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 tabular-nums shadow-sm',
  'transition-all duration-200 placeholder:text-gray-400',
  'hover:border-gray-300 hover:shadow',
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md',
);

export const LapkinTable = ({ lapkin }: LapkinTableProps) => {
  const { user } = useAuthStore();
  const { addRow, updateRow, deleteRow, evaluateRow, managerUpdateRowScores } = useLapkinStore();
  const { isLoading, run } = useAsyncAction();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRow, setEditingRow] = useState<LapkinRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<LapkinRow | null>(null);
  const [evaluatingRow, setEvaluatingRow] = useState<LapkinRow | null>(null);
  const [scoreDraftsByRow, setScoreDraftsByRow] = useState<Record<string, ScoreDraft[]>>({});

  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lapkinRef = useRef(lapkin);
  const draftsRef = useRef(scoreDraftsByRow);
  lapkinRef.current = lapkin;
  draftsRef.current = scoreDraftsByRow;

  const isEmployeeOwner =
    lapkin.employeeId === user?.id &&
    (user?.role === 'pegawai' || user?.role === 'manager');
  const isDraft = lapkin.status === 'draft';
  const isLocked = lapkin.status === 'locked';

  const canEdit = isEmployeeOwner && isDraft;
  const canEvaluateAsManager =
    user?.role === 'manager' && isLocked && lapkin.managerId === user.id;
  const canEvaluateAsDirektur =
    user?.role === 'direktur' &&
    isLocked &&
    lapkin.employeeRole === 'manager' &&
    lapkin.managerId === user.id;
  const canEvaluate = canEvaluateAsManager || canEvaluateAsDirektur;

  const actionColCount = canEdit || canEvaluate ? 1 : 0;
  const emptyColSpan = 8 + actionColCount;

  useEffect(() => {
    const next: Record<string, ScoreDraft[]> = {};
    for (const row of lapkin.rows) {
      next[row.id] = draftsFromRow(row);
    }
    setScoreDraftsByRow(next);
  }, [lapkin.id]);

  const schedulePersist = useCallback(
    (rowId: string) => {
      window.clearTimeout(saveTimersRef.current[rowId]);
      saveTimersRef.current[rowId] = window.setTimeout(() => {
        const l = lapkinRef.current;
        const row = l.rows.find((r) => r.id === rowId);
        const d = draftsRef.current[rowId];
        if (!row || !d || !rowScoresComplete(row, d)) return;
        void managerUpdateRowScores(l.id, rowId, buildManagerPayload(row, d));
      }, 500);
    },
    [managerUpdateRowScores],
  );

  const patchScoreDraft = (rowId: string, activityIndex: number, partial: Partial<ScoreDraft>) => {
    setScoreDraftsByRow((prev) => {
      const row = lapkin.rows.find((r) => r.id === rowId);
      if (!row) return prev;
      const current = prev[rowId] ?? draftsFromRow(row);
      const nextDrafts = current.map((d, i) => (i === activityIndex ? { ...d, ...partial } : d));
      return { ...prev, [rowId]: nextDrafts };
    });
    schedulePersist(rowId);
  };

  const flushRowSave = useCallback(
    async (rowId: string) => {
      window.clearTimeout(saveTimersRef.current[rowId]);
      const row = lapkinRef.current.rows.find((r) => r.id === rowId);
      const d = draftsRef.current[rowId];
      if (!row || !d || !rowScoresComplete(row, d)) return;
      await managerUpdateRowScores(lapkinRef.current.id, rowId, buildManagerPayload(row, d));
    },
    [managerUpdateRowScores],
  );

  const handleEvaluateClick = async (row: LapkinRow) => {
    try {
      await flushRowSave(row.id);
      setEvaluatingRow(row);
    } catch {
      toast.error('Gagal menyimpan penilaian sebelum ditinjau');
    }
  };

  const handleAddRow = async (payload: CreateLapkinRowPayload) => {
    await run(() => addRow(lapkin.id, payload), { successToast: 'Baris berhasil ditambahkan' });
  };

  const handleUpdateRow = async (payload: CreateLapkinRowPayload) => {
    if (!editingRow) return;
    await run(() => updateRow(lapkin.id, editingRow.id, payload), { successToast: 'Baris berhasil diperbarui' });
  };

  const handleDeleteRow = async () => {
    if (!deletingRow) return;
    await run(() => deleteRow(lapkin.id, deletingRow.id), { successToast: 'Baris berhasil dihapus' });
    setDeletingRow(null);
  };

  const handleEvaluateRow = async () => {
    if (!evaluatingRow) return;
    await run(() => evaluateRow(lapkin.id, evaluatingRow.id), { successToast: 'Baris ditandai sudah ditinjau' });
  };

  return (
    <div className="lapkin-print-table bg-white border border-gray-200 rounded-xl overflow-hidden print:rounded-lg print:shadow-none">
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-primary-700 text-white">
              <th className="px-2 py-2 text-center font-semibold w-10">NO</th>
              <th className="px-2 py-2 text-center font-semibold w-28">WAKTU</th>
              <th className="px-2 py-2 text-left font-semibold">URAIAN TUGAS JABATAN / KINERJA PROSES BULANAN</th>
              <th className="px-2 py-2 text-left font-semibold">URAIAN HASIL</th>
              <th className="px-2 py-2 text-center font-semibold w-20">HASIL KINERJA (%)</th>
              <th className="px-2 py-2 text-center font-semibold w-20">TUGAS DINAS LUAR (%)</th>
              <th className="px-2 py-2 text-center font-semibold w-20">TIDAK MASUK KERJA ATAU SECARA NYATA TIDAK MELAKSANAN TUGAS (%)</th>
              <th className="px-2 py-2 text-center font-semibold w-24">NILAI AKHIR (%)</th>
              <th className="px-2 py-2 text-center font-semibold w-20">KET</th>
              {(canEdit || canEvaluate) && (
                <th className="px-2 py-2 text-center font-semibold w-24 print:hidden">AKSI</th>
              )}
            </tr>
          </thead>
          <tbody>
            {lapkin.rows.length === 0 && (
              <tr>
                <td colSpan={emptyColSpan} className="text-center py-10 text-gray-400">
                  Belum ada baris. {canEdit && 'Klik "Tambah Baris" untuk mulai.'}
                </td>
              </tr>
            )}
            {lapkin.rows.map((row) => {
              const activities = row.activities ?? [];
              const rowCount = Math.max(activities.length, 1);
              const rowHasWorkActivity = activities.some((a) => a.isRest !== true);
              const canShowEvaluateStar =
                canEvaluate &&
                !row.managerAcknowledged &&
                activities.length > 0 &&
                rowHasWorkActivity;
              const rowDrafts = scoreDraftsByRow[row.id] ?? draftsFromRow(row);
              const evaluateDisabled = !rowScoresComplete(row, rowDrafts);

              if (activities.length === 0) {
                return (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors align-top">
                    <td className="px-3 py-3 text-center font-medium text-gray-500 align-middle">{row.lineNumber}</td>
                    <td className="px-3 py-3 text-center text-gray-700 whitespace-nowrap align-middle">
                      {row.startTime} – {row.endTime}
                    </td>
                    <td className="px-3 py-3 text-gray-400" colSpan={4}>–</td>
                    <td className="px-3 py-3 text-center align-middle">
                      <span className="text-gray-300">-</span>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-400">–</td>
                    {(canEdit || canEvaluate) && (
                      <td className="px-3 py-3 align-middle print:hidden">
                        <RowActionButtons
                          canEdit={canEdit}
                          canEvaluate={canShowEvaluateStar}
                          evaluateDisabled
                          onEdit={() => setEditingRow(row)}
                          onDelete={() => setDeletingRow(row)}
                          onEvaluate={() => void handleEvaluateClick(row)}
                        />
                      </td>
                    )}
                  </tr>
                );
              }

              return activities.map((activity, index) => {
                const isRest = activity.isRest === true;
                const managerEditsScores =
                  canEvaluate && !isRest && lapkin.isSignedByManager !== true;
                const draft = rowDrafts[index];
                const finalShown = managerEditsScores && draft
                  ? computeFinalDisplay(draft.performance, draft.fieldDuty)
                  : activity.finalScore;
                const notWorkingForKet =
                  managerEditsScores && draft
                    ? (parsePercentInput(draft.notWorking) ?? 0)
                    : Number(activity.notWorkingPercent ?? 0);
                const showNotWorkingKet = !isRest && notWorkingForKet > 0;

                return (
                  <tr
                    key={`${row.id}-${index}`}
                    className={`${index === 0 ? 'border-t border-gray-100' : ''} border-b border-gray-100 transition-colors align-top ${isRest ? 'bg-slate-50/90 hover:bg-slate-100/90' : 'hover:bg-gray-50'}`}
                  >
                    {index === 0 && (
                      <>
                        <td
                          rowSpan={rowCount}
                          className="px-3 py-3 text-center font-medium text-gray-500 align-middle border-r border-gray-100"
                        >
                          {row.lineNumber}
                        </td>
                        <td
                          rowSpan={rowCount}
                          className="px-3 py-3 text-center text-gray-700 whitespace-nowrap align-middle border-r border-gray-100"
                        >
                          {row.startTime} – {row.endTime}
                        </td>
                      </>
                    )}
                    {isRest ? (
                      <>
                        <td
                          colSpan={2}
                          className="px-3 py-3 text-center text-gray-800 max-w-xs"
                        >
                          <span className="font-medium text-slate-700 italic">{LAPKIN_REST_ACTIVITY_LABEL}</span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3 text-gray-800 max-w-xs">
                          {activity.taskDescription || '–'}
                        </td>
                        <td className="px-3 py-3 text-gray-800 max-w-xs">
                          {activity.resultDescription || '–'}
                        </td>
                      </>
                    )}
                    {isRest ? (
                      <td className="px-3 py-3 text-center text-gray-400">–</td>
                    ) : managerEditsScores && draft ? (
                      <td className="px-3 py-3 text-center text-gray-700">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={scoreInputClass}
                          value={draft.performance}
                          onChange={(e) =>
                            patchScoreDraft(row.id, index, { performance: e.target.value })
                          }
                        />
                      </td>
                    ) : (
                      <td className="px-3 py-3 text-center text-gray-700">
                        {(activity.performancePercent ?? '–')}
                      </td>
                    )}
                    {isRest ? (
                      <td className="px-3 py-3 text-center text-gray-400">–</td>
                    ) : managerEditsScores && draft ? (
                      <td className="px-3 py-3 text-center text-gray-700">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={scoreInputClass}
                          value={draft.fieldDuty}
                          onChange={(e) =>
                            patchScoreDraft(row.id, index, { fieldDuty: e.target.value })
                          }
                        />
                      </td>
                    ) : (
                      <td className="px-3 py-3 text-center text-gray-700">
                        {(activity.fieldDutyPercent ?? '–')}
                      </td>
                    )}
                    {isRest ? (
                      <td className="px-3 py-3 text-center text-gray-400">–</td>
                    ) : managerEditsScores && draft ? (
                      <td className="px-3 py-3 text-center text-gray-700">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className={scoreInputClass}
                          value={draft.notWorking}
                          onChange={(e) =>
                            patchScoreDraft(row.id, index, { notWorking: e.target.value })
                          }
                        />
                      </td>
                    ) : (
                      <td className="px-3 py-3 text-center text-gray-700">
                        {(activity.notWorkingPercent ?? '–')}
                      </td>
                    )}
                    <td className="px-3 py-3 text-center text-gray-700 border-l border-gray-100">
                      {isRest ? (
                        <span className="text-gray-300">–</span>
                      ) : finalShown ? (
                        <span className="font-semibold text-green-700">{finalShown}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600 align-top border-l border-gray-100 max-w-[14rem]">
                      <div className="text-xs text-left space-y-1.5">
                        {showNotWorkingKet && (
                          <p className="text-amber-900 font-medium leading-snug">
                            TIDAK MASUK KERJA ATAU SECARA NYATA TIDAK MELAKSANAN TUGAS
                          </p>
                        )}
                        {activity.notes?.trim() ? (
                          <p className="whitespace-pre-wrap text-gray-700">{activity.notes}</p>
                        ) : null}
                        {!showNotWorkingKet && !activity.notes?.trim() && !isRest && (
                          <span className="text-gray-300">–</span>
                        )}
                        {isRest && !activity.notes?.trim() && (
                          <span className="text-gray-300">–</span>
                        )}
                      </div>
                    </td>
                    {index === 0 && (canEdit || canEvaluate) && (
                      <td rowSpan={rowCount} className="px-3 py-3 align-middle border-l border-gray-100 print:hidden">
                        <RowActionButtons
                          canEdit={canEdit}
                          canEvaluate={canShowEvaluateStar}
                          evaluateDisabled={evaluateDisabled}
                          onEdit={() => setEditingRow(row)}
                          onDelete={() => setDeletingRow(row)}
                          onEvaluate={() => void handleEvaluateClick(row)}
                        />
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 print:hidden">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + Tambah Baris
          </Button>
        </div>
      )}

      <LapkinSignatureFooter lapkin={lapkin} />

      <RowFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddRow}
        isLoading={isLoading}
      />
      <RowFormModal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        onSubmit={handleUpdateRow}
        editingRow={editingRow}
        isLoading={isLoading}
      />
      <ConfirmDialog
        isOpen={!!deletingRow}
        onClose={() => setDeletingRow(null)}
        onConfirm={handleDeleteRow}
        title="Hapus Baris"
        message={`Apakah Anda yakin ingin menghapus baris ${deletingRow?.lineNumber}?`}
        confirmLabel="Hapus"
        isLoading={isLoading}
      />
      <EvaluateRowModal
        isOpen={!!evaluatingRow}
        onClose={() => setEvaluatingRow(null)}
        onSubmit={handleEvaluateRow}
        row={evaluatingRow}
        isLoading={isLoading}
      />
    </div>
  );
};
