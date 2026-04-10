import { useState } from 'react';
import { Pencil, Trash2, Star } from 'lucide-react';
import { Lapkin, LapkinRow } from '../../types';
import { Button } from '../ui/Button';
import { RowFormModal } from './RowFormModal';
import { EvaluateRowModal } from './EvaluateRowModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { CreateLapkinRowPayload } from '../../types';

interface LapkinTableProps {
  lapkin: Lapkin;
}

export const LapkinTable = ({ lapkin }: LapkinTableProps) => {
  const { user } = useAuthStore();
  const { addRow, updateRow, deleteRow, evaluateRow } = useLapkinStore();
  const { isLoading, run } = useAsyncAction();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRow, setEditingRow] = useState<LapkinRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<LapkinRow | null>(null);
  const [evaluatingRow, setEvaluatingRow] = useState<LapkinRow | null>(null);

  const isPegawaiOwner = user?.role === 'pegawai' && lapkin.pegawaiId === user.id;
  const isManager = user?.role === 'manager';
  const isDraft = lapkin.status === 'draft';
  const isLocked = lapkin.status === 'locked';

  const canEdit = isPegawaiOwner && isDraft;
  const canEvaluate = isManager && isLocked;

  const handleAddRow = async (payload: CreateLapkinRowPayload) => {
    await run(() => addRow(lapkin.id, payload), 'Baris berhasil ditambahkan');
  };

  const handleUpdateRow = async (payload: CreateLapkinRowPayload) => {
    if (!editingRow) return;
    await run(() => updateRow(lapkin.id, editingRow.id, payload), 'Baris berhasil diperbarui');
  };

  const handleDeleteRow = async () => {
    if (!deletingRow) return;
    await run(() => deleteRow(lapkin.id, deletingRow.id), 'Baris berhasil dihapus');
    setDeletingRow(null);
  };

  const handleEvaluateRow = async (nilaiAkhir: number) => {
    if (!evaluatingRow) return;
    await run(() => evaluateRow(lapkin.id, evaluatingRow.id, nilaiAkhir), 'Nilai berhasil disimpan');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-700 text-white">
              <th className="px-3 py-3 text-center font-semibold w-10">NO</th>
              <th className="px-3 py-3 text-center font-semibold w-28">WAKTU</th>
              <th className="px-3 py-3 text-left font-semibold">URAIAN TUGAS JABATAN /<br />KINERJA PROSES BULANAN</th>
              <th className="px-3 py-3 text-left font-semibold">URAIAN HASIL</th>
              <th className="px-3 py-3 text-center font-semibold w-20">HASIL<br />KINERJA (%)</th>
              <th className="px-3 py-3 text-center font-semibold w-20">TUGAS<br />DINAS LUAR (%)</th>
              <th className="px-3 py-3 text-center font-semibold w-24">NILAI<br />AKHIR (%)</th>
              <th className="px-3 py-3 text-center font-semibold w-20">KET</th>
              {(canEdit || canEvaluate) && (
                <th className="px-3 py-3 text-center font-semibold w-24">AKSI</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lapkin.rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400">
                  Belum ada baris. {canEdit && 'Klik "Tambah Baris" untuk mulai.'}
                </td>
              </tr>
            )}
            {lapkin.rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 text-center font-medium text-gray-500">{row.no}</td>
                <td className="px-3 py-3 text-center text-gray-700 whitespace-nowrap">
                  {row.waktuMulai} – {row.waktuSelesai}
                </td>
                <td className="px-3 py-3 text-gray-800 max-w-xs">{row.uraianTugas}</td>
                <td className="px-3 py-3 text-gray-800 max-w-xs">{row.uraianHasil}</td>
                <td className="px-3 py-3 text-center text-gray-700">{row.hasilKinerja ?? '-'}</td>
                <td className="px-3 py-3 text-center text-gray-700">{row.tugasDinasLuar ?? '-'}</td>
                <td className="px-3 py-3 text-center">
                  {row.nilaiAkhir ? (
                    <span className="font-semibold text-green-700">{row.nilaiAkhir}</span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center text-gray-600 text-xs">{row.ket || '-'}</td>
                {(canEdit || canEvaluate) && (
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => setEditingRow(row)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingRow(row)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {canEvaluate && (
                        <button
                          onClick={() => setEvaluatingRow(row)}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                          title="Beri Nilai"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row button for pegawai in draft */}
      {canEdit && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + Tambah Baris
          </Button>
        </div>
      )}

      {/* Signature footer */}
      <div className="px-6 py-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-sm">
        <div className="text-center">
          <p className="font-medium text-gray-700 mb-12">PEJABAT PENILAI,</p>
          <p className="font-semibold text-gray-900">{lapkin.managerName ?? '_______________'}</p>
          {lapkin.managerJabatan && <p className="text-gray-500 text-xs mt-0.5">{lapkin.managerJabatan}</p>}
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700 mb-12">YANG MEMBUAT LAPORAN,</p>
          <p className="font-semibold text-gray-900">{lapkin.pegawaiName}</p>
          <p className="text-gray-500 text-xs mt-0.5">NIP. {lapkin.pegawaiNip}</p>
        </div>
      </div>

      {/* Modals */}
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
        message={`Apakah Anda yakin ingin menghapus baris ${deletingRow?.no}?`}
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
