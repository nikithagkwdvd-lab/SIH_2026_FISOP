import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src="/emblem.svg" alt="Emblem" className="w-6 h-6 opacity-80" />
              <span className="font-semibold text-white tracking-wide text-sm">
                Government of Maharashtra
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Federated Interoperability and Service Orchestration Platform (FISOP)
            </p>
            <p className="text-xs text-slate-500">
              Smart India Hackathon • Problem Statement 26129
            </p>
          </div>

          {/* Center Column: Privacy & Security Statement */}
          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white block">Tamper-Evident Consent & Audit</span>
              Cross-department data exchange requires verified citizen consent and immutable audit logging.
            </div>
          </div>

          {/* Right Column: Platform Metadata */}
          <div className="text-left md:text-right space-y-1 text-xs text-slate-400">
            <div>Connected departments: <span className="text-slate-200">Revenue, Land, Welfare</span></div>
            <div>Interoperability Core: <span className="text-emerald-400">Online</span></div>
            <div className="text-slate-500 pt-1">
              v1.0.0 (Production Build) • Progressive Web App
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
