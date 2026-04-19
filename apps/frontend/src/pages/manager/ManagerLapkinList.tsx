import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLapkinStore } from '../../stores/lapkin.store';
import { LapkinCard } from '../../components/lapkin/LapkinCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { clsx } from 'clsx';

type FilterStatus = 'all' | 'locked' | 'evaluated';

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'locked', label: 'Menunggu Evaluasi' },
  { value: 'evaluated', label: 'Sudah Dievaluasi' },
];

export const ManagerLapkinList = () => {
  const { lapkins, fetchAll, isLoading } = useLapkinStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>('all');

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = filter === 'all' ? lapkins : lapkins.filter((l) => l.status === filter);

  return (
    <div className="p-6">
      <PageHeader
        title="LAPKIN Bawahan"
        subtitle="Laporan kinerja seluruh pegawai di bawah Anda"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === opt.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400',
            )}
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({lapkins.filter((l) => l.status === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada LAPKIN"
          description="Belum ada laporan kinerja yang sesuai dengan filter ini."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((lapkin) => (
            <LapkinCard
              key={lapkin.id}
              lapkin={lapkin}
              onView={(l) => navigate(`/manager/lapkin/${l.id}`)}
              showPegawai
            />
          ))}
        </div>
      )}
    </div>
  );
};
