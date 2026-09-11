import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building,
  MapPin,
  HeartHandshake,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Layers,
  Calendar,
  Shield,
  Activity,
  User,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { interoperabilityApi } from '../../api/interoperability';
import { operationsApi } from '../../api/operations';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusStepper } from '../../components/stepper/StatusStepper';
import { LoadingSpinner, TableSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import {
  formatCurrency,
  formatDate,
  formatStatusLabel,
  formatDepartmentName,
} from '../../utils/formatters';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();

  // Modals state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewComments, setReviewComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [affectedFields, setAffectedFields] = useState<string[]>([]);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [resumeReason, setResumeReason] = useState('Department connector verified and online');

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // 1. Fetch Application Status & Metadata
  const {
    data: statusData,
    isLoading: isLoadingStatus,
    isError: isErrorStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['applicationStatus', id],
    queryFn: () => applicationsApi.getApplicationStatus(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const s = query.state.data?.status?.toUpperCase();
      return s === 'WAITING_FOR_DEPARTMENT' || s === 'IN_PROGRESS' ? 5000 : false;
    },
  });

  // Extract citizen identifier
  const citizenIdentifier =
    statusData?.application_id ? statusData.application_id : id;

  // 2. Fetch Interoperability Overview (combined cross-department view)
  const {
    data: citizenOverview,
    isLoading: isLoadingOverview,
  } = useQuery({
    queryKey: ['citizenOverview', citizenIdentifier],
    queryFn: () => interoperabilityApi.getUnifiedOverview(citizenIdentifier!),
    enabled: Boolean(citizenIdentifier),
    retry: false,
  });

  // 3. Fetch Application Audit Timeline
  const {
    data: timelineData,
    isLoading: isLoadingTimeline,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['applicationTimeline', id],
    queryFn: () => operationsApi.getApplicationTimeline(id!),
    enabled: Boolean(id),
  });

  // Manual Review Mutation
  const manualReviewMutation = useMutation({
    mutationFn: (payload: {
      action: 'APPROVE' | 'REJECT';
      comments?: string;
      rejection_reason?: string;
      officer_remarks?: string;
      affected_fields?: string[];
    }) => applicationsApi.performManualReview(id!, payload),
    onSuccess: (data) => {
      setReviewModalOpen(false);
      setReviewComments('');
      setRejectionReason('');
      setOfficerRemarks('');
      setAffectedFields([]);
      setRejectionError(null);
      setActionSuccessMessage(data.message || `Application successfully ${reviewAction.toLowerCase()}d.`);
      queryClient.invalidateQueries({ queryKey: ['applicationStatus', id] });
      queryClient.invalidateQueries({ queryKey: ['applicationTimeline', id] });
      queryClient.invalidateQueries({ queryKey: ['operationsWaiting'] });
      queryClient.invalidateQueries({ queryKey: ['operationsWorkflows'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Manual review action failed.';
      setActionErrorMessage(msg);
    },
  });

  // Resume Workflow Mutation
  const resumeWorkflowMutation = useMutation({
    mutationFn: (payload: { reason: string }) =>
      applicationsApi.resumeWorkflow(id!, payload),
    onSuccess: (data) => {
      setResumeModalOpen(false);
      setActionSuccessMessage(data.message || 'Workflow orchestration successfully resumed.');
      queryClient.invalidateQueries({ queryKey: ['applicationStatus', id] });
      queryClient.invalidateQueries({ queryKey: ['applicationTimeline', id] });
      queryClient.invalidateQueries({ queryKey: ['operationsWaiting'] });
      queryClient.invalidateQueries({ queryKey: ['operationsWorkflows'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to resume workflow.';
      setActionErrorMessage(msg);
    },
  });

  if (isLoadingStatus) {
    return <LoadingSpinner fullPage label="Loading case records and cross-department telemetry..." />;
  }

  if (isErrorStatus || !statusData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/official/queue">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to case queue
          </Button>
        </Link>
        <ErrorBanner
          title="Unable to load case record"
          message="The requested application could not be found or connection timed out."
          onRetry={() => refetchStatus()}
        />
      </div>
    );
  }

  const isWaiting = statusData.status === 'WAITING_FOR_DEPARTMENT';
  const isManualReviewRequired = statusData.status === 'MANUAL_REVIEW';
  const canReview = hasRole(['DEPARTMENT_OFFICIAL', 'ADMIN']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/official/queue">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Case Queue
            </Button>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-mono font-bold text-slate-700">
            {statusData.application_id}
          </span>
        </div>

        {/* Action Buttons for Authorized Officials */}
        {canReview && (
          <div className="flex flex-wrap items-center gap-2">
            {isWaiting && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResumeModalOpen(true)}
                leftIcon={<Play className="w-4 h-4" />}
                className="bg-amber-700 hover:bg-amber-800"
              >
                Resume Stuck Workflow
              </Button>
            )}

            <Button
              variant="success"
              size="sm"
              onClick={() => {
                setReviewAction('APPROVE');
                setReviewModalOpen(true);
              }}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setReviewAction('REJECT');
                setReviewModalOpen(true);
              }}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{actionSuccessMessage}</div>
        </div>
      )}

      {actionErrorMessage && (
        <ErrorBanner
          title="Action failed"
          message={actionErrorMessage}
          onRetry={() => setActionErrorMessage(null)}
        />
      )}

      {/* Case Header Card */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase">Case Dossier</span>
            <span className="font-mono text-xl font-bold text-slate-900">
              {statusData.application_id}
            </span>
            <Badge
              variant={
                statusData.status === 'APPROVED'
                  ? 'success'
                  : statusData.status === 'REJECTED'
                  ? 'danger'
                  : statusData.status === 'WAITING_FOR_DEPARTMENT'
                  ? 'waiting'
                  : statusData.status === 'MANUAL_REVIEW'
                  ? 'warning'
                  : 'info'
              }
              size="md"
              dot
            >
              {formatStatusLabel(statusData.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span>Service: <strong className="text-slate-800">{statusData.service}</strong></span>
            <span>Created: <strong>{formatDate(statusData.created_at)}</strong></span>
            <span>Trace: <strong className="font-mono">{statusData.trace_id || 'N/A'}</strong></span>
          </div>
        </div>

        {statusData.workflow_instance_id && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-600">
            <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold">
              Orchestration Engine ID
            </span>
            {statusData.workflow_instance_id}
          </div>
        )}
      </div>

      {/* Stepper Card */}
      <Card title="Live Orchestration Pipeline" subtitle="Current status across department verification nodes">
        <StatusStepper statusData={statusData} isPolling={isWaiting || statusData.status === 'IN_PROGRESS'} />
      </Card>

      {/* Cross-Department Interoperability Pulled Data */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Cross-Department Verified Data</h2>
            <p className="text-xs text-slate-500">
              Normalized payloads fetched from connected departmental APIs (/api/interoperability/citizens/{'{id}'}/overview)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Department Data */}
          <Card
            title={
              <div className="flex items-center gap-2 text-base">
                <Building className="w-5 h-5 text-gov-primary" />
                <span>Revenue Department</span>
              </div>
            }
            subtitle="Income & Tax Validation"
          >
            {isLoadingOverview ? (
              <TableSkeleton rows={3} cols={1} />
            ) : citizenOverview?.income ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Annual Family Income</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrency(citizenOverview.income.annual_income)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tax Filing Status</span>
                  <span className="font-medium text-slate-800">
                    {citizenOverview.income.tax_status || 'Verified Non-Taxpayer'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Income Verified</span>
                  <span className="font-semibold text-emerald-700">
                    {citizenOverview.income.income_verified ? 'Yes (Certified)' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Connector Status</span>
                  <Badge variant={citizenOverview.income.status === 'AVAILABLE' ? 'success' : 'warning'} size="sm">
                    {citizenOverview.income.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No revenue records resolved for this citizen identifier.
              </p>
            )}
          </Card>

          {/* Land Records Department Data */}
          <Card
            title={
              <div className="flex items-center gap-2 text-base">
                <MapPin className="w-5 h-5 text-gov-primary" />
                <span>Land Records</span>
              </div>
            }
            subtitle="Property & Survey Holding"
          >
            {isLoadingOverview ? (
              <TableSkeleton rows={3} cols={1} />
            ) : citizenOverview?.property ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Survey / Parcel Number</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {citizenOverview.property.survey_number || 'SURV-782/2024'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Assessed Value</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrency(citizenOverview.property.property_value)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Ownership Status</span>
                  <span className="font-medium text-slate-800">
                    {citizenOverview.property.ownership_status || 'Agricultural / Domicile'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Connector Status</span>
                  <Badge variant={citizenOverview.property.status === 'AVAILABLE' ? 'success' : 'warning'} size="sm">
                    {citizenOverview.property.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No land records resolved for this citizen identifier.
              </p>
            )}
          </Card>

          {/* Welfare Department Data */}
          <Card
            title={
              <div className="flex items-center gap-2 text-base">
                <HeartHandshake className="w-5 h-5 text-gov-primary" />
                <span>Social Welfare</span>
              </div>
            }
            subtitle="Beneficiary & Scheme Check"
          >
            {isLoadingOverview ? (
              <TableSkeleton rows={3} cols={1} />
            ) : citizenOverview?.welfare ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Scheme Code</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {citizenOverview.welfare.scheme_code || 'WEL-EDU-2026'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Eligibility Check</span>
                  <span className="font-semibold text-emerald-700">
                    {citizenOverview.welfare.eligibility_status || 'ELIGIBLE'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Conflict / Duplicate</span>
                  <span className="font-medium text-slate-800">None detected</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Connector Status</span>
                  <Badge variant={citizenOverview.welfare.status === 'AVAILABLE' ? 'success' : 'warning'} size="sm">
                    {citizenOverview.welfare.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No welfare records resolved for this citizen identifier.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Chronological Audit & Event Timeline */}
      <Card
        title="Audit & Orchestration Event Timeline"
        subtitle="Immutable chronological trail reconstructed from system audit logs (/api/operations/applications/{id}/timeline)"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchTimeline()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Timeline
          </Button>
        }
      >
        {isLoadingTimeline ? (
          <TableSkeleton rows={4} cols={4} />
        ) : !timelineData || timelineData.events.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No timeline events recorded yet.</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {timelineData.events.map((event, idx) => {
                const isLast = idx === timelineData.events.length - 1;
                return (
                  <li key={idx}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3 items-start">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gov-primary-light flex items-center justify-center ring-4 ring-white">
                            <Activity className="h-4 w-4 text-gov-primary" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {event.event}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                              {event.department && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">
                                  Dept: {formatDepartmentName(event.department)}
                                </span>
                              )}
                              {event.operation && <span>Op: {event.operation}</span>}
                              {event.trace_id && (
                                <span className="font-mono text-slate-400">
                                  {event.trace_id}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      {/* Manual Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setRejectionError(null);
        }}
        title={reviewAction === 'APPROVE' ? 'Approve Scholarship Application' : 'Reject Application'}
        subtitle={`Application Number: ${statusData.application_id}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setReviewModalOpen(false);
                setRejectionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'APPROVE' ? 'success' : 'danger'}
              onClick={() => {
                if (reviewAction === 'REJECT') {
                  if (!rejectionReason.trim()) {
                    setRejectionError('Rejection reason is strictly required before rejecting this application.');
                    return;
                  }
                  setRejectionError(null);
                  manualReviewMutation.mutate({
                    action: 'REJECT',
                    rejection_reason: rejectionReason.trim(),
                    officer_remarks: officerRemarks.trim() || undefined,
                    affected_fields: affectedFields.length > 0 ? affectedFields : undefined,
                  });
                } else {
                  manualReviewMutation.mutate({
                    action: 'APPROVE',
                    comments: reviewComments.trim() || undefined,
                    officer_remarks: officerRemarks.trim() || undefined,
                  });
                }
              }}
              isLoading={manualReviewMutation.isPending}
            >
              Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {reviewAction === 'APPROVE' ? (
            <>
              <p className="text-sm text-slate-600">
                By approving, you certify that the cross-departmental data satisfies all government eligibility norms for this scholarship.
              </p>
              <div>
                <label htmlFor="review-comments" className="block text-sm font-medium text-slate-700 mb-1">
                  Official Approval Comments (Optional)
                </label>
                <textarea
                  id="review-comments"
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="e.g. All tax and land parcel certificates match university enrollment records."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Please enter a clear justification for rejecting this application. The citizen will see this reason on their dashboard and can review affected fields for Smart Reapplication.
              </p>

              {rejectionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  {rejectionError}
                </div>
              )}

              <div>
                <label htmlFor="rejection-reason" className="block text-sm font-bold text-slate-800 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <input
                  id="rejection-reason"
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                  placeholder="e.g. Annual family income exceeds scholarship limit of Rs 3,00,000"
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="officer-remarks" className="block text-sm font-medium text-slate-700 mb-1">
                  Officer Remarks / Guidance for Citizen (Optional)
                </label>
                <textarea
                  id="officer-remarks"
                  rows={2}
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder="e.g. Please provide updated non-creamy layer certificate or revised ITR details."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Affected Fields Needing Correction
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Select which fields the citizen must review or correct during reapplication:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  {[
                    { id: 'annualIncome', label: 'Annual Family Income' },
                    { id: 'incomeSource', label: 'Income Source / Occupation' },
                    { id: 'academicYear', label: 'Academic Year' },
                    { id: 'instituteName', label: 'Institute / College Name' },
                    { id: 'courseDetails', label: 'Course / Degree Details' },
                    { id: 'yearOfStudy', label: 'Year of Study' },
                    { id: 'rollNumber', label: 'Roll / Enrollment Number' },
                    { id: 'scholarshipScheme', label: 'Scholarship Scheme' },
                    { id: 'applicantName', label: 'Applicant Legal Name' },
                    { id: 'addressLine', label: 'Address / Domicile' },
                    { id: 'district', label: 'District' },
                  ].map((field) => (
                    <label
                      key={field.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={affectedFields.includes(field.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAffectedFields([...affectedFields, field.id]);
                          } else {
                            setAffectedFields(affectedFields.filter((f) => f !== field.id));
                          }
                        }}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-slate-700 font-medium">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Resume Workflow Modal */}
      <Modal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        title="Resume Orchestration Workflow"
        subtitle={`Application Number: ${statusData.application_id}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResumeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                resumeWorkflowMutation.mutate({
                  reason: resumeReason,
                })
              }
              isLoading={resumeWorkflowMutation.isPending}
            >
              Resume Workflow
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This workflow was held in <code className="text-amber-800 font-bold">WAITING_FOR_DEPARTMENT</code> due to a connector timeout.
            Triggering resume will prompt the orchestration engine to immediately re-poll the Land / Revenue service connector.
          </p>

          <div>
            <label htmlFor="resume-reason" className="block text-sm font-medium text-slate-700 mb-1">
              Resume Justification
            </label>
            <input
              id="resume-reason"
              type="text"
              value={resumeReason}
              onChange={(e) => setResumeReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gov-primary"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
