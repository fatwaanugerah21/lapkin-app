import { useState, useEffect } from 'react';
import { Lapkin, CreateLapkinRowPayload, LapkinRow } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { RowFormModal } from './RowFormModal';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { LapkinSignatureFooter } from './LapkinSignatureFooter';
import { LapkinTableRows } from './LapkinTableRows';
import { useLapkinManagerRowScores } from './useLapkinManagerRowScores';
import { lapkinAllEvaluableRowsDraftsComplete, ScoreDraft } from './lapkinTableScoreUtils';

interface LapkinTableProps {
  lapkin: Lapkin;
  onManagerScoreDraftsChange?: (drafts: Record<string, ScoreDraft[]>) => void;
}

export const LapkinTable = ({ lapkin, onManagerScoreDraftsChange }: LapkinTableProps) => {
  const { user } = useAuthStore();
  const { addRow, updateRow, deleteRow } = useLapkinStore();
  const { isLoading, run } = useAsyncAction();
  const { scoreDraftsByRow, patchScoreDraft, persistAllEvaluableRows } = useLapkinManagerRowScores(lapkin);

  const [showRowModal, setShowRowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<LapkinRow | null>(null);
  const [rowPendingDelete, setRowPendingDelete] = useState<LapkinRow | null>(null);
  const [isReevaluating, setIsReevaluating] = useState(false);

  useEffect(() => {
    onManagerScoreDraftsChange?.(scoreDraftsByRow);
  }, [scoreDraftsByRow, onManagerScoreDraftsChange]);

  const isEmployeeOwner =
    lapkin.employeeId === user?.id && (user?.role === 'pegawai' || user?.role === 'manager');
  const isDraft = lapkin.status === 'draft';
  const isEvaluated = lapkin.status === 'evaluated';
  const isLockedOrEvaluated = lapkin.status === 'locked' || lapkin.status === 'evaluated';

  const canEdit = isEmployeeOwner && isDraft;
  const canEvaluateAsManager =
    user?.role === 'manager' && isLockedOrEvaluated && lapkin.managerId === user.id;
  const canEvaluateAsDirektur =
    user?.role === 'direktur' &&
    isLockedOrEvaluated &&
    lapkin.employeeRole === 'manager' &&
    lapkin.managerId === user.id;
  const canEvaluate = canEvaluateAsManager || canEvaluateAsDirektur;
  const canEditEvaluationValues =
    canEvaluate && (lapkin.status === 'locked' || (isEvaluated && isReevaluating));
  const draftsReadyForSave = lapkinAllEvaluableRowsDraftsComplete(lapkin, scoreDraftsByRow);

  const managerScoreSignFlow =
    canEvaluate && lapkin.status === 'locked' && lapkin.isSignedByManager !== true
      ? {
        persistBeforeSign: persistAllEvaluableRows,
        draftsReadyForSign: draftsReadyForSave,
      }
      : undefined;

  useEffect(() => {
    if (!isEvaluated) {
      setIsReevaluating(false);
    }
  }, [isEvaluated, lapkin.id]);

  const showEvaluationColumns = !isDraft;
  const dataColumnCount = showEvaluationColumns ? 9 : 4;
  const emptyColSpan = dataColumnCount + (canEdit ? 1 : 0);

  const openAddRowModal = () => {
    setEditingRow(null);
    setShowRowModal(true);
  };

  const handleEditRow = (row: LapkinRow) => {
    setEditingRow(row);
    setShowRowModal(true);
  };

  const closeRowModal = () => {
    setShowRowModal(false);
    setEditingRow(null);
  };

  const handleRowSubmit = async (payload: CreateLapkinRowPayload) => {
    const result = editingRow
      ? await run(() => updateRow(lapkin.id, editingRow.id, payload), {
        successToast: 'Baris berhasil diperbarui',
      })
      : await run(() => addRow(lapkin.id, payload), { successToast: 'Baris berhasil ditambahkan' });
    if (result === null) throw new Error('Row save failed');
  };

  const confirmDeleteRow = async () => {
    if (!rowPendingDelete) return;
    const id = rowPendingDelete.id;
    await run(() => deleteRow(lapkin.id, id), { successToast: 'Baris berhasil dihapus' });
    setRowPendingDelete(null);
  };

  const saveNewEvaluation = async () => {
    await run(
      async () => {
        await persistAllEvaluableRows();
        setIsReevaluating(false);
      },
      { successToast: 'Penilaian baru berhasil disimpan' },
    );
  };

  return (
    <div className="lapkin-print-table bg-white border border-gray-200 rounded-lg overflow-hidden print:rounded-lg print:shadow-none">
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-primary-700 text-white text-[11px] sm:text-xs">
              <th className="px-2 py-2 text-center font-semibold w-10">NO</th>
              <th className="px-2 py-2 text-center font-semibold w-28">WAKTU</th>
              <th className="px-2 py-2 text-left font-semibold">URAIAN TUGAS JABATAN / KINERJA PROSES BULANAN</th>
              <th className="px-2 py-2 text-left font-semibold">URAIAN HASIL</th>
              {showEvaluationColumns && (
                <>
                  <th className="px-2 py-2 text-center font-semibold min-w-[5.5rem] w-24">HASIL KINERJA (%)</th>
                  <th className="px-2 py-2 text-center font-semibold min-w-[5.5rem] w-24">TUGAS DINAS LUAR (%)</th>
                  <th className="px-2 py-2 text-center font-semibold w-20">
                    TIDAK MASUK KERJA ATAU SECARA NYATA TIDAK MELAKSANAN TUGAS
                  </th>
                  <th className="px-2 py-2 text-center font-semibold min-w-[8.5rem] w-32">NILAI AKHIR (%)</th>
                  <th className="px-2 py-2 text-center font-semibold min-w-[15rem] w-[18rem] print:min-w-0 print:w-[1%] print:max-w-[12rem]">
                    KET
                  </th>
                </>
              )}
              {canEdit && (
                <th className="px-2 py-2 text-center font-semibold w-20 print:hidden">Aksi</th>
              )}
            </tr>
          </thead>
          <LapkinTableRows
            lapkin={lapkin}
            canEdit={canEdit}
            canEditEvaluationValues={canEditEvaluationValues}
            showEvaluationColumns={showEvaluationColumns}
            emptyColSpan={emptyColSpan}
            scoreDraftsByRow={scoreDraftsByRow}
            patchScoreDraft={patchScoreDraft}
            onEditRow={canEdit ? handleEditRow : undefined}
            onDeleteRow={canEdit ? setRowPendingDelete : undefined}
            rowActionsDisabled={isLoading}
          />
        </table>
      </div>

      {canEdit && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 print:hidden">
          <Button size="sm" onClick={openAddRowModal}>
            + Tambah Baris
          </Button>
        </div>
      )}
      {isEvaluated && canEvaluate && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 print:hidden">
          {!isReevaluating ? (
            <Button size="sm" onClick={() => setIsReevaluating(true)}>
              Nilai Ulang
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsReevaluating(false)} disabled={isLoading}>
                Batal
              </Button>
              <Button size="sm" onClick={saveNewEvaluation} isLoading={isLoading} disabled={!draftsReadyForSave}>
                Simpan Penilaian Baru
              </Button>
            </div>
          )}
        </div>
      )}

      <LapkinSignatureFooter lapkin={lapkin} managerScoreSign={managerScoreSignFlow} />

      <RowFormModal
        isOpen={showRowModal}
        onClose={closeRowModal}
        onSubmit={handleRowSubmit}
        editingRow={editingRow}
        isLoading={isLoading}
      />

      <ConfirmDialog
        isOpen={!!rowPendingDelete}
        onClose={() => setRowPendingDelete(null)}
        onConfirm={confirmDeleteRow}
        title="Hapus baris"
        message={
          rowPendingDelete
            ? `Hapus baris ke-${rowPendingDelete.lineNumber} (${rowPendingDelete.startTime} – ${rowPendingDelete.endTime})? Semua kegiatan pada baris ini akan ikut terhapus.`
            : ''
        }
        confirmLabel="Hapus"
        isLoading={isLoading}
        variant="danger"
      />
    </div>
  );
};
