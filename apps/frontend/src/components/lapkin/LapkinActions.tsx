import { useState } from 'react';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { Lapkin } from '../../types';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useNavigate } from 'react-router-dom';

interface LapkinActionsProps {
  lapkin: Lapkin;
}

export const LapkinActions = ({ lapkin }: LapkinActionsProps) => {
  const { user } = useAuthStore();
  const { lockLapkin, unlockLapkin, deleteLapkin } = useLapkinStore();
  const { isLoading, run } = useAsyncAction();
  const navigate = useNavigate();

  const [confirmAction, setConfirmAction] = useState<'lock' | 'unlock' | 'delete' | null>(null);

  if (!user) return null;
  const isEmployeeOwner =
    lapkin.employeeId === user.id &&
    (user.role === 'pegawai' || user.role === 'manager');
  if (!isEmployeeOwner) return null;

  const handleConfirm = async () => {
    if (confirmAction === 'lock') {
      await run(() => lockLapkin(lapkin.id), { successToast: 'LAPKIN berhasil dikunci' });
    } else if (confirmAction === 'unlock') {
      await run(() => unlockLapkin(lapkin.id), { successToast: 'LAPKIN berhasil dibuka' });
    } else if (confirmAction === 'delete') {
      const result = await run(() => deleteLapkin(lapkin.id), { successToast: 'LAPKIN berhasil dihapus' });
      if (result !== null) {
        navigate(user.role === 'manager' ? '/manager/lapkin/saya' : '/pegawai/lapkin');
      }
    }
    setConfirmAction(null);
  };

  const confirmConfig = {
    lock: {
      title: 'Kunci LAPKIN',
      message:
        'LAPKIN akan dikunci dan siap dievaluasi oleh manajer. Anda tidak dapat mengubah isi hingga LAPKIN dibuka kembali.',
      label: 'Kunci',
      variant: 'primary' as const,
    },
    unlock: {
      title: 'Buka LAPKIN',
      message: 'LAPKIN akan dikembalikan ke status draf dan dapat diubah kembali.',
      label: 'Buka',
      variant: 'primary' as const,
    },
    delete: {
      title: 'Hapus LAPKIN',
      message:
        lapkin.status === 'evaluated'
          ? 'LAPKIN ini sudah selesai dievaluasi. Menghapusnya akan menghilangkan data secara permanen, termasuk evaluasi dan semua baris. Tindakan ini tidak dapat dibatalkan.'
          : 'LAPKIN ini akan dihapus permanen beserta semua barisnya. Tindakan ini tidak dapat dibatalkan.',
      label: 'Hapus',
      variant: 'danger' as const,
    },
  };

  const active = confirmAction ? confirmConfig[confirmAction] : null;
  const hasRows = lapkin.rows.length > 0;
  const canDeleteLapkin =
    lapkin.status === 'draft' || lapkin.status === 'locked' || lapkin.status === 'evaluated';

  return (
    <>
      <div className="flex items-center gap-2">
        {lapkin.status === 'draft' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmAction('lock')}
            disabled={!hasRows}
            isLoading={isLoading}
          >
            <Lock className="w-4 h-4" />
            Kunci untuk Evaluasi
          </Button>
        )}
        {lapkin.status === 'locked' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirmAction('unlock')}
            isLoading={isLoading}
          >
            <Unlock className="w-4 h-4" />
            Buka Kunci
          </Button>
        )}
        {canDeleteLapkin && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmAction('delete')}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </Button>
        )}
      </div>

      {active && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={active.title}
          message={active.message}
          confirmLabel={active.label}
          isLoading={isLoading}
          variant={active.variant}
        />
      )}
    </>
  );
};
