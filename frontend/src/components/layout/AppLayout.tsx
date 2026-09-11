import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';
import { WifiOff } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const location = useLocation();
  const isOfficial = location.pathname.startsWith('/official');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Offline banner for PWA */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are currently offline. Cached application records and screens remain available.</span>
        </div>
      )}

      <Header />

      <main
        className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
          isOfficial ? 'max-w-[1680px]' : 'max-w-7xl'
        }`}
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
