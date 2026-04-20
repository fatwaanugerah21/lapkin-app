import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { FtsDigihouseCredit } from './FtsDigihouseCredit';
import { useSocket } from '../../hooks/useSocket';

export const AppLayout = () => {
  useSocket(); // connect to WebSocket events globally

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50 print:h-auto print:max-h-none print:overflow-visible">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col min-h-0 print:block print:w-full">
        <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible print:min-h-0">
          <Outlet />
        </main>
        <footer className="shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm print:hidden">
          <FtsDigihouseCredit variant="footer" />
        </footer>
      </div>
    </div>
  );
};
