import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserCog, ShieldCheck } from 'lucide-react';
import { usersService } from '../../services/users.service';
import { User } from '../../types';
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

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    usersService.getAll()
      .then(setUsers)
      .finally(() => setIsLoading(false));
  }, []);

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    manager: users.filter((u) => u.role === 'manager').length,
    pegawai: users.filter((u) => u.role === 'pegawai').length,
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Kelola seluruh pengguna sistem LAPKIN"
        action={<Button onClick={() => navigate('/admin/users')}>Kelola Pengguna</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Pengguna" value={stats.total} color="bg-blue-100" icon={<Users className="w-6 h-6 text-blue-600" />} />
          <StatCard label="Admin" value={stats.admin} color="bg-purple-100" icon={<ShieldCheck className="w-6 h-6 text-purple-600" />} />
          <StatCard label="Manager" value={stats.manager} color="bg-indigo-100" icon={<UserCog className="w-6 h-6 text-indigo-600" />} />
          <StatCard label="Pegawai" value={stats.pegawai} color="bg-gray-100" icon={<UserCheck className="w-6 h-6 text-gray-600" />} />
        </div>
      )}
    </div>
  );
};
