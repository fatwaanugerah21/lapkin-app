import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LapkinRow } from '../../types';

interface EvaluateRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  row: LapkinRow | null;
  isLoading: boolean;
}

export const EvaluateRowModal = ({ isOpen, onClose, onSubmit, row, isLoading }: EvaluateRowModalProps) => {
  const activities = row?.activities ?? [];

  const handleSubmit = async () => {
    await onSubmit();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tinjau Baris" size="sm">
      {row && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
            <p className="text-gray-500 text-xs">Waktu</p>
            <p className="text-gray-700 font-medium">{row.startTime} – {row.endTime}</p>
            <p className="text-gray-500 text-xs pt-2">Kegiatan</p>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              {activities.length === 0 && <li className="text-gray-400">–</li>}
              {activities.map((a, i) => (
                <li key={i} className="text-sm">
                  {a.taskDescription || '–'}
                  {a.finalScore != null && (
                    <span className="text-gray-500 ml-1">(nilai akhir: {a.finalScore}%)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Tandai baris ini sudah ditinjau. Nilai akhir per kegiatan telah diisi oleh pegawai.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button variant="success" onClick={handleSubmit} isLoading={isLoading}>Tandai ditinjau</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
