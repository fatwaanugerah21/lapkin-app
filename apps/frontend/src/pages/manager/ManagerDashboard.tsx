import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useLapkinStore } from '../../stores/lapkin.store';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import type { Lapkin } from '../../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  detail?: string;
}

const StatCard = ({ label, value, icon, color, detail }: StatCardProps) => (
  <Card>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  </Card>
);

export const ManagerDashboard = () => {
  const { user } = useAuthStore();
  const { lapkins, fetchAll, isLoading } = useLapkinStore();
  const navigate = useNavigate();

  const basePath = user?.role === 'direktur' ? '/direktur' : '/manager';
  const isDirector = user?.role === 'direktur';

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** Line managers only: pegawai direct reports (exclude own and other managers). */
  const scopeLapkins = useMemo(() => {
    if (user?.role !== 'manager' || !user.id) return lapkins;
    return lapkins.filter((l) => l.employeeRole === 'pegawai' && l.managerId === user.id);
  }, [lapkins, user?.role, user?.id]);

  const stats = useMemo(() => {
    const managerLapkins = scopeLapkins.filter((l) => l.employeeRole === 'manager');
    const pegawaiLapkins = scopeLapkins.filter((l) => l.employeeRole === 'pegawai');
    const evaluationScope = isDirector ? managerLapkins : scopeLapkins;

    return {
      total: scopeLapkins.length,
      managerTotal: managerLapkins.length,
      pegawaiTotal: pegawaiLapkins.length,
      locked: evaluationScope.filter((l) => l.status === 'locked').length,
      evaluated: evaluationScope.filter((l) => l.status === 'evaluated').length,
    };
  }, [scopeLapkins, isDirector]);

  const pendingEvaluation = useMemo(() => {
    if (!user?.id) return [];

    if (user.role === 'manager') {
      return lapkins.filter(
        (l) => l.status === 'locked' && l.employeeRole === 'pegawai' && l.managerId === user.id,
      );
    }

    if (user.role === 'direktur') {
      return lapkins.filter((l) => l.status === 'locked' && l.employeeRole === 'manager');
    }

    return scopeLapkins.filter((l) => l.status === 'locked');
  }, [lapkins, scopeLapkins, user?.id, user?.role]);

  const openPendingLapkin = (l: Lapkin) => {
    navigate(`${basePath}/lapkin/${l.id}`, {
      state: isDirector
        ? {
          directorListBackPath:
            l.employeeRole === 'pegawai' ? '/direktur/lapkin/pegawai' : '/direktur/lapkin',
        }
        : user?.id && l.employeeId === user.id
          ? { managerListBackPath: '/manager/lapkin/saya' }
          : undefined,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader
        title={`Selamat datang, ${user?.name?.split(' ')[0]}!`}
        subtitle={
          isDirector
            ? 'Pantau LAPKIN yang sudah dikunci atau selesai di bawah struktur Anda (baca semua; paraf hanya untuk LAPKIN milik manajer).'
            : 'LAPKIN pribadi di menu LAPKIN Saya; evaluasi bawahan di LAPKIN Bawahan.'
        }
        action={
          isDirector ? (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="secondary" onClick={() => navigate('/direktur/lapkin/pegawai')}>
                LAPKIN Pegawai
              </Button>
              <Button onClick={() => navigate('/direktur/lapkin')}>LAPKIN Manajer</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="secondary" onClick={() => navigate('/manager/lapkin/saya')}>
                LAPKIN Saya
              </Button>
              <Button onClick={() => navigate('/manager/lapkin')}>LAPKIN Bawahan</Button>
            </div>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Total LAPKIN"
              value={stats.total}
              detail={isDirector ? `Manajer: ${stats.managerTotal} • Pegawai: ${stats.pegawaiTotal}` : 'LAPKIN pegawai'}
              color="bg-blue-100"
              icon={<FileText className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              label="Menunggu Evaluasi"
              value={stats.locked}
              detail={isDirector ? 'LAPKIN manajer' : 'LAPKIN pegawai'}
              color="bg-yellow-100"
              icon={<Users className="w-5 h-5 text-yellow-600" />}
            />
            <StatCard
              label="Sudah Dievaluasi"
              value={stats.evaluated}
              detail={isDirector ? 'LAPKIN manajer' : 'LAPKIN pegawai'}
              color="bg-green-100"
              icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            />
          </div>

          {pendingEvaluation.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Menunggu Evaluasi ({pendingEvaluation.length})
              </h3>
              <div className="space-y-1.5">
                {pendingEvaluation.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openPendingLapkin(l)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openPendingLapkin(l);
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-md bg-yellow-50 border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{l.employeeName}</p>
                      <p className="text-xs text-gray-500">{l.reportDate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isDirector && (
                        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
                          {l.employeeRole === 'pegawai' ? 'Pegawai' : 'Manajer'}
                        </span>
                      )}
                      <span className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full">
                        {isDirector && l.employeeRole === 'pegawai'
                          ? 'Tinjau'
                          : !isDirector && user?.id === l.employeeId
                            ? 'Paraf direktur'
                            : 'Evaluasi'}
                      </span>
                    </div>
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
