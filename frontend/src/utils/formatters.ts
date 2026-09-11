/**
 * Formatters for plain-language status copy, currency, dates, and numbers.
 */

export function formatStatusLabel(status: string | undefined | null, waitingReason?: string | null): string {
  if (!status) return 'Unknown status';
  const s = status.toUpperCase();
  if (s === 'WAITING_FOR_DEPARTMENT') {
    if (waitingReason === 'DOCUMENT_NOT_FOUND') {
      return 'Waiting for Document';
    }
    return 'Waiting on department verification';
  }
  switch (s) {
    case 'SUBMITTED':
      return 'Application submitted';
    case 'VALIDATING':
      return 'Validating requirements';
    case 'CONSENT_CHECK':
      return 'Verifying citizen consents';
    case 'IDENTITY_RESOLUTION':
      return 'Resolving cross-department identity';
    case 'REVENUE_VERIFICATION':
      return 'Verifying income with Revenue';
    case 'LAND_VERIFICATION':
      return 'Verifying land & property records';
    case 'WELFARE_VERIFICATION':
      return 'Verifying welfare scheme status';
    case 'ELIGIBILITY_EVALUATION':
      return 'Evaluating unified eligibility';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    case 'WAITING_FOR_DEPARTMENT':
      return 'Waiting on department verification';
    case 'MANUAL_REVIEW':
      return 'Manual review required';
    case 'FAILED':
      return 'Processing failed';
    case 'COMPLETED':
      return 'Completed';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'PENDING':
      return 'Pending';
    case 'WAITING':
      return 'Waiting / retrying';
    default:
      // Convert SNAKE_CASE to Sentence case
      return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}

export function formatDepartmentName(codeOrName: string | undefined | null): string {
  if (!codeOrName) return 'Department';
  const c = codeOrName.toUpperCase();
  switch (c) {
    case 'REV':
    case 'REVENUE':
      return 'Revenue & Income Tax';
    case 'LAND':
    case 'PROPERTY':
      return 'Land Records & Registration';
    case 'WEL':
    case 'WELFARE':
      return 'Social Welfare & Empowerment';
    case 'EDU':
    case 'EDUCATION':
      return 'Higher & Technical Education';
    case 'HOU':
    case 'HOUSING':
      return 'Housing & Urban Development';
    default:
      return codeOrName;
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Not recorded';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)} s`;
  const min = Math.floor(sec / 60);
  const remSec = Math.round(sec % 60);
  return `${min}m ${remSec}s`;
}
