import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSocket } from '../../hooks/useSocket';

export const AppLayout = () => {
  useSocket(); // connect to WebSocket events globally

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
