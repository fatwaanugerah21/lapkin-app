import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { LapkinCard } from '../../components/lapkin/LapkinCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import type { Lapkin } from '../../types';
import { WorkflowHint } from '../../components/layout/WorkflowHint';

export const ManagerMyLapkinList = () => {
  const { user } = useAuthStore();
  const { lapkins, fetchAll, createLapkin, isLoading } = useLapkinStore();
  const { isLoading: isCreating, run } = useAsyncAction();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportDate, setReportDate] = useState('');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const myLapkins = useMemo(() => {
    if (!user?.id) return [];
    return lapkins.filter((l) => l.employeeId === user.id);
  }, [lapkins, user?.id]);

  const handleCreate = async () => {
    if (!reportDate) return;
    const lapkin = await run(() => createLapkin(reportDate), 'LAPKIN berhasil dibuat');
    if (lapkin) {
      setShowCreateModal(false);
      navigate(`/manager/lapkin/${(lapkin as Lapkin).id}`, {
        state: { managerListBackPath: '/manager/lapkin/saya' },
      });
    }
  };

  return (
    <div className="p-4">
      <PageHeader
        title="LAPKIN Saya"
        subtitle="Laporan kinerja Anda sebagai manajer — sama seperti pegawai: isi draf, kunci untuk ditinjau atasan (direktur)"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Buat LAPKIN Baru
          </Button>
        }
      />

      <WorkflowHint variant="pegawai" className="mb-3" />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : myLapkins.length === 0 ? (
        <EmptyState
          title="Belum ada LAPKIN"
          description="Buat LAPKIN pertama dengan tombol Buat LAPKIN Baru di atas."
          action={
            <Button onClick={() => setShowCreateModal(true)}>Buat LAPKIN Baru</Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {myLapkins.map((lapkin) => (
            <LapkinCard
              key={lapkin.id}
              lapkin={lapkin}
              onView={(l) =>
                navigate(`/manager/lapkin/${l.id}`, {
                  state: { managerListBackPath: '/manager/lapkin/saya' },
                })
              }
            />
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat LAPKIN Baru" size="sm">
        <div className="space-y-4">
          <Input
            label="Tanggal"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Batal</Button>
            <Button onClick={handleCreate} isLoading={isCreating} disabled={!reportDate}>Buat</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
