import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useLapkinStore } from '../../stores/lapkin.store';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </Card>
);

export const ManagerDashboard = () => {
  const { user } = useAuthStore();
  const { lapkins, fetchAll, isLoading } = useLapkinStore();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = {
    total: lapkins.length,
    locked: lapkins.filter((l) => l.status === 'locked').length,
    evaluated: lapkins.filter((l) => l.status === 'evaluated').length,
  };

  const pendingEvaluation = lapkins.filter((l) => l.status === 'locked');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Selamat datang, ${user?.name?.split(' ')[0]}!`}
        subtitle="Pantau dan evaluasi laporan kinerja bawahan Anda"
        action={<Button onClick={() => navigate('/manager/lapkin')}>Lihat Semua LAPKIN</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total LAPKIN" value={stats.total} color="bg-blue-100" icon={<FileText className="w-6 h-6 text-blue-600" />} />
            <StatCard label="Menunggu Evaluasi" value={stats.locked} color="bg-yellow-100" icon={<Users className="w-6 h-6 text-yellow-600" />} />
            <StatCard label="Sudah Dievaluasi" value={stats.evaluated} color="bg-green-100" icon={<CheckCircle className="w-6 h-6 text-green-600" />} />
          </div>

          {pendingEvaluation.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Menunggu Evaluasi ({pendingEvaluation.length})
              </h3>
              <div className="space-y-2">
                {pendingEvaluation.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    onClick={() => navigate(`/manager/lapkin/${l.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{l.employeeName}</p>
                      <p className="text-xs text-gray-500">{l.reportDate}</p>
                    </div>
                    <span className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full">
                      Evaluasi Sekarang
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
