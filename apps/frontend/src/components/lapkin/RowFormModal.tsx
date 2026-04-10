import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { LapkinRow, CreateLapkinRowPayload } from '../../types';

interface RowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLapkinRowPayload) => Promise<void>;
  editingRow?: LapkinRow | null;
  isLoading: boolean;
}

const emptyForm = (): CreateLapkinRowPayload => ({
  waktuMulai: '',
  waktuSelesai: '',
  uraianTugas: '',
  uraianHasil: '',
  hasilKinerja: null,
  tugasDinasLuar: null,
  ket: '',
});

const rowToForm = (row: LapkinRow): CreateLapkinRowPayload => ({
  waktuMulai: row.waktuMulai,
  waktuSelesai: row.waktuSelesai,
  uraianTugas: row.uraianTugas,
  uraianHasil: row.uraianHasil,
  hasilKinerja: row.hasilKinerja ? parseFloat(row.hasilKinerja) : null,
  tugasDinasLuar: row.tugasDinasLuar ? parseFloat(row.tugasDinasLuar) : null,
  ket: row.ket ?? '',
});

export const RowFormModal = ({ isOpen, onClose, onSubmit, editingRow, isLoading }: RowFormModalProps) => {
  const [form, setForm] = useState<CreateLapkinRowPayload>(emptyForm());

  useEffect(() => {
    setForm(editingRow ? rowToForm(editingRow) : emptyForm());
  }, [editingRow, isOpen]);

  const setField = <K extends keyof CreateLapkinRowPayload>(key: K, value: CreateLapkinRowPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.waktuMulai || !form.waktuSelesai || !form.uraianTugas || !form.uraianHasil) return;
    await onSubmit(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRow ? 'Edit Baris' : 'Tambah Baris'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Waktu Mulai"
            type="time"
            value={form.waktuMulai}
            onChange={(e) => setField('waktuMulai', e.target.value)}
          />
          <Input
            label="Waktu Selesai"
            type="time"
            value={form.waktuSelesai}
            onChange={(e) => setField('waktuSelesai', e.target.value)}
          />
        </div>

        <Textarea
          label="Uraian Tugas Jabatan / Kinerja Proses Bulanan"
          value={form.uraianTugas}
          onChange={(e) => setField('uraianTugas', e.target.value)}
          rows={3}
          placeholder="Tuliskan uraian tugas..."
        />

        <Textarea
          label="Uraian Hasil"
          value={form.uraianHasil}
          onChange={(e) => setField('uraianHasil', e.target.value)}
          rows={3}
          placeholder="Tuliskan uraian hasil pelaksanaan..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hasil Kinerja (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={form.hasilKinerja ?? ''}
            onChange={(e) => setField('hasilKinerja', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0-100"
          />
          <Input
            label="Tugas Dinas Luar (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={form.tugasDinasLuar ?? ''}
            onChange={(e) => setField('tugasDinasLuar', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0-100"
          />
        </div>

        <Input
          label="Keterangan (Opsional)"
          value={form.ket ?? ''}
          onChange={(e) => setField('ket', e.target.value)}
          placeholder="Keterangan tambahan..."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {editingRow ? 'Simpan Perubahan' : 'Tambah Baris'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
