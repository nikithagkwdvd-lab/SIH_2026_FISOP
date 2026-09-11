import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileQuestion,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { StatusStepper } from '../../components/stepper/StatusStepper';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { formatDate, formatStatusLabel } from '../../utils/formatters';

export const ApplicationStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const newlyCreated = (location.state as { newlyCreated?: boolean })?.newlyCreated;
  const [showOfficeModal, setShowOfficeModal] = useState(false);

  const {
    data: statusData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['applicationStatus', id],
    queryFn: () => applicationsApi.getApplicationStatus(id!),
    enabled: Boolean(id),
    // Poll every 5 seconds while workflow status is non-terminal
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase();
      const isTerminal = status === 'APPROVED' || status === 'REJECTED' || status === 'FAILED';
      return isTerminal ? false : 5000;
    },
    refetchIntervalInBackground: true,
  });

  const resumeMutation = useMutation({
    mutationFn: () => applicationsApi.resumeWorkflow(id!, { reason: 'Citizen requested verification resume' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicationStatus', id] });
      refetch();
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullPage label="Retrieving live application status from orchestration engine..." />;
  }

  if (isError || !statusData) {
    const message = error instanceof Error ? error.message : 'Unable to load application workflow status.';
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/my-applications">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to my applications
            </Button>
          </Link>
        </div>
        <ErrorBanner
          title="Failed to retrieve workflow status"
          message={message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isTerminal =
    statusData.status === 'APPROVED' ||
    statusData.status === 'REJECTED' ||
    statusData.status === 'FAILED';

  const getBadgeVariant = (s: string) => {
    switch (s.toUpperCase()) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
      case 'FAILED':
        return 'danger';
      case 'WAITING_FOR_DEPARTMENT':
        return 'waiting';
      case 'MANUAL_REVIEW':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/my-applications">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to my applications
          </Button>
        </Link>
        <Badge variant={getBadgeVariant(statusData.status)} size="md" dot>
          {formatStatusLabel(statusData.status)}
        </Badge>
      </div>

      {/* Newly Created — Polished Success Banner */}
      {newlyCreated && (
        <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-300 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Application Submitted Successfully</p>
              <h2 className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {statusData.application_id}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Your application has entered the FISOP automated verification pipeline. You can track real-time progress below.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-200 flex flex-wrap gap-3">
            <Link to="/my-applications">
              <Button variant="secondary" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Reapplication Link Notice */}
      {statusData.parent_application_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              This is a <strong>Smart Reapplication</strong> linked to previous case record{' '}
              <span className="font-mono font-bold">{statusData.parent_application_id}</span>.
            </span>
          </div>
          <Link to={`/applications/${statusData.parent_application_id}/status`}>
            <span className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer">
              View Original Case
            </span>
          </Link>
        </div>
      )}

      {/* ─── MISSING DOCUMENT / DATA NOT AVAILABLE BANNER ────────────────────── */}
      {statusData.status === 'WAITING_FOR_DEPARTMENT' && statusData.waiting_reason === 'DOCUMENT_NOT_FOUND' && (
        <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-amber-400 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-md">
              <FileQuestion className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Verification Pending
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Application Preserved (Not Rejected)
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">DOCUMENT NOT AVAILABLE</h2>
              <p className="text-sm text-slate-600">
                A required verification record was not found in connected government databases during automated cross-department checks.
              </p>
            </div>
          </div>

          {/* Missing Document Details & Responsible Office Information Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Document Status */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Required Document
                </span>
                <Badge variant="waiting" size="sm">
                  NOT AVAILABLE
                </Badge>
              </div>
              <p className="text-base font-bold text-slate-900">
                {statusData.missing_document_item || 'Income Verification Record'}
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="text-slate-600">
                  <strong>Status:</strong> Not available in connected government records.
                </div>
                <div className="text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Your application has NOT been rejected.
                </div>
              </div>
            </div>

            {/* Responsible Office Routing */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Responsible Department
                </span>
                <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  Demo Routing Info
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {statusData.responsible_office?.name || (statusData.missing_document_dept === 'REV' ? 'Department of Revenue' : 'Designated Department')}
              </p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                {statusData.responsible_office?.zone && (
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-slate-700">Zone:</span>
                    <span>{statusData.responsible_office.zone}</span>
                  </div>
                )}
                {statusData.responsible_office?.office_address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                    <span>{statusData.responsible_office.office_address}</span>
                  </div>
                )}
                {statusData.responsible_office?.contact_info && (
                  <div className="flex items-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                    <span>{statusData.responsible_office.contact_info}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Guidance & Resume Trigger */}
          <div className="p-4 bg-amber-100/60 border border-amber-300 rounded-xl text-xs space-y-3">
            <div>
              <span className="font-bold text-amber-950 uppercase tracking-wide block mb-1">
                What you need to do:
              </span>
              <p className="text-amber-900 leading-relaxed">
                Please provide or verify the required document with the responsible department or office listed above. Once the record is updated in the department system, click <strong>Resume Verification</strong> below to re-query connected records and advance your application automatically.
              </p>
            </div>

            <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-900">
                <span className="font-semibold">Current State:</span>
                <span className="font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded text-amber-950">
                  WAITING FOR DOCUMENT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowOfficeModal(true)}
                  leftIcon={<Building2 className="w-3.5 h-3.5" />}
                >
                  View Office Details
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => resumeMutation.mutate()}
                  isLoading={resumeMutation.isPending}
                  className="bg-[#004E98] hover:bg-[#003B73] text-white font-bold shadow-sm"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  {resumeMutation.isPending ? 'Re-querying Records...' : 'Resume Verification'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Office Details Modal */}
      {showOfficeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#004E98]" />
                <h3 className="text-base font-bold text-slate-900">Responsible Department Details</h3>
              </div>
              <button
                onClick={() => setShowOfficeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <strong>Notice:</strong> The routing info below is prototype demo data configured for evaluation.
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Department</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {statusData.responsible_office?.name || 'Department of Revenue'}
                </p>
              </div>

              {statusData.responsible_office?.zone && (
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Zone</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{statusData.responsible_office.zone}</p>
                </div>
              )}

              {statusData.responsible_office?.office_address && (
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Designated Facilitation Center</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{statusData.responsible_office.office_address}</p>
                </div>
              )}

              {statusData.responsible_office?.contact_info && (
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Official Contact & Support</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{statusData.responsible_office.contact_info}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowOfficeModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Banner: APPROVED */}
      {statusData.status === 'APPROVED' && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Official Decision
                </span>
                {statusData.decision_by && (
                  <span className="text-xs text-slate-500">
                    Decided by: <strong>{statusData.decision_by}</strong>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900">Application Approved</h2>
              <p className="text-sm text-slate-600">
                All cross-department checks have verified your eligibility. Your benefits/clearance have been officially sanctioned.
              </p>
              {statusData.officer_remarks && (
                <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <strong>Officer Remarks:</strong> {statusData.officer_remarks}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Decision Banner: REJECTED with Smart Reapplication CTA */}
      {statusData.status === 'REJECTED' && (
        <div className="bg-gradient-to-br from-red-50 via-white to-amber-50 border-2 border-red-300 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shrink-0 shadow-md">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-700 uppercase tracking-wider bg-red-100 px-2.5 py-0.5 rounded-full">
                  Application Rejected
                </span>
                {statusData.decision_by && (
                  <span className="text-xs text-slate-500">
                    Reviewed by: <strong>{statusData.decision_by}</strong>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900">Eligibility Criteria Not Met</h2>
              <p className="text-sm text-slate-600">
                The reviewing department has evaluated this submission and could not approve it under current norms.
              </p>
            </div>
          </div>

          {/* Rejection Details & Affected Fields Box */}
          <div className="bg-white border border-red-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div>
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
                Official Rejection Reason
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {statusData.rejection_reason || 'Department verification determined that eligibility requirements were not satisfied.'}
              </p>
            </div>

            {statusData.officer_remarks && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Officer Remarks / Guidance
                </span>
                <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                  {statusData.officer_remarks}
                </p>
              </div>
            )}

            {statusData.affected_fields && statusData.affected_fields.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1.5">
                  Affected Fields Requiring Attention
                </span>
                <div className="flex flex-wrap gap-2">
                  {statusData.affected_fields.map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Smart Reapply Action Banner */}
          <div className="pt-2 border-t border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">Want to correct your information and reapply?</p>
              <p className="text-xs text-slate-500">
                Smart Reapplication pre-fills your verified details and lets you correct the affected fields.
              </p>
            </div>
            <Link to={`/applications/${statusData.application_id}/reapply`}>
              <Button variant="primary" size="md" className="bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold shadow-md whitespace-nowrap">
                Review & Reapply
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Application reference
          </span>
          <h1 className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
            {statusData.application_id}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              Service: <strong className="text-slate-700">{statusData.service}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Submitted: {formatDate(statusData.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Last updated: {formatDate(statusData.updated_at)}
            </span>
          </div>
        </div>

        {statusData.workflow_instance_id && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono">
            <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold">
              Workflow instance
            </span>
            {statusData.workflow_instance_id}
          </div>
        )}
      </div>

      {/* Centerpiece: Live Status Stepper Card */}
      <Card
        title="Cross-department orchestration pipeline"
        subtitle="Real-time multi-department verification sequence"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-xs text-slate-600"
          >
            Refresh now
          </Button>
        }
      >
        <StatusStepper statusData={statusData} isPolling={!isTerminal} />
      </Card>

      {/* Department Verification Summary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Revenue</span>
            <Badge
              variant={
                statusData.progress.revenue === 'COMPLETED'
                  ? 'success'
                  : statusData.progress.revenue === 'IN_PROGRESS'
                  ? 'info'
                  : 'neutral'
              }
              size="sm"
            >
              {formatStatusLabel(statusData.progress.revenue)}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-900">Income & Tax Certificate</p>
          <p className="text-xs text-slate-500">
            Automated pull from Revenue department ensures income falls under the scholarship limit.
          </p>
        </div>

        {/* Land Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Land records</span>
            <Badge
              variant={
                statusData.progress.land === 'COMPLETED'
                  ? 'success'
                  : statusData.progress.land === 'WAITING' || statusData.status === 'WAITING_FOR_DEPARTMENT'
                  ? 'waiting'
                  : statusData.progress.land === 'IN_PROGRESS'
                  ? 'info'
                  : 'neutral'
              }
              size="sm"
            >
              {statusData.status === 'WAITING_FOR_DEPARTMENT' || statusData.progress.land === 'WAITING'
                ? 'Waiting / Retrying'
                : formatStatusLabel(statusData.progress.land)}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-900">Property & Survey Records</p>
          <p className="text-xs text-slate-500">
            Direct survey number validation confirms land ownership and residential criteria.
          </p>
        </div>

        {/* Welfare Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Social welfare</span>
            <Badge
              variant={
                statusData.progress.welfare === 'COMPLETED'
                  ? 'success'
                  : statusData.progress.welfare === 'IN_PROGRESS'
                  ? 'info'
                  : 'neutral'
              }
              size="sm"
            >
              {formatStatusLabel(statusData.progress.welfare)}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-900">Beneficiary Entitlements</p>
          <p className="text-xs text-slate-500">
            Cross-checks active scheme registries to verify no conflicting benefits are active.
          </p>
        </div>
      </div>

      {/* Citizen Help & Assistance */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">What happens next?</span>
          <p className="mt-0.5">
            Once all three departmental checks complete, our evaluation engine computes final scholarship eligibility. You do not need to upload paper certificates or visit a government office.
          </p>
        </div>
      </div>
    </div>
  );
};
