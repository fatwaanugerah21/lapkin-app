import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { FtsDigihouseCredit } from './FtsDigihouseCredit';
import { useSocket } from '../../hooks/useSocket';

export const AppLayout = () => {
  useSocket(); // connect to WebSocket events globally
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) {
      document.body.style.overflow = '';
      return;
    }
    const updateOverflow = () => {
      document.body.style.overflow = window.matchMedia('(max-width: 767px)').matches ? 'hidden' : '';
    };
    updateOverflow();
    window.addEventListener('resize', updateOverflow);
    return () => {
      window.removeEventListener('resize', updateOverflow);
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50 print:h-auto print:max-h-none print:overflow-visible">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 print:hidden md:hidden"
          aria-label="Tutup menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col min-h-0 print:block print:w-full">
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-3 py-2.5 shadow-sm print:hidden md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 transition-colors"
            aria-expanded={mobileNavOpen}
            aria-controls="app-sidebar-nav"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <span className="font-semibold text-gray-900">LAPKIN</span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto print:overflow-visible print:min-h-0">
          <div className="mx-auto w-full max-w-6xl print:max-w-none">
            <Outlet />
          </div>
        </main>
        <footer className="shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm print:hidden">
          <FtsDigihouseCredit variant="footer" />
        </footer>
      </div>
    </div>
  );
};
