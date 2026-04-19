import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  LapkinRow,
  CreateLapkinRowPayload,
  LapkinRowActivityInput,
  LAPKIN_REST_ACTIVITY_LABEL,
} from '../../types';

interface RowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLapkinRowPayload) => Promise<void>;
  editingRow?: LapkinRow | null;
  isLoading: boolean;
}

type SlotMode = 'tasks' | 'rest';

const emptyActivity = (): LapkinRowActivityInput => ({
  taskDescription: '',
  resultDescription: '',
  performancePercent: null,
  fieldDutyPercent: null,
  finalScore: null,
  notWorkingPercent: null,
  isRest: false,
  notes: '',
});

const restOnlyActivity = (): LapkinRowActivityInput => ({
  taskDescription: LAPKIN_REST_ACTIVITY_LABEL,
  resultDescription: LAPKIN_REST_ACTIVITY_LABEL,
  performancePercent: null,
  fieldDutyPercent: null,
  finalScore: null,
  notWorkingPercent: null,
  isRest: true,
  notes: '',
});

const emptyForm = (): CreateLapkinRowPayload => ({
  startTime: '',
  endTime: '',
  activities: [emptyActivity()],
});

const parseOptionalPercent = (value: string | null | undefined): number | null => {
  if (value == null || value === '') return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const rowToForm = (row: LapkinRow): CreateLapkinRowPayload => ({
  startTime: row.startTime,
  endTime: row.endTime,
  activities:
    row.activities && row.activities.length > 0
      ? row.activities.map((a) => ({
        taskDescription: a.taskDescription,
        resultDescription: a.resultDescription,
        performancePercent: parseOptionalPercent(a.performancePercent),
        fieldDutyPercent: parseOptionalPercent(a.fieldDutyPercent),
        finalScore: parseOptionalPercent(a.finalScore),
        notWorkingPercent: parseOptionalPercent(a.notWorkingPercent),
        isRest: a.isRest === true,
        notes: a.notes ?? '',
      }))
      : [emptyActivity()],
});

function editingInitialState(row: LapkinRow): { form: CreateLapkinRowPayload; mode: SlotMode } {
  const full = rowToForm(row);
  const allRest =
    full.activities.length > 0 && full.activities.every((a) => a.isRest === true);
  if (allRest) {
    return { mode: 'rest', form: { ...full, activities: [restOnlyActivity()] } };
  }
  const workOnly = full.activities.filter((a) => !a.isRest);
  return {
    mode: 'tasks',
    form: {
      ...full,
      activities: workOnly.length > 0 ? workOnly : [emptyActivity()],
    },
  };
}

export const RowFormModal = ({ isOpen, onClose, onSubmit, editingRow, isLoading }: RowFormModalProps) => {
  const [form, setForm] = useState<CreateLapkinRowPayload>(emptyForm());
  const [slotMode, setSlotMode] = useState<SlotMode>('tasks');

  useEffect(() => {
    if (editingRow) {
      const { form: nextForm, mode } = editingInitialState(editingRow);
      setForm(nextForm);
      setSlotMode(mode);
    } else {
      setForm(emptyForm());
      setSlotMode('tasks');
    }
  }, [editingRow, isOpen]);

  const setActivityField = (
    index: number,
    key: keyof LapkinRowActivityInput,
    value: LapkinRowActivityInput[keyof LapkinRowActivityInput],
  ) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addActivity = () =>
    setForm((prev) => ({ ...prev, activities: [...prev.activities, emptyActivity()] }));

  const removeActivity = (index: number) =>
    setForm((prev) => {
      if (prev.activities.length <= 1) return prev;
      return { ...prev, activities: prev.activities.filter((_, i) => i !== index) };
    });

  const handleSlotMode = (mode: SlotMode) => {
    if (mode === slotMode) return;
    setSlotMode(mode);
    if (mode === 'rest') {
      setForm((prev) => ({ ...prev, activities: [restOnlyActivity()] }));
    } else {
      setForm((prev) => ({ ...prev, activities: [emptyActivity()] }));
    }
  };

  const isFormValid = () =>
    !!form.startTime &&
    !!form.endTime &&
    form.activities.length > 0 &&
    form.activities.every(
      (a) => a.isRest === true || (a.taskDescription.trim() && a.resultDescription.trim()),
    );

  const canAddMoreActivities = !!form.startTime && !!form.endTime;

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    await onSubmit(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingRow ? 'Ubah Baris' : 'Tambah Baris'} size="lg">
      <div className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rentang waktu</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Waktu Mulai"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
            />
            <Input
              label="Waktu Selesai"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
            />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Isi rentang waktu ini dengan apa?</p>
            <p className="text-xs text-gray-500 mt-1">
              Pilih salah satu: beberapa baris tugas, atau satu blok istirahat untuk seluruh rentang waktu.
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200"
            role="group"
            aria-label="Jenis isi rentang waktu"
          >
            <button
              type="button"
              onClick={() => handleSlotMode('tasks')}
              className={clsx(
                'rounded-lg py-2.5 px-2 text-sm font-medium transition-all text-center',
                slotMode === 'tasks'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              Beberapa kegiatan
            </button>
            <button
              type="button"
              onClick={() => handleSlotMode('rest')}
              className={clsx(
                'rounded-lg py-2.5 px-2 text-sm font-medium transition-all text-center',
                slotMode === 'rest'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              Hanya istirahat
            </button>
          </div>

          {slotMode === 'rest' ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/90 p-5 text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {LAPKIN_REST_ACTIVITY_LABEL}
              </p>
              <p className="text-sm text-slate-700">
                Baris ini hanya mencatat istirahat untuk waktu mulai dan selesai yang dipilih. Tidak ada baris
                tugas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {form.activities.map((activity, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
                    <span className="text-xs font-semibold text-gray-600 tracking-wide">
                      Kegiatan {index + 1}
                    </span>
                    {form.activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Hapus kegiatan"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <Input
                      label="Uraian Tugas Jabatan / Kinerja Proses Bulanan"
                      value={activity.taskDescription}
                      onChange={(e) => setActivityField(index, 'taskDescription', e.target.value)}
                      placeholder="Tuliskan uraian tugas..."
                    />
                    <Input
                      label="Uraian Hasil"
                      value={activity.resultDescription}
                      onChange={(e) => setActivityField(index, 'resultDescription', e.target.value)}
                      placeholder="Tuliskan uraian hasil..."
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addActivity}
                isLoading={isLoading}
                disabled={!canAddMoreActivities}
                className="w-full sm:w-auto"
                title={!canAddMoreActivities ? 'Isi waktu mulai dan selesai terlebih dahulu' : undefined}
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah kegiatan
              </Button>
            </div>
          )}
        </section>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSubmit} isLoading={isLoading} disabled={!isFormValid()}>
            {editingRow ? 'Simpan Perubahan' : 'Tambah Baris'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
