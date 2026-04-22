import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Lock } from 'lucide-react';
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
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </Card>
);

export const EmplyeeDashboard = () => {
  const { user } = useAuthStore();
  const { lapkins, fetchAll, isLoading } = useLapkinStore();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const stats = {
    total: lapkins.length,
    draft: lapkins.filter((l) => l.status === 'draft').length,
    locked: lapkins.filter((l) => l.status === 'locked').length,
    evaluated: lapkins.filter((l) => l.status === 'evaluated').length,
  };

  return (
    <div className="p-4">
      <PageHeader
        title={`Selamat datang, ${user?.name?.split(' ')[0]}!`}
        subtitle="Kelola laporan kinerja harian Anda"
        action={<Button onClick={() => navigate('/pegawai/lapkin')}>Lihat Semua LAPKIN</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total LAPKIN" value={stats.total} color="bg-blue-100" icon={<FileText className="w-5 h-5 text-blue-600" />} />
          <StatCard label="Draf" value={stats.draft} color="bg-gray-100" icon={<Clock className="w-5 h-5 text-gray-600" />} />
          <StatCard label="Menunggu Evaluasi" value={stats.locked} color="bg-yellow-100" icon={<Lock className="w-5 h-5 text-yellow-600" />} />
          <StatCard label="Sudah Dievaluasi" value={stats.evaluated} color="bg-green-100" icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
        </div>
      )}
    </div>
  );
};
