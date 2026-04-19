import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLapkinStore } from '../../stores/lapkin.store';
import { LapkinHeader } from '../../components/lapkin/LapkinHeader';
import { LapkinTable } from '../../components/lapkin/LapkinTable';
import { StatusBadge, SignedByManagerBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';

export const ManagerLapkinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { activeLapkin, fetchOne } = useLapkinStore();
  const navigate = useNavigate();

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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/manager/lapkin')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge status={activeLapkin.status} />
          <SignedByManagerBadge isSigned={activeLapkin.isSignedByManager === true} />
        </div>
      </div>

      <LapkinHeader lapkin={activeLapkin} />

      {/* Evaluation progress */}
      {activeLapkin.status === 'locked' && totalRows > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Progres evaluasi</p>
            <p className="text-sm text-gray-500">{evaluatedCount} / {totalRows} baris</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${totalRows > 0 ? (evaluatedCount / totalRows) * 100 : 0}%` }}
            />
          </div>
          {evaluatedCount < totalRows && (
            <p className="text-xs text-yellow-700 mt-2">
              Klik ikon ⭐ pada baris untuk menandai baris sudah ditinjau (nilai akhir diisi pegawai per kegiatan).
            </p>
          )}
        </Card>
      )}

      <LapkinTable lapkin={activeLapkin} />
    </div>
  );
};
