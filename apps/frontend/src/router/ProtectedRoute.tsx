import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { UserRole } from '../types';
import { PageSpinner } from '../components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

const roleHomePath: Record<UserRole, string> = {
  admin: '/admin',
  manager: '/manager',
  direktur: '/direktur',
  pegawai: '/pegawai',
};

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to={roleHomePath[user.role]} replace />;

  return <>{children}</>;
};
