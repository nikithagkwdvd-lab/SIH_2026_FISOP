import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b192c] text-slate-300 border-t border-slate-800 text-xs py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Left: Government Branding */}
          <div className="flex items-center gap-3">
            <img src="/emblem.svg" alt="Government Seal" className="w-8 h-8 object-contain opacity-90" />
            <div>
              <p className="font-bold text-white text-sm">Government of Maharashtra</p>
              <p className="text-[11px] text-slate-400">
                Federated Interoperability and Service Orchestration Platform (FISOP)
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Smart India Hackathon • Problem Statement 26129
              </p>
            </div>
          </div>

          {/* Middle: Consent & Audit Badge */}
          <div className="bg-[#0f2a4a]/60 border border-emerald-900/60 rounded-lg p-2.5 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-300 text-[11px]">Temper-Evident Consent &amp; Audit</p>
              <p className="text-[10px] text-slate-300 leading-tight">
                Cross-department data exchange requires verified citizen consent and immutable audit logging.
              </p>
            </div>
          </div>

          {/* Right: Connectivity & Telemetry Status */}
          <div className="text-right flex flex-col items-end gap-1">
            <p className="text-[11px] font-semibold text-slate-200">
              Connected departments: <span className="text-white">Revenue, Land, Welfare</span>
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Interoperability Core:</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              v1.0.0 (Production Build) • Progressive Web App
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};
