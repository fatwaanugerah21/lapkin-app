import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLapkinStore } from '../../stores/lapkin.store';
import { LapkinHeader } from '../../components/lapkin/LapkinHeader';
import { LapkinTable } from '../../components/lapkin/LapkinTable';
import { LapkinActions } from '../../components/lapkin/LapkinActions';
import { StatusBadge, SignedByManagerBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { WorkflowHint } from '../../components/layout/WorkflowHint';

export const EmployeeLapkinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { activeLapkin, fetchOne } = useLapkinStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchOne(id);
  }, [id, fetchOne]);

  if (!activeLapkin || activeLapkin.id !== id) return <PageSpinner />;

  return (
    <div className="p-4 space-y-3">
      <WorkflowHint variant="pegawai" />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => navigate('/pegawai/lapkin')}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <StatusBadge status={activeLapkin.status} />
          <SignedByManagerBadge isSigned={activeLapkin.isSignedByManager === true} />
          <LapkinActions lapkin={activeLapkin} />
        </div>
      </div>

      <LapkinHeader lapkin={activeLapkin} />
      <LapkinTable lapkin={activeLapkin} />
    </div>
  );
};
