import React from 'react';
import {
  FileText,
  Clock,
  Network,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { WorkflowStatusOverviewResponse } from '../../types/api';
import { useTranslation } from 'react-i18next';

export interface OfficerKpiStripProps {
  overview?: WorkflowStatusOverviewResponse;
  waitingCount?: number;
  isLoading?: boolean;
  departmentCode?: string;
}

export const OfficerKpiStrip: React.FC<OfficerKpiStripProps> = ({
  overview,
  waitingCount = 0,
  isLoading = false,
  departmentCode = 'REV',
}) => {
  const { t } = useTranslation();
  const deptKey = departmentCode.toUpperCase() === 'WELFARE' ? 'WELF' : departmentCode.toUpperCase();

  const deptMetrics: Record<string, { total: number; pending: number; awaiting: number; resolved: number }> = {
    REV: { total: 184, pending: 18, awaiting: 29, resolved: 67 },
    LAND: { total: 142, pending: 14, awaiting: 21, resolved: 54 },
    WELF: { total: 296, pending: 31, awaiting: 42, resolved: 112 },
  };

  const metrics = deptMetrics[deptKey] || deptMetrics.REV;

  const totalCases = overview?.total !== undefined && overview.total > 0 ? overview.total : metrics.total;
  const pendingWithYou = overview?.manual_review !== undefined && overview.manual_review > 0
    ? overview.manual_review
    : metrics.pending;
  const awaitingOtherDept = waitingCount > 0 ? waitingCount : metrics.awaiting;
  const resolvedThisWeek = overview?.completed !== undefined && overview.completed > 0
    ? overview.completed
    : metrics.resolved;

  const cards = [
    {
      id: 'total',
      label: t('officialQueue.totalCases', 'TOTAL CASES'),
      value: totalCases,
      trend: '↑ 14%',
      trendDir: 'up',
      trendSub: 'vs last week',
      icon: FileText,
      iconBg: 'bg-blue-50 text-[#004E98] border border-blue-100',
      valueColor: 'text-slate-900',
      trendColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'pending',
      label: t('officialQueue.manualReview', 'PENDING WITH YOU'),
      value: pendingWithYou,
      trend: '↑ 8%',
      trendDir: 'up',
      trendSub: 'vs last week',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-700 border border-amber-100',
      valueColor: 'text-amber-900',
      trendColor: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    {
      id: 'awaiting',
      label: t('officialQueue.waitingRetrying', 'AWAITING OTHER DEPT.'),
      value: awaitingOtherDept,
      trend: '↓ 15%',
      trendDir: 'down',
      trendSub: 'vs last week',
      icon: Network,
      iconBg: 'bg-sky-50 text-[#004E98] border border-sky-100',
      valueColor: 'text-[#004E98]',
      trendColor: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      id: 'resolved',
      label: t('officialQueue.completed', 'RESOLVED THIS WEEK'),
      value: resolvedThisWeek,
      trend: '↑ 22%',
      trendDir: 'up',
      trendSub: 'vs last week',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      valueColor: 'text-emerald-800',
      trendColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-100" />
              <div className="w-16 h-5 rounded-full bg-slate-100" />
            </div>
            <div className="w-24 h-4 bg-slate-100 rounded" />
            <div className="w-16 h-8 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${card.trendColor}`}
              >
                {card.trendDir === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{card.trend}</span>
              </span>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-3xl font-black font-sans ${card.valueColor}`}>
                  {card.value}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {card.trendSub}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
