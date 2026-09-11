import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ShieldAlert, Server } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#004E98] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Platform Administration &amp; AI Governance</h1>
              <p className="text-xs text-slate-500">System Telemetry, AI Schema Mappings &amp; Observability</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-600">
            <Server className="w-8 h-8 text-[#004E98] mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Platform Operations &amp; AI Mapping Portal Connected</p>
            <p className="mt-1 text-slate-500 max-w-md mx-auto">
              Phase 1 foundation established. Admin telemetry, SLA monitoring, and AI schema onboarding interfaces ready for full phase execution.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
