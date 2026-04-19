import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSocket } from '../../hooks/useSocket';

export const AppLayout = () => {
  useSocket(); // connect to WebSocket events globally

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
