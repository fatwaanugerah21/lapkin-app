import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/auth.store';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './router/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';

import { EmplyeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeLapkinList } from './pages/employee/EmployeeLapkinList';
import { EmployeeLapkinDetail } from './pages/employee/EmployeeLapkinDetail';

import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerMyLapkinList } from './pages/manager/ManagerMyLapkinList';
import { ManagerLapkinList } from './pages/manager/ManagerLapkinList';
import { ManagerLapkinDetail } from './pages/manager/ManagerLapkinDetail';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AccountPage } from './pages/account/AccountPage';

export const App = () => {
  const { initialize } = useAuthStore();

  // Restore session from httpOnly cookie on first load
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Pegawai */}
        <Route element={<ProtectedRoute allowedRoles={['pegawai']}><AppLayout /></ProtectedRoute>}>
          <Route path="/pegawai" element={<EmplyeeDashboard />} />
          <Route path="/pegawai/account" element={<AccountPage />} />
          <Route path="/pegawai/lapkin" element={<EmployeeLapkinList />} />
          <Route path="/pegawai/lapkin/:id" element={<EmployeeLapkinDetail />} />
        </Route>

        {/* Manager */}
        <Route element={<ProtectedRoute allowedRoles={['manager']}><AppLayout /></ProtectedRoute>}>
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/account" element={<AccountPage />} />
          <Route path="/manager/lapkin/saya" element={<ManagerMyLapkinList />} />
          <Route path="/manager/lapkin" element={<ManagerLapkinList />} />
          <Route path="/manager/lapkin/:id" element={<ManagerLapkinDetail />} />
        </Route>

        {/* Director: manager list vs pegawai list; evaluate only manager-owned LAPKIN */}
        <Route element={<ProtectedRoute allowedRoles={['direktur']}><AppLayout /></ProtectedRoute>}>
          <Route path="/direktur" element={<ManagerDashboard />} />
          <Route path="/direktur/account" element={<AccountPage />} />
          <Route path="/direktur/lapkin/pegawai" element={<ManagerLapkinList directorScope="pegawai" />} />
          <Route path="/direktur/lapkin" element={<ManagerLapkinList directorScope="manager" />} />
          <Route path="/direktur/lapkin/:id" element={<ManagerLapkinDetail />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']}><AppLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/account" element={<AccountPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
