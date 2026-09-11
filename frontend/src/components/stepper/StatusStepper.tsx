import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Building2,
  MapPin,
  HeartHandshake,
  Award,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { ApplicationStatusResponse, StageStatus } from '../../types/api';
import { formatStatusLabel } from '../../utils/formatters';

interface StatusStepperProps {
  statusData: ApplicationStatusResponse;
  isPolling?: boolean;
}

interface StepConfig {
  id: string;
  title: string;
  department: string;
  stageKey: keyof ApplicationStatusResponse['progress'];
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'application',
    title: 'Submitted',
    department: 'Central Gateway',
    stageKey: 'application',
    icon: FileCheck,
    description: 'Application received and consent validated',
  },
  {
    id: 'revenue',
    title: 'Revenue',
    department: 'Revenue & Income Tax',
    stageKey: 'revenue',
    icon: Building2,
    description: 'Annual family income and tax return verification',
  },
  {
    id: 'land',
    title: 'Land Records',
    department: 'Land & Property',
    stageKey: 'land',
    icon: MapPin,
    description: 'Survey number and ownership validation',
  },
  {
    id: 'welfare',
    title: 'Welfare',
    department: 'Social Welfare',
    stageKey: 'welfare',
    icon: HeartHandshake,
    description: 'Beneficiary status & scheme duplicate check',
  },
  {
    id: 'eligibility',
    title: 'Decision',
    department: 'Evaluation Engine',
    stageKey: 'eligibility',
    icon: Award,
    description: 'Final scheme eligibility determination',
  },
];

export const StatusStepper: React.FC<StatusStepperProps> = ({ statusData, isPolling = true }) => {
  const { progress, status: overallStatus, waiting_reason, failure_reason } = statusData;

  const getStepState = (stageKey: keyof ApplicationStatusResponse['progress']): {
    status: StageStatus;
    label: string;
    isWaiting: boolean;
    isCompleted: boolean;
    isInProgress: boolean;
    isFailed: boolean;
    isManualReview: boolean;
  } => {
    const rawStatus = (progress?.[stageKey] || 'PENDING').toUpperCase();
    const isWaiting = rawStatus === 'WAITING' || (overallStatus === 'WAITING_FOR_DEPARTMENT' && stageKey === 'land');
    const isCompleted = rawStatus === 'COMPLETED' || (stageKey === 'eligibility' && (overallStatus === 'APPROVED' || overallStatus === 'REJECTED'));
    const isInProgress = rawStatus === 'IN_PROGRESS';
    const isFailed = rawStatus === 'FAILED' || (stageKey === 'eligibility' && overallStatus === 'REJECTED');
    const isManualReview = rawStatus === 'MANUAL_REVIEW' || overallStatus === 'MANUAL_REVIEW';

    let label = 'Queued';
    if (isCompleted) {
      if (stageKey === 'eligibility') {
        label = overallStatus === 'APPROVED' ? 'Approved' : overallStatus === 'REJECTED' ? 'Rejected' : 'Completed';
      } else {
        label = 'Verified';
      }
    } else if (isWaiting) {
      label = 'Waiting / Retrying';
    } else if (isManualReview) {
      label = 'Manual review';
    } else if (isInProgress) {
      label = 'Verifying...';
    } else if (isFailed) {
      label = 'Failed';
    }

    return {
      status: rawStatus,
      label,
      isWaiting,
      isCompleted,
      isInProgress,
      isFailed,
      isManualReview,
    };
  };

  const isWaitingOverall = overallStatus === 'WAITING_FOR_DEPARTMENT';

  return (
    <div className="w-full space-y-6">
      {/* Live Polling Status Header Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Workflow verification status</span>
          {isPolling && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse" />
              Live polling (5s)
            </span>
          )}
        </div>
        <div className="text-xs font-mono text-slate-500">
          Trace: {statusData.trace_id || 'TRACE-INIT'}
        </div>
      </div>

      {/* Waiting / Resilience Alert Banner */}
      {isWaitingOverall && (
        <div
          className={`rounded-lg border-2 p-4 shadow-sm ${
            waiting_reason === 'DOCUMENT_NOT_FOUND'
              ? 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-blue-400 bg-blue-50 text-blue-900 animate-pulse'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full shrink-0 mt-0.5 ${
                waiting_reason === 'DOCUMENT_NOT_FOUND' ? 'bg-amber-200' : 'bg-blue-200'
              }`}
            >
              {waiting_reason === 'DOCUMENT_NOT_FOUND' ? (
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              ) : (
                <RefreshCw className="w-5 h-5 text-blue-800 animate-spin" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base">
                  {waiting_reason === 'DOCUMENT_NOT_FOUND'
                    ? 'Document Verification Pending: Record Not Found'
                    : 'Resilience hold: Department service verification in progress'}
                </h4>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    waiting_reason === 'DOCUMENT_NOT_FOUND'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-blue-200 text-blue-900'
                  }`}
                >
                  {waiting_reason === 'DOCUMENT_NOT_FOUND' ? 'Awaiting Document Record' : 'Automatic retry active'}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {waiting_reason === 'DOCUMENT_NOT_FOUND'
                  ? `Automated verification paused because ${
                      statusData.missing_document_item || 'the required record'
                    } was not found in connected government databases. Your application is preserved and can resume once the record is available.`
                  : 'The platform is waiting for the connected department connector to respond. Interoperability circuit resilience is handling automatic retries in the background.'}
              </p>
              <p className="mt-2 text-xs opacity-90">
                {waiting_reason === 'DOCUMENT_NOT_FOUND'
                  ? 'Refer to the Document Not Available section above for responsible department and office contact details.'
                  : 'You do not need to resubmit. This screen will automatically advance the moment the departmental data arrives.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Review Alert Banner */}
      {overallStatus === 'MANUAL_REVIEW' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">
                Manual review assigned to department official
              </h4>
              <p className="mt-1 text-sm text-amber-800">
                Your application requires verification by an authorized government reviewer before final eligibility approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Failure Alert Banner */}
      {overallStatus === 'REJECTED' && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-900">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-rose-900">Application not approved</h4>
              <p className="mt-1 text-sm text-rose-800">
                {failure_reason || 'Cross-departmental criteria for this scholarship scheme were not satisfied.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approval Success Banner */}
      {overallStatus === 'APPROVED' && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-900">Application successfully approved</h4>
              <p className="mt-1 text-sm text-emerald-800">
                All cross-departmental requirements (Revenue, Land, Welfare) have been verified and eligibility is confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Pipeline: Responsive layout (Horizontal on md+, Vertical on mobile) */}
      <div className="relative py-4">
        {/* Desktop Connecting Bar */}
        <div
          className="hidden md:block absolute top-10 left-8 right-8 h-1 bg-slate-200 z-0"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
          {STEPS.map((step, index) => {
            const stepState = getStepState(step.stageKey);
            const IconComponent = step.icon;

            // Determine circle styling
            let circleClass = 'bg-slate-100 text-slate-400 border-slate-300';
            let iconElement = <IconComponent className="w-5 h-5" />;

            if (stepState.isCompleted) {
              circleClass = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
              iconElement = <CheckCircle2 className="w-5 h-5" />;
            } else if (stepState.isWaiting) {
              circleClass =
                'bg-amber-500 text-white border-amber-600 ring-4 ring-amber-200 animate-pulse';
              iconElement = <RefreshCw className="w-5 h-5 animate-spin" />;
            } else if (stepState.isManualReview) {
              circleClass = 'bg-amber-600 text-white border-amber-600 ring-4 ring-amber-100';
              iconElement = <Clock className="w-5 h-5" />;
            } else if (stepState.isInProgress) {
              circleClass =
                'bg-gov-primary text-white border-gov-primary ring-4 ring-sky-100 animate-pulse';
              iconElement = <RefreshCw className="w-5 h-5 animate-spin" />;
            } else if (stepState.isFailed) {
              circleClass = 'bg-rose-600 text-white border-rose-600';
              iconElement = <XCircle className="w-5 h-5" />;
            }

            return (
              <div
                key={step.id}
                className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2 group"
              >
                {/* Step Circle */}
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${circleClass}`}
                >
                  {iconElement}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center md:justify-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{step.department}</p>

                  {/* Status Tag */}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${
                        stepState.isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : stepState.isWaiting
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                          : stepState.isManualReview
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : stepState.isInProgress
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : stepState.isFailed
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {stepState.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
