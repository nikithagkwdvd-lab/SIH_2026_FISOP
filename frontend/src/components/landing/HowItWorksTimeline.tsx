import React, { useState } from 'react';
import {
  FileText,
  KeyRound,
  Network,
  Cpu,
  Activity,
  CheckCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface Stage {
  step: string;
  title: string;
  shortDesc: string;
  details: string;
  icon: React.ElementType;
  tag: string;
}

const STAGES: Stage[] = [
  {
    step: '01',
    title: 'Citizen Request',
    shortDesc: 'Single application submission without uploading duplicate documents',
    details: 'Citizen submits an application for a government benefit (e.g., Post-Matric Scholarship or Housing Scheme) via the unified portal using their verified identifier.',
    icon: FileText,
    tag: 'Portal Entry',
  },
  {
    step: '02',
    title: 'Identity & Consent',
    shortDesc: 'Cryptographic citizen consent & canonical identity resolution',
    details: 'The platform captures explicit, time-stamped citizen consent and resolves the citizen ID into canonical identifiers for each target department system.',
    icon: KeyRound,
    tag: 'Consent Engine',
  },
  {
    step: '03',
    title: 'Department Data Exchange',
    shortDesc: 'Federated API queries to Revenue, Land, & Welfare databases',
    details: 'FISOP invokes secure departmental connectors to fetch authoritative data (income certificates, 7/12 land titles, ration categories) in real-time.',
    icon: Network,
    tag: 'Interoperability',
  },
  {
    step: '04',
    title: 'Cross-Department Processing',
    shortDesc: 'Automated normalization, data validation, and SLA enforcement',
    details: 'Incoming payloads are transformed to canonical JSON-LD schemas. Circuit breakers and retry queues guarantee high availability and fault resilience.',
    icon: Cpu,
    tag: 'Orchestration',
  },
  {
    step: '05',
    title: 'Unified Status Tracking',
    shortDesc: 'Live progress tracking across all verifying departments',
    details: 'Both citizens and desk officials view synchronized stage-by-stage status without having to visit multiple department portals or physical offices.',
    icon: Activity,
    tag: 'Real-time Tracking',
  },
  {
    step: '06',
    title: 'Citizen Receives Outcome',
    shortDesc: 'Final decision, direct benefit transfer (DBT) & digital certificate',
    details: 'Approved benefits are disbursed directly, with tamper-evident audit trails stored for transparency, compliance, and government audits.',
    icon: CheckCircle,
    tag: 'Resolution',
  },
];

export const HowItWorksTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const currentStage = STAGES[activeStep];

  return (
    <div className="w-full">
      {/* Desktop & Tablet Horizontal Timeline Steps */}
      <div className="hidden lg:grid grid-cols-6 gap-3 mb-6">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={stage.step}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-36 ${
                isActive
                  ? 'bg-white border-[#FF6700] ring-2 ring-[#FF6700]/20 shadow-md transform -translate-y-1'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    isActive
                      ? 'bg-[#FF6700] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stage.step}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive
                      ? 'bg-[#004E98] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h4
                  className={`text-xs font-bold line-clamp-1 ${
                    isActive ? 'text-[#004E98]' : 'text-slate-800'
                  }`}
                >
                  {stage.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                  {stage.shortDesc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline Accordion */}
      <div className="lg:hidden space-y-3 mb-6">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeStep === idx;
          return (
            <div
              key={stage.step}
              className={`rounded-xl border transition-all overflow-hidden ${
                isActive
                  ? 'bg-white border-[#FF6700] shadow-md ring-1 ring-[#FF6700]/30'
                  : 'bg-white border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveStep(idx)}
                className="w-full text-left p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                      isActive
                        ? 'bg-[#FF6700] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {stage.step}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{stage.title}</h4>
                    <p className="text-xs text-slate-500">{stage.tag}</p>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${
                    isActive
                      ? 'bg-[#004E98] text-white rotate-90'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {isActive && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50">
                  <p className="leading-relaxed">{stage.details}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Stage Detailed Focus Card (Desktop Highlight) */}
      <div className="hidden lg:block bg-gradient-to-r from-[#004E98] to-[#3A6EA5] rounded-2xl p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          {React.createElement(currentStage.icon, { className: 'w-64 h-64' })}
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#FF6700] text-white px-2.5 py-0.5 rounded-full">
                Stage {currentStage.step} of 06
              </span>
              <span className="text-xs text-slate-200 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
                {currentStage.tag}
              </span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-white">
              {currentStage.title}
            </h3>

            <p className="text-sm text-slate-100 leading-relaxed max-w-2xl">
              {currentStage.details}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-start md:items-end justify-center">
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev + 1) % STAGES.length)}
              className="inline-flex items-center gap-2 bg-white text-[#004E98] hover:bg-[#EBEBEB] px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-4 h-4 text-[#FF6700]" />
            </button>
            <span className="text-[11px] text-slate-200">
              Click any step above to inspect
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
