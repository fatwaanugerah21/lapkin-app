import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  ChevronRight,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useAsyncAction } from '../../hooks/useAsyncAction';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const pegawaiNav: NavItem[] = [
  { to: '/pegawai', label: 'Dasbor', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/pegawai/lapkin', label: 'LAPKIN Saya', icon: <FileText className="w-5 h-5" /> },
  { to: '/pegawai/account', label: 'Akun Saya', icon: <UserCircle className="w-5 h-5" /> },
];

const managerNav: NavItem[] = [
  { to: '/manager', label: 'Dasbor', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/manager/lapkin/saya', label: 'LAPKIN Saya', icon: <FileText className="w-5 h-5" /> },
  { to: '/manager/lapkin', label: 'LAPKIN Bawahan', icon: <Users className="w-5 h-5" /> },
  { to: '/manager/account', label: 'Akun Saya', icon: <UserCircle className="w-5 h-5" /> },
];

const direkturNav: NavItem[] = [
  { to: '/direktur', label: 'Dasbor', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/direktur/lapkin', label: 'LAPKIN Manajer', icon: <FileText className="w-5 h-5" /> },
  { to: '/direktur/lapkin/pegawai', label: 'LAPKIN Pegawai', icon: <Users className="w-5 h-5" /> },
  { to: '/direktur/account', label: 'Akun Saya', icon: <UserCircle className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dasbor', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/admin/users', label: 'Kelola Pengguna', icon: <Users className="w-5 h-5" /> },
  { to: '/admin/account', label: 'Akun Saya', icon: <UserCircle className="w-5 h-5" /> },
];

const navByRole: Record<string, NavItem[]> = {
  pegawai: pegawaiNav,
  manager: managerNav,
  direktur: direkturNav,
  admin: adminNav,
};

const roleUiLabel: Record<string, string> = {
  pegawai: 'Pegawai',
  manager: 'Manajer',
  direktur: 'Direktur',
  admin: 'Administrator',
};

export interface SidebarProps {
  /** When true, drawer is visible (mobile only; md+ ignores). */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar = ({ mobileOpen = false, onCloseMobile }: SidebarProps = {}) => {
  const { user, logout } = useAuthStore();
  const { isLoading, run } = useAsyncAction();

  const navItems = navByRole[user?.role ?? ''] ?? [];

  const handleLogout = () => {
    closeMobile();
    run(logout, { successToast: 'Berhasil keluar' });
  };

  const closeMobile = () => onCloseMobile?.();

  return (
    <aside
      id="app-sidebar-nav"
      className={clsx(
        'w-64 h-full min-h-0 shrink-0 bg-gray-900 flex flex-col overflow-hidden print:hidden',
        'fixed inset-y-0 left-0 z-50 shadow-xl transition-transform duration-200 ease-out md:relative md:z-auto md:translate-x-0 md:shadow-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="shrink-0 px-6 py-5 border-b border-gray-700 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-white font-bold text-xl tracking-tight">LAPKIN</h1>
          <p className="text-gray-400 text-xs mt-0.5">Laporan Kinerja PNS</p>
        </div>
        <button
          type="button"
          onClick={closeMobile}
          className="md:hidden shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" aria-hidden />
        </button>
      </div>

      {/* User info */}
      <div className="shrink-0 px-4 py-4 border-b border-gray-700">
        <div className="bg-gray-800 rounded-lg px-3 py-2.5">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-gray-400 text-xs truncate mt-0.5">{user?.jobTitle}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
            {user?.role ? roleUiLabel[user.role] ?? user.role : ''}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={closeMobile}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 px-3 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
};
