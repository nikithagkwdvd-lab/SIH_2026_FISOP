import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Server,
  Zap,
  Clock,
  RefreshCw,
  Percent,
  Database,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
} from 'lucide-react';
import { operationsApi } from '../../api/operations';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { formatDate, formatDurationMs, formatDepartmentName } from '../../utils/formatters';

export const OperationsDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 1. Health Query (~30s auto-refresh, paused when document is hidden)
  const {
    data: healthData,
    isLoading: isLoadingHealth,
    isError: isErrorHealth,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['operationsHealth'],
    queryFn: () => operationsApi.getMicroservicesHealth(),
    refetchInterval: () => (document.hidden ? false : 30000),
  });

  // 2. Metrics Query
  const {
    data: metricsData,
    isLoading: isLoadingMetrics,
    isError: isErrorMetrics,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['operationsMetrics'],
    queryFn: () => operationsApi.getOperationMetrics(),
    refetchInterval: () => (document.hidden ? false : 30000),
  });

  // 3. SLA Query
  const {
    data: slaData,
    isLoading: isLoadingSla,
    isError: isErrorSla,
    refetch: refetchSla,
  } = useQuery({
    queryKey: ['operationsSla'],
    queryFn: () => operationsApi.getSlaOverview(),
    refetchInterval: () => (document.hidden ? false : 30000),
  });

  // 4. Data Quality Query
  const {
    data: dqData,
    isLoading: isLoadingDq,
    isError: isErrorDq,
    refetch: refetchDq,
  } = useQuery({
    queryKey: ['operationsDataQuality'],
    queryFn: () => operationsApi.getDataQualityOverview(),
    refetchInterval: () => (document.hidden ? false : 30000),
  });

  // 5. Exceptions Query
  const {
    data: exceptionsData,
    isLoading: isLoadingExceptions,
    isError: isErrorExceptions,
    refetch: refetchExceptions,
  } = useQuery({
    queryKey: ['operationsExceptions'],
    queryFn: () => operationsApi.getExceptions(1, 10),
    refetchInterval: () => (document.hidden ? false : 30000),
  });

  const refetchAll = () => {
    refetchHealth();
    refetchMetrics();
    refetchSla();
    refetchDq();
    refetchExceptions();
    setLastUpdated(new Date());
  };

  useEffect(() => {
    if (healthData || metricsData || slaData) {
      setLastUpdated(new Date());
    }
  }, [healthData, metricsData, slaData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{t('operations.title')}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              {t('operations.autoRefreshOn')}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {t('operations.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block">{t('operations.lastUpdated')}</span>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('operations.refreshTelemetry')}
          </Button>
        </div>
      </div>

      {/* 2. Top High-Level KPI Strip (Independent fallback handling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Interoperability Calls */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('operations.totalRequests')}
            </span>
            <Activity className="w-4 h-4 text-gov-primary" />
          </div>
          {isLoadingMetrics ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-2" />
          ) : isErrorMetrics ? (
            <p className="text-sm text-rose-600 font-semibold mt-2">Unavailable</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {metricsData?.total_requests ?? '—'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="text-emerald-700 font-medium">
                  {metricsData?.successful_requests ?? 0} {t('operations.successful')}
                </span>
                <span>•</span>
                <span className="text-rose-700 font-medium">
                  {metricsData?.failed_requests ?? 0} {t('operations.failures')}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Failure Rate & Average Latency */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('operations.failureRate')}
            </span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          {isLoadingMetrics ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-2" />
          ) : isErrorMetrics ? (
            <p className="text-sm text-rose-600 font-semibold mt-2">Unavailable</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {metricsData ? `${(metricsData.failure_rate * 100).toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {t('operations.avgLatency')}:{' '}
                <strong>
                  {metricsData ? `${Math.round(metricsData.average_latency_ms)} ms` : '—'}
                </strong>
              </p>
            </>
          )}
        </div>

        {/* SLA Compliance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('operations.slaCompliance')}
            </span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          {isLoadingSla ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-2" />
          ) : isErrorSla ? (
            <p className="text-sm text-rose-600 font-semibold mt-2">Unavailable</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {slaData
                  ? `${Math.max(0, 100 - slaData.breach_rate * 100).toFixed(1)}%`
                  : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {t('operations.slaBreached')}:{' '}
                <strong className="text-rose-700">{slaData?.sla_breached ?? 0}</strong> of{' '}
                {slaData?.sla_total ?? 0}
              </p>
            </>
          )}
        </div>

        {/* Data Quality Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('operations.dataQuality')}
            </span>
            <Database className="w-4 h-4 text-gov-primary" />
          </div>
          {isLoadingDq ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-2" />
          ) : isErrorDq ? (
            <p className="text-sm text-rose-600 font-semibold mt-2">Unavailable</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">
                {dqData ? `${(dqData.overall_score * 100).toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {t('operations.validationErrors')}:{' '}
                <strong>{dqData?.validation_errors ?? 0}</strong>
              </p>
            </>
          )}
        </div>
      </div>

      {/* 3. Grid of Microservices Health & Department Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Microservice Health (Independent Error Handling) */}
        <Card
          title={t('operations.deptHealthTitle')}
          subtitle={t('operations.deptHealthSubtitle')}
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchHealth()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {t('operations.retry')}
            </Button>
          }
        >
          {isLoadingHealth ? (
            <TableSkeleton rows={4} cols={3} />
          ) : isErrorHealth ? (
            <ErrorBanner
              title={t('operations.unableToLoad')}
              message="Could not connect to health monitoring endpoint."
              onRetry={() => refetchHealth()}
            />
          ) : !healthData?.services || healthData.services.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No health check probes registered.</p>
          ) : (
            <div className="space-y-3">
              {healthData.services.map((svc) => (
                <div
                  key={svc.service}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-gov-primary" />
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {formatDepartmentName(svc.service)}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Checked: {formatDate(svc.last_checked)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-600">
                      {Math.round(svc.response_time_ms)} ms
                    </span>
                    <Badge
                      variant={svc.status.toUpperCase() === 'HEALTHY' ? 'success' : 'warning'}
                      size="sm"
                      dot
                    >
                      {svc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Per-Department Latency & Quality Metrics (Independent Error Handling) */}
        <Card
          title={t('operations.deptPerfTitle')}
          subtitle={t('operations.deptPerfSubtitle')}
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchMetrics()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {t('operations.retry')}
            </Button>
          }
        >
          {isLoadingMetrics ? (
            <TableSkeleton rows={4} cols={3} />
          ) : isErrorMetrics ? (
            <ErrorBanner
              title={t('operations.unableToLoad')}
              message="Could not retrieve departmental metrics breakdown."
              onRetry={() => refetchMetrics()}
            />
          ) : !metricsData?.departments ? (
            <p className="text-sm text-slate-500 italic">No departmental metrics available.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(metricsData.departments).map(([deptCode, metric]) => (
                <div key={deptCode} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      {formatDepartmentName(deptCode)} ({deptCode})
                    </span>
                    <span className="font-mono text-slate-600">
                      {Math.round(metric.average_latency_ms)} ms avg • {metric.requests} requests ({metric.failures} fails)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="bg-gov-primary h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            5,
                            (metric.requests / Math.max(1, metricsData.total_requests)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 4. Exception Log Table (Independent Error Handling) */}
      <Card
        title={t('operations.exceptionsTitle')}
        subtitle={t('operations.exceptionsSubtitle')}
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchExceptions()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('operations.retry')}
          </Button>
        }
      >
        {isLoadingExceptions ? (
          <TableSkeleton rows={4} cols={5} />
        ) : isErrorExceptions ? (
          <ErrorBanner
            title={t('operations.unableToLoad')}
            message="Could not load recent exceptions."
            onRetry={() => refetchExceptions()}
          />
        ) : !exceptionsData?.items || exceptionsData.items.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4 text-center">
            {t('operations.noExceptions')}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">{t('operations.timestamp')}</th>
                  <th className="py-3 px-4">{t('officialQueue.department')}</th>
                  <th className="py-3 px-4">{t('operations.operation')}</th>
                  <th className="py-3 px-4">{t('operations.category')}</th>
                  <th className="py-3 px-6">{t('operations.httpStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {exceptionsData.items.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 text-xs text-slate-500 font-mono">
                      {formatDate(exc.timestamp)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatDepartmentName(exc.department)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-700">{exc.operation}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="warning" size="sm">{exc.error_category}</Badge>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                      {exc.http_status ?? 'TIMEOUT'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
