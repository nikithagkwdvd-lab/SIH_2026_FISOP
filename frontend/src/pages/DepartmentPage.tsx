import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Building2, ShieldCheck } from 'lucide-react';

export const DepartmentPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Department Official Review Queue</h1>
              <p className="text-xs text-slate-500">Revenue &amp; Interoperability Verification Portal</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-600">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">Department Official Portal Connected</p>
            <p className="mt-1 text-slate-500 max-w-md mx-auto">
              Phase 1 foundation established. Department queue and cross-verification interfaces ready for full phase execution.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
