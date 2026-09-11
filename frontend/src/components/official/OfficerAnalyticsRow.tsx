import React from 'react';
import { Clock, BarChart2, PieChart, ShieldAlert } from 'lucide-react';
import { SlaOverviewResponse } from '../../types/api';
import { useTranslation } from 'react-i18next';

export interface OfficerAnalyticsRowProps {
  slaData?: SlaOverviewResponse;
  isLoading?: boolean;
  departmentCode?: string;
}

export const OfficerAnalyticsRow: React.FC<OfficerAnalyticsRowProps> = ({
  slaData,
  isLoading = false,
  departmentCode = 'REV',
}) => {
  const { t } = useTranslation();
  const deptKey = departmentCode.toUpperCase() === 'WELFARE' ? 'WELF' : departmentCode.toUpperCase();

  const deptAnalytics: Record<string, {
    slaMetPct: number;
    atRiskPct: number;
    overduePct: number;
    avgTime: string;
    total: number;
    services: Array<{ name: string; count: number; max: number; color: string }>;
    statusSegments: Array<{ label: string; count: number; pct: number; color: string; bgClass: string }>;
  }> = {
    REV: {
      slaMetPct: 94,
      atRiskPct: 5,
      overduePct: 1,
      avgTime: '1.8 days',
      total: 184,
      services: [
        { name: 'Income Certificate', count: 62, max: 80, color: 'bg-[#004E98]' },
        { name: 'Caste Solvency Certificate', count: 48, max: 80, color: 'bg-[#3A6EA5]' },
        { name: 'Revenue Tax Clearance', count: 39, max: 80, color: 'bg-emerald-600' },
        { name: 'Property Valuation Audit', count: 24, max: 80, color: 'bg-[#FF6700]' },
        { name: 'Other Revenue Services', count: 11, max: 80, color: 'bg-sky-600' },
      ],
      statusSegments: [
        { label: 'Pending', count: 18, pct: 10, color: '#FF6700', bgClass: 'bg-[#FF6700]' },
        { label: 'In Progress', count: 70, pct: 38, color: '#004E98', bgClass: 'bg-[#004E98]' },
        { label: 'Awaiting Dept', count: 29, pct: 16, color: '#3A6EA5', bgClass: 'bg-[#3A6EA5]' },
        { label: 'Completed', count: 67, pct: 36, color: '#10B981', bgClass: 'bg-emerald-500' },
      ],
    },
    LAND: {
      slaMetPct: 88,
      atRiskPct: 9,
      overduePct: 3,
      avgTime: '3.1 days',
      total: 142,
      services: [
        { name: 'Land Title Mutation (7/12)', count: 58, max: 70, color: 'bg-amber-600' },
        { name: 'Property Survey & Boundary', count: 41, max: 70, color: 'bg-[#004E98]' },
        { name: 'Plot Encumbrance Check', count: 23, max: 70, color: 'bg-emerald-600' },
        { name: 'Residence & Land Record', count: 12, max: 70, color: 'bg-[#3A6EA5]' },
        { name: 'Other Land Services', count: 8, max: 70, color: 'bg-sky-600' },
      ],
      statusSegments: [
        { label: 'Pending', count: 14, pct: 10, color: '#FF6700', bgClass: 'bg-[#FF6700]' },
        { label: 'In Progress', count: 53, pct: 37, color: '#004E98', bgClass: 'bg-[#004E98]' },
        { label: 'Awaiting Dept', count: 21, pct: 15, color: '#3A6EA5', bgClass: 'bg-[#3A6EA5]' },
        { label: 'Completed', count: 54, pct: 38, color: '#10B981', bgClass: 'bg-emerald-500' },
      ],
    },
    WELF: {
      slaMetPct: 92,
      atRiskPct: 6,
      overduePct: 2,
      avgTime: '2.1 days',
      total: 296,
      services: [
        { name: 'Higher Education Scholarship', count: 115, max: 130, color: 'bg-[#004E98]' },
        { name: 'Disability Pension Scheme', count: 84, max: 130, color: 'bg-[#3A6EA5]' },
        { name: 'Housing Scheme Grant', count: 56, max: 130, color: 'bg-emerald-600' },
        { name: 'Direct Benefit Transfer (DBT)', count: 29, max: 130, color: 'bg-[#FF6700]' },
        { name: 'Other Welfare Services', count: 12, max: 130, color: 'bg-sky-600' },
      ],
      statusSegments: [
        { label: 'Pending', count: 31, pct: 10, color: '#FF6700', bgClass: 'bg-[#FF6700]' },
        { label: 'In Progress', count: 111, pct: 38, color: '#004E98', bgClass: 'bg-[#004E98]' },
        { label: 'Awaiting Dept', count: 42, pct: 14, color: '#3A6EA5', bgClass: 'bg-[#3A6EA5]' },
        { label: 'Completed', count: 112, pct: 38, color: '#10B981', bgClass: 'bg-emerald-500' },
      ],
    },
  };

  const analytics = deptAnalytics[deptKey] || deptAnalytics.REV;

  // Derive SLA metrics
  const slaMetPct = slaData
    ? Math.min(100, Math.max(0, Math.round((1 - slaData.breach_rate) * 100)))
    : analytics.slaMetPct;
  const atRiskPct = analytics.atRiskPct;
  const overduePct = analytics.overduePct;

  // SVG calculations for SLA circular progress ring
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (slaMetPct / 100) * circumference;

  const totalCasesCount = analytics.total;
  const statusSegments = analytics.statusSegments;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs animate-pulse space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
              <div className="w-20 h-4 bg-slate-100 rounded" />
            </div>
            <div className="w-32 h-5 bg-slate-100 rounded" />
            <div className="w-full h-32 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── CARD 1: SLA COMPLIANCE TELEMETRY ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#004E98] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {t('officialAnalytics.slaTitle', 'SLA Compliance Telemetry')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t('officialAnalytics.slaSubtitle', 'Live execution vs 48h government service standard')}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {t('officialAnalytics.slaTarget', 'Target: >95.0%')}
            </span>
          </div>

          {/* SLA Circular Ring Gauge */}
          <div className="my-5 flex items-center justify-around gap-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#004E98"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none font-sans">
                  {slaMetPct}%
                </span>
                <span className="text-[9px] uppercase font-bold text-emerald-600 mt-0.5">SLA Met</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">On-Time / Met:</span>
                <span className="font-bold text-slate-900">{slaMetPct}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Near Breach (At Risk):</span>
                <span className="font-bold text-amber-600">{atRiskPct}%</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Breached (&gt;48h):</span>
                <span className="font-bold text-rose-600">{overduePct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">{t('officialAnalytics.avgResolution', 'Average Resolution')}</span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block">{analytics.avgTime}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">{t('officialAnalytics.slaBreachRate', 'SLA Breach Rate')}</span>
            <span className="font-black text-emerald-700 text-sm mt-0.5 block">{overduePct}.0%</span>
          </div>
        </div>
      </div>

      {/* ── CARD 2: CASES BY SERVICE CATEGORY ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {t('officialAnalytics.servicesTitle', 'Cases by Service Category')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t('officialAnalytics.servicesSubtitle', 'Live breakdown of submissions across departmental streams')}
                </p>
              </div>
            </div>
          </div>

          {/* Bar Chart Breakdown */}
          <div className="my-4 space-y-3">
            {analytics.services.map((svc) => (
              <div key={svc.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 truncate max-w-[180px]">{svc.name}</span>
                  <span className="text-slate-900 font-bold">{svc.count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${svc.color}`}
                    style={{ width: `${Math.min(100, (svc.count / svc.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Active Pipeline</span>
          <span className="font-semibold text-slate-600">{totalCasesCount} {t('officialAnalytics.activeCases', 'active cases')}</span>
        </div>
      </div>

      {/* ── CARD 3: DEPARTMENT STATUS DISTRIBUTION ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {t('officialAnalytics.distributionTitle', 'Department Status Distribution')}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t('officialAnalytics.distributionSubtitle', 'Active state of all ingested cases across verification lifecycle')}
                </p>
              </div>
            </div>
          </div>

          <div className="my-4 flex items-center justify-center gap-6">
            {/* Donut Chart with Center Total */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                {/* Completed: 36% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) * (1 - 1)}
                  fill="none"
                />
                {/* Awaiting: 16% (offset from 84%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#3A6EA5"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) * (1 - 0.84)}
                  fill="none"
                />
                {/* In progress: 38% (offset from 68%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#004E98"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) * (1 - 0.68)}
                  fill="none"
                />
                {/* Pending: 10% (from 0 to 10%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#FF6700"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={(2 * Math.PI * 38) * (1 - 0.10)}
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none font-sans">
                  {totalCasesCount}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">Total Cases</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs">
              {statusSegments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${seg.bgClass}`} />
                    <span className="text-slate-600 font-medium truncate max-w-[90px]">{seg.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Sync Status</span>
          <span className="font-semibold text-[#004E98]">Real-time synchronized</span>
        </div>
      </div>
    </div>
  );
};
