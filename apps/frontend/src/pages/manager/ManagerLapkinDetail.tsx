import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLapkinStore } from '../../stores/lapkin.store';
import { useAuthStore } from '../../stores/auth.store';
import { LapkinHeader } from '../../components/lapkin/LapkinHeader';
import { LapkinTable } from '../../components/lapkin/LapkinTable';
import { LapkinActions } from '../../components/lapkin/LapkinActions';
import { StatusBadge, SignedByManagerBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { WorkflowHint } from '../../components/layout/WorkflowHint';

type DetailLocationState = { directorListBackPath?: string; managerListBackPath?: string };

export const ManagerLapkinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { activeLapkin, fetchOne } = useLapkinStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = useMemo(
    () => (user?.role === 'direktur' ? '/direktur' : '/manager'),
    [user?.role],
  );

  const backListPath = useMemo(() => {
    const state = location.state as DetailLocationState | null;
    if (user?.role === 'direktur' && state?.directorListBackPath) {
      return state.directorListBackPath;
    }
    if (user?.role === 'manager' && state?.managerListBackPath) {
      return state.managerListBackPath;
    }
    return `${basePath}/lapkin`;
  }, [user?.role, location.state, basePath]);

  useEffect(() => {
    if (id) fetchOne(id);
  }, [id, fetchOne]);

  if (!activeLapkin || activeLapkin.id !== id) return <PageSpinner />;

  const rowsForEvaluationProgress = activeLapkin.rows.filter((r) => {
    const activities = r.activities ?? [];
    return activities.length > 0 && activities.some((a) => a.isRest !== true);
  });
  const evaluatedCount = rowsForEvaluationProgress.filter((r) => r.managerAcknowledged).length;
  const totalRows = rowsForEvaluationProgress.length;

  const showSupervisorProgress =
    user?.role !== 'direktur' || activeLapkin.employeeRole === 'manager';

  return (
    <div className="p-4 space-y-3">
      <WorkflowHint variant="supervisor" />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => navigate(backListPath)}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke daftar
        </button>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <StatusBadge status={activeLapkin.status} />
          <SignedByManagerBadge isSigned={activeLapkin.isSignedByManager === true} />
          <LapkinActions lapkin={activeLapkin} />
        </div>
      </div>

      <LapkinHeader lapkin={activeLapkin} />

      {user?.role === 'direktur' && activeLapkin.employeeRole === 'pegawai' && (
        <p className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          LAPKIN pegawai ini dinilai oleh manajer langsungnya. Anda dapat membaca ringkasan; paraf penilai hanya untuk LAPKIN yang pemiliknya berperan sebagai manajer.
        </p>
      )}

      {/* Evaluation progress */}
      {showSupervisorProgress && activeLapkin.status === 'locked' && totalRows > 0 && (
        <Card padding={false} className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-gray-700">Progres evaluasi</p>
            <p className="text-xs text-gray-500 tabular-nums">{evaluatedCount} / {totalRows} baris</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${totalRows > 0 ? (evaluatedCount / totalRows) * 100 : 0}%` }}
            />
          </div>
          {evaluatedCount < totalRows && user?.role !== 'direktur' && (
            <p className="text-[11px] text-yellow-800 mt-1.5 leading-snug">
              Klik ikon bintang pada baris setelah kolom persentase terisi, untuk menandai baris sudah ditinjau.
            </p>
          )}
        </Card>
      )}

      <LapkinTable lapkin={activeLapkin} />
    </div>
  );
};
