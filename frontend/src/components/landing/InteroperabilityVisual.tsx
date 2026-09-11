import React from 'react';
import {
  User,
  Building2,
  Landmark,
  Coins,
  Layers,
  ArrowDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeptNode {
  id: string;
  nameKey: string;
  shortNameKey: string;
  icon: React.ElementType;
}

const DEPARTMENTS: DeptNode[] = [
  {
    id: 'revenue',
    nameKey: 'visual.revenueDept',
    shortNameKey: 'visual.revenue',
    icon: Coins,
  },
  {
    id: 'land',
    nameKey: 'visual.landDept',
    shortNameKey: 'visual.land',
    icon: Landmark,
  },
  {
    id: 'welfare',
    nameKey: 'visual.welfareDept',
    shortNameKey: 'visual.welfare',
    icon: Building2,
  },
];

export const InteroperabilityVisual: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full max-w-lg mx-auto rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#002f5c]/95 to-slate-950/95 p-6 sm:p-8 text-white border border-white/15 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#FF6700]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#3A6EA5]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Architecture Visual Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Tier 1: Citizen Node */}
        <div className="w-full max-w-sm">
          <div className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-md flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3A6EA5] to-[#004E98] flex items-center justify-center text-white shadow-sm shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">
                {t('visual.citizenEntry', 'Citizen Application')}
              </p>
              <p className="text-[11px] text-slate-300">
                {t('visual.singleSubmission', 'Single verified submission')}
              </p>
            </div>
          </div>

          {/* Connector 1: Citizen -> Gateway */}
          <div className="h-7 flex flex-col items-center justify-center my-0.5">
            <div className="w-0.5 h-full bg-gradient-to-b from-[#3A6EA5] to-[#FF6700]" />
            <ArrowDown className="w-3.5 h-3.5 text-[#FF6700] -mt-1" />
          </div>
        </div>

        {/* Tier 2: Central FISOP Gateway */}
        <div className="w-full max-w-md bg-gradient-to-r from-[#004E98] to-[#003870] border-2 border-[#FF6700] rounded-2xl p-4 shadow-xl relative">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#FF6700] flex items-center justify-center text-white shadow-md shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                {t('visual.gatewayTitle', 'FISOP GATEWAY')}
              </h3>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                {t('visual.gatewayDesc', 'Federated verification & automated cross-department exchange')}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Branching Connector Lines (SVG) - 3 Departments */}
        <div className="w-full h-8 hidden sm:block">
          <svg className="w-full h-full" viewBox="0 0 360 32" preserveAspectRatio="none">
            {/* Center trunk down to branch point */}
            <line x1="180" y1="0" x2="180" y2="10" stroke="#FF6700" strokeWidth="2" />
            {/* Horizontal distributor */}
            <path d="M 60 10 L 300 10" stroke="#3A6EA5" strokeWidth="1.5" />
            {/* Branch to Revenue */}
            <path d="M 60 10 L 60 32" stroke="#3A6EA5" strokeWidth="1.5" />
            {/* Branch to Land */}
            <path d="M 180 10 L 180 32" stroke="#3A6EA5" strokeWidth="1.5" />
            {/* Branch to Welfare */}
            <path d="M 300 10 L 300 32" stroke="#3A6EA5" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Tier 3: 3 Connected Departments (Revenue | Land | Welfare) */}
        <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700/80 border border-slate-600/60 text-[#FF6700] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{t(dept.shortNameKey)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{t(dept.nameKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

