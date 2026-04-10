import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LapkinRow } from '../../types';

interface EvaluateRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nilaiAkhir: number) => Promise<void>;
  row: LapkinRow | null;
  isLoading: boolean;
}

export const EvaluateRowModal = ({ isOpen, onClose, onSubmit, row, isLoading }: EvaluateRowModalProps) => {
  const [nilaiAkhir, setNilaiAkhir] = useState('');

  useEffect(() => {
    setNilaiAkhir(row?.nilaiAkhir ?? '');
  }, [row, isOpen]);

  const handleSubmit = async () => {
    const value = parseFloat(nilaiAkhir);
    if (isNaN(value) || value < 0 || value > 100) return;
    await onSubmit(value);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evaluasi Baris" size="sm">
      {row && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500 text-xs mb-1">Uraian Tugas</p>
            <p className="text-gray-800 font-medium">{row.uraianTugas}</p>
            <p className="text-gray-500 text-xs mt-2 mb-1">Waktu</p>
            <p className="text-gray-700">{row.waktuMulai} – {row.waktuSelesai}</p>
          </div>

          <Input
            label="Nilai Akhir (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={nilaiAkhir}
            onChange={(e) => setNilaiAkhir(e.target.value)}
            placeholder="0 - 100"
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button variant="success" onClick={handleSubmit} isLoading={isLoading}>Simpan Nilai</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
