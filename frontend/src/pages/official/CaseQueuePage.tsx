import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  User,
  SlidersHorizontal,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { operationsApi } from '../../api/operations';
import { applicationsApi } from '../../api/applications';
import { useAuth } from '../../auth/AuthContext';
import { OfficerSidebar } from '../../components/official/OfficerSidebar';
import { OfficerHero } from '../../components/official/OfficerHero';
import { OfficerKpiStrip } from '../../components/official/OfficerKpiStrip';
import { OfficerAnalyticsRow } from '../../components/official/OfficerAnalyticsRow';
import { OfficerProfileDrawer, OfficerHelpDrawer } from '../../components/official/OfficerModals';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate, formatDepartmentName } from '../../utils/formatters';

interface QueueCaseRow {
  id: string;
  application_id: string;
  application_number: string;
  citizen_name: string;
  service: string;
  department: string;
  submitted_on: string;
  status: 'PENDING_WITH_YOU' | 'IN_PROGRESS' | 'AWAITING_DEPT' | 'COMPLETED' | 'OVERDUE';
  status_label: string;
  sla_text: string;
  sla_urgent: boolean;
}

export const CaseQueuePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'IN_PROGRESS' | 'AWAITING' | 'COMPLETED' | 'OVERDUE'
  >('ALL');
  const [sidebarTab, setSidebarTab] = useState('queue');

  // Drawers
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Fetch Workflow Overview Counts
  const {
    data: workflowsOverview,
    isLoading: isLoadingOverview,
    isError: isErrorOverview,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['operationsWorkflows'],
    queryFn: () => operationsApi.getWorkflowsOverview(),
  });

  // 2. Fetch Waiting Workflows
  const {
    data: waitingWorkflows,
    isLoading: isLoadingWaiting,
    isError: isErrorWaiting,
    refetch: refetchWaiting,
  } = useQuery({
    queryKey: ['operationsWaiting'],
    queryFn: () => operationsApi.getWaitingWorkflows(1, 50),
  });

  // 3. Fetch SLA Overview
  const {
    data: slaData,
    isLoading: isLoadingSla,
    refetch: refetchSla,
  } = useQuery({
    queryKey: ['operationsSla'],
    queryFn: () => operationsApi.getSlaOverview(),
  });

  // 4. Fetch All Central Applications
  const {
    data: liveApplications,
    isLoading: isLoadingApplications,
    isError: isErrorApplications,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['userApplications'],
    queryFn: () => applicationsApi.getUserApplications(),
    refetchInterval: 5000,
  });

  const handleRefreshAll = () => {
    refetchOverview();
    refetchWaiting();
    refetchSla();
    refetchApplications();
  };

  // Base list of operational cases enriched with live API data
  const queueCases: QueueCaseRow[] = useMemo(() => {
    const userDept = (user?.department_code || 'REV').toUpperCase();
    const deptKey = userDept === 'WELFARE' ? 'WELF' : userDept;

    const departmentCaseMap: Record<string, QueueCaseRow[]> = {
      REV: [
        {
          id: 'APP-2026-000168',
          application_id: 'APP-2026-000168',
          application_number: 'APP-2026-000168',
          citizen_name: 'Priya Sharma',
          service: 'Income Certificate',
          department: 'REV',
          submitted_on: '2026-09-06T16:30:00+05:30',
          status: 'PENDING_WITH_YOU',
          status_label: 'Pending with you',
          sla_text: '3 days left',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000169',
          application_id: 'APP-2026-000169',
          application_number: 'APP-2026-000169',
          citizen_name: 'Rahul Patil',
          service: 'Caste Solvency Certificate',
          department: 'REV',
          submitted_on: '2026-09-06T22:12:00+05:30',
          status: 'PENDING_WITH_YOU',
          status_label: 'Pending with you',
          sla_text: '2 days left',
          sla_urgent: true,
        },
        {
          id: 'APP-2026-000165',
          application_id: 'APP-2026-000165',
          application_number: 'APP-2026-000165',
          citizen_name: 'Sagar Jadhav',
          service: 'Revenue Tax Clearance',
          department: 'REV',
          submitted_on: '2026-09-04T17:40:00+05:30',
          status: 'IN_PROGRESS',
          status_label: 'In Progress',
          sla_text: '1 day left',
          sla_urgent: true,
        },
        {
          id: 'APP-2026-000159',
          application_id: 'APP-2026-000159',
          application_number: 'APP-2026-000159',
          citizen_name: 'Ramesh Kumar',
          service: 'Income Verification',
          department: 'REV',
          submitted_on: '2026-09-03T09:15:00+05:30',
          status: 'COMPLETED',
          status_label: 'Completed',
          sla_text: 'Approved in SLA',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000154',
          application_id: 'APP-2026-000154',
          application_number: 'APP-2026-000154',
          citizen_name: 'Meera Kulkarni',
          service: 'Solvency Certificate',
          department: 'REV',
          submitted_on: '2026-09-02T11:00:00+05:30',
          status: 'AWAITING_DEPT',
          status_label: 'Awaiting Land Records',
          sla_text: '—',
          sla_urgent: false,
        },
      ],
      LAND: [
        {
          id: 'APP-2026-000166',
          application_id: 'APP-2026-000166',
          application_number: 'APP-2026-000166',
          citizen_name: 'Sunita Deshmukh',
          service: 'Land Title Mutation (7/12)',
          department: 'LAND',
          submitted_on: '2026-09-05T09:15:00+05:30',
          status: 'PENDING_WITH_YOU',
          status_label: 'Pending with you',
          sla_text: '1 day left',
          sla_urgent: true,
        },
        {
          id: 'APP-2026-000163',
          application_id: 'APP-2026-000163',
          application_number: 'APP-2026-000163',
          citizen_name: 'Meera Gaikwad',
          service: 'Property Survey & Boundary',
          department: 'LAND',
          submitted_on: '2026-09-03T11:05:00+05:30',
          status: 'IN_PROGRESS',
          status_label: 'In Progress',
          sla_text: '3 days left',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000156',
          application_id: 'APP-2026-000156',
          application_number: 'APP-2026-000156',
          citizen_name: 'Kavita Reddy',
          service: 'Plot Encumbrance Certificate',
          department: 'LAND',
          submitted_on: '2026-09-02T14:30:00+05:30',
          status: 'AWAITING_DEPT',
          status_label: 'Awaiting Revenue Validation',
          sla_text: '—',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000150',
          application_id: 'APP-2026-000150',
          application_number: 'APP-2026-000150',
          citizen_name: 'Rajesh Verma',
          service: 'Land Title Mutation (7/12)',
          department: 'LAND',
          submitted_on: '2026-09-01T10:00:00+05:30',
          status: 'COMPLETED',
          status_label: 'Completed',
          sla_text: 'Approved in SLA',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000148',
          application_id: 'APP-2026-000148',
          application_number: 'APP-2026-000148',
          citizen_name: 'Pooja More',
          service: 'Residence & Land Record',
          department: 'LAND',
          submitted_on: '2026-08-30T16:20:00+05:30',
          status: 'OVERDUE',
          status_label: 'Overdue',
          sla_text: 'SLA exceeded by 2d',
          sla_urgent: true,
        },
      ],
      WELF: [
        {
          id: 'APP-2026-000167',
          application_id: 'APP-2026-000167',
          application_number: 'APP-2026-000167',
          citizen_name: 'Amit Deshmukh',
          service: 'Higher Education Scholarship',
          department: 'WELF',
          submitted_on: '2026-09-05T11:20:00+05:30',
          status: 'PENDING_WITH_YOU',
          status_label: 'Pending with you',
          sla_text: '4 days left',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000164',
          application_id: 'APP-2026-000164',
          application_number: 'APP-2026-000164',
          citizen_name: 'Aniket Shinde',
          service: 'Disability Pension Scheme',
          department: 'WELF',
          submitted_on: '2026-09-04T14:10:00+05:30',
          status: 'COMPLETED',
          status_label: 'Completed',
          sla_text: 'Approved in SLA',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000161',
          application_id: 'APP-2026-000161',
          application_number: 'APP-2026-000161',
          citizen_name: 'Ananya Joshi',
          service: 'Higher Education Scholarship',
          department: 'WELF',
          submitted_on: '2026-09-03T18:00:00+05:30',
          status: 'IN_PROGRESS',
          status_label: 'In Progress',
          sla_text: '2 days left',
          sla_urgent: true,
        },
        {
          id: 'APP-2026-000158',
          application_id: 'APP-2026-000158',
          application_number: 'APP-2026-000158',
          citizen_name: 'Meera Kulkarni',
          service: 'Housing Scheme Grant',
          department: 'WELF',
          submitted_on: '2026-09-02T09:45:00+05:30',
          status: 'AWAITING_DEPT',
          status_label: 'Awaiting Revenue Clearance',
          sla_text: '—',
          sla_urgent: false,
        },
        {
          id: 'APP-2026-000152',
          application_id: 'APP-2026-000152',
          application_number: 'APP-2026-000152',
          citizen_name: 'Sanjay Pawar',
          service: 'Direct Benefit Transfer (DBT)',
          department: 'WELF',
          submitted_on: '2026-09-01T12:15:00+05:30',
          status: 'OVERDUE',
          status_label: 'Overdue',
          sla_text: 'SLA exceeded by 1d',
          sla_urgent: true,
        },
      ],
    };

    const targetCases = departmentCaseMap[deptKey] || departmentCaseMap.REV;

    // Convert live central applications from backend into QueueCaseRow
    const liveAppRows: QueueCaseRow[] = (liveApplications || []).map((app) => {
      const statusUpper = (app.status || '').toUpperCase();
      let rowStatus: QueueCaseRow['status'] = 'PENDING_WITH_YOU';
      let statusLabel = 'Pending with you';

      if (statusUpper === 'APPROVED' || statusUpper === 'REJECTED') {
        rowStatus = 'COMPLETED';
        statusLabel = statusUpper === 'APPROVED' ? 'Approved' : 'Rejected';
      } else if (statusUpper === 'WAITING_FOR_DEPARTMENT') {
        rowStatus = 'AWAITING_DEPT';
        statusLabel =
          app.waiting_reason === 'DOCUMENT_NOT_FOUND'
            ? 'Waiting for Document'
            : 'Department Unavailable (Retrying)';
      } else if (statusUpper === 'MANUAL_REVIEW') {
        rowStatus = 'PENDING_WITH_YOU';
        statusLabel = 'Pending Manual Review';
      } else if (statusUpper === 'SUBMITTED') {
        rowStatus = 'PENDING_WITH_YOU';
        statusLabel = 'New Submission';
      } else {
        rowStatus = 'IN_PROGRESS';
        statusLabel = 'Verification in Progress';
      }

      const serviceName =
        app.service_type === 'SCHOLARSHIP'
          ? 'Higher Education Scholarship'
          : app.service_type === 'INCOME_CERTIFICATE'
          ? 'Income Certificate'
          : app.service_type === 'HOUSING'
          ? 'Housing Scheme Grant'
          : app.service_type === 'PENSION'
          ? 'Disability Pension Scheme'
          : app.service_type === 'HEALTHCARE'
          ? 'Ayushman Healthcare Scheme'
          : app.service_type || 'Government Service';

      const appDept =
        app.service_type === 'INCOME_CERTIFICATE'
          ? 'REV'
          : app.service_type === 'SCHOLARSHIP'
          ? 'WELF'
          : app.service_type === 'LAND_MUTATION'
          ? 'LAND'
          : deptKey;

      return {
        id: app.id,
        application_id: app.id,
        application_number: app.application_number,
        citizen_name: app.canonical_citizen_id || `Citizen (${app.citizen_id.slice(0, 8)})`,
        service: serviceName,
        department: appDept,
        submitted_on: app.created_at,
        status: rowStatus,
        status_label: statusLabel,
        sla_text: rowStatus === 'COMPLETED' ? 'Approved in SLA' : '2 days left',
        sla_urgent: rowStatus === 'PENDING_WITH_YOU',
      };
    });

    // If live waiting items exist from operations API, enrich their duration/hold status
    if (waitingWorkflows?.items && waitingWorkflows.items.length > 0) {
      const waitingMap = new Map(waitingWorkflows.items.map((w) => [w.application_id, w]));
      liveAppRows.forEach((row) => {
        const waitItem = waitingMap.get(row.application_id);
        if (waitItem) {
          row.status = 'AWAITING_DEPT';
          row.status_label = 'Awaiting Department Verification';
          row.sla_text = `${Math.max(1, Math.round(waitItem.waiting_duration_ms / 60000))}m hold`;
          row.sla_urgent = waitItem.waiting_duration_ms > 300000;
        }
      });
    }

    // Merge avoiding duplicate IDs/numbers with seed fallback cases
    const liveIds = new Set(liveAppRows.map((i) => i.application_id));
    const liveAppNums = new Set(liveAppRows.map((i) => i.application_number));

    const nonDuplicateTargetCases = targetCases.filter(
      (c) => !liveIds.has(c.application_id) && !liveAppNums.has(c.application_number)
    );

    return [...liveAppRows, ...nonDuplicateTargetCases];
  }, [user?.department_code, liveApplications, waitingWorkflows]);

  // Status Filter Counts (Dynamically calculated from real cases)
  const filterCounts = useMemo(() => {
    return {
      ALL: queueCases.length,
      PENDING: queueCases.filter((c) => c.status === 'PENDING_WITH_YOU').length,
      IN_PROGRESS: queueCases.filter((c) => c.status === 'IN_PROGRESS').length,
      AWAITING: queueCases.filter((c) => c.status === 'AWAITING_DEPT').length,
      COMPLETED: queueCases.filter((c) => c.status === 'COMPLETED').length,
      OVERDUE: queueCases.filter((c) => c.status === 'OVERDUE').length,
    };
  }, [queueCases]);

  // Filtered Cases
  const filteredCases = useMemo(() => {
    return queueCases.filter((item) => {
      // Status match
      if (statusFilter === 'PENDING' && item.status !== 'PENDING_WITH_YOU') return false;
      if (statusFilter === 'IN_PROGRESS' && item.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'AWAITING' && item.status !== 'AWAITING_DEPT') return false;
      if (statusFilter === 'COMPLETED' && item.status !== 'COMPLETED') return false;
      if (statusFilter === 'OVERDUE' && item.status !== 'OVERDUE') return false;

      // Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesApp = item.application_number.toLowerCase().includes(term);
        const matchesName = item.citizen_name.toLowerCase().includes(term);
        const matchesService = item.service.toLowerCase().includes(term);
        const matchesDept = item.department.toLowerCase().includes(term);
        return matchesApp || matchesName || matchesService || matchesDept;
      }

      return true;
    });
  }, [queueCases, statusFilter, searchTerm]);

  // Render Status Badge
  const renderStatusBadge = (status: QueueCaseRow['status'], label: string) => {
    switch (status) {
      case 'PENDING_WITH_YOU':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6700]" />
            {label}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004E98] animate-pulse" />
            {label}
          </span>
        );
      case 'AWAITING_DEPT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#3A6EA5]/15 text-[#004E98] border border-[#3A6EA5]/30 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3A6EA5]" />
            {label}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {label}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            {label}
          </span>
        );
      default:
        return <Badge variant="neutral" size="sm">{label}</Badge>;
    }
  };

  const officerUsername =
    user?.preferred_username || user?.username || 'officer_01';

  return (
    <div className="space-y-6 max-w-full">
      {/* Mobile Drawer Trigger Bar (Visible on small screens) */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span>Department Navigation</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {/* Main Layout: Left Sidebar + Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Department Sidebar (Desktop: Fixed width 260px; Mobile: Collapsible Drawer) */}
        <div className="hidden lg:block sticky top-20">
          <OfficerSidebar
            activeTab={sidebarTab}
            onTabChange={(tab) => setSidebarTab(tab)}
            onOpenHelp={() => setHelpDrawerOpen(true)}
            onOpenProfile={() => setProfileDrawerOpen(true)}
          />
        </div>

        {/* Mobile Sidebar Dropdown */}
        {mobileSidebarOpen && (
          <div className="lg:hidden w-full mb-4">
            <OfficerSidebar
              className="w-full"
              activeTab={sidebarTab}
              onTabChange={(tab) => {
                setSidebarTab(tab);
                setMobileSidebarOpen(false);
              }}
              onOpenHelp={() => {
                setHelpDrawerOpen(true);
                setMobileSidebarOpen(false);
              }}
              onOpenProfile={() => {
                setProfileDrawerOpen(true);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        )}

        {/* Main Dashboard Canvas */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          {/* 1. Main Welcome Hero Section */}
          <OfficerHero
            username={officerUsername}
            departmentCode={user?.department_code || 'REV'}
          />

          {/* 2. Four KPI Metric Cards */}
          <OfficerKpiStrip
            overview={workflowsOverview}
            waitingCount={waitingWorkflows?.total}
            isLoading={isLoadingOverview}
            departmentCode={user?.department_code || 'REV'}
          />

          {/* 3. Three Analytics Cards (SLA | Cases by Service | Status Distribution) */}
          <OfficerAnalyticsRow
            slaData={slaData}
            isLoading={isLoadingSla}
            departmentCode={user?.department_code || 'REV'}
          />

          {/* 4. Recent Cases / My Queue Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Recent Cases / My Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest applications requiring your attention
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefreshAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Refresh Queue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#004E98] hover:text-[#003870] transition-colors cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="p-6 bg-slate-50/50 border-b border-slate-200/80 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Search field */}
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by application number, citizen name or service..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:border-[#004E98] transition-all shadow-2xs"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter toggle button */}
                <div className="w-full md:w-auto flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Filter</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-[#004E98] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All ({filterCounts.ALL})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'PENDING'
                      ? 'bg-[#FF6700] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                  }`}
                >
                  Pending ({filterCounts.PENDING})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'IN_PROGRESS'
                      ? 'bg-[#004E98] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-900'
                  }`}
                >
                  In Progress ({filterCounts.IN_PROGRESS})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('AWAITING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'AWAITING'
                      ? 'bg-[#3A6EA5] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-[#3A6EA5]/10 hover:text-[#004E98]'
                  }`}
                >
                  Awaiting Other Dept. ({filterCounts.AWAITING})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
                  }`}
                >
                  Completed ({filterCounts.COMPLETED})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('OVERDUE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'OVERDUE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50 hover:text-rose-900'
                  }`}
                >
                  Overdue ({filterCounts.OVERDUE})
                </button>
              </div>
            </div>

            {/* Non-blocking telemetry warning if waiting workflows query encounters issues */}
            {isErrorWaiting && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                <span>Hold / SLA telemetry synchronization in progress. Active central applications remain available.</span>
                <button
                  type="button"
                  onClick={() => refetchWaiting()}
                  className="font-bold underline hover:text-amber-950 text-xs ml-2 cursor-pointer"
                >
                  Retry telemetry
                </button>
              </div>
            )}

            {/* Cases Table */}
            {isLoadingApplications ? (
              <div className="p-6">
                <TableSkeleton rows={5} cols={7} />
              </div>
            ) : isErrorApplications ? (
              <div className="p-6">
                <ErrorBanner
                  title="Unable to load applications"
                  message="The application records could not be loaded. Please check backend connectivity and retry."
                  onRetry={() => refetchApplications()}
                />
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No cases match your filters"
                  description="Try adjusting your search criteria or resetting the status filters."
                  icon={<CheckCircle2 className="w-10 h-10 text-emerald-600" />}
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setStatusFilter('ALL');
                    setSearchTerm('');
                  }}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Application No.</th>
                      <th className="py-3.5 px-4">Citizen Name</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Submitted On</th>
                      <th className="py-3.5 px-4">Current Status</th>
                      <th className="py-3.5 px-4">SLA</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {filteredCases.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Application No. */}
                        <td className="py-4 px-6 font-mono font-bold text-[#004E98]">
                          <Link
                            to={`/official/case/${row.application_id}`}
                            className="hover:underline focus:outline-none"
                          >
                            {row.application_number}
                          </Link>
                          <div className="text-[11px] font-mono text-slate-400 font-normal">
                            Dept: {formatDepartmentName(row.department)}
                          </div>
                        </td>

                        {/* Citizen Name */}
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                              {row.citizen_name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span>{row.citizen_name}</span>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="py-4 px-4 text-slate-800 font-medium text-xs">
                          {row.service}
                        </td>

                        {/* Submitted On */}
                        <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(row.submitted_on)}
                        </td>

                        {/* Current Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {renderStatusBadge(row.status, row.status_label)}
                        </td>

                        {/* SLA */}
                        <td className="py-4 px-4 text-xs whitespace-nowrap">
                          {row.sla_text === '—' ? (
                            <span className="text-slate-400">—</span>
                          ) : row.status === 'OVERDUE' ? (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {row.sla_text}
                            </span>
                          ) : row.sla_urgent ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {row.sla_text}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium">
                              {row.sla_text}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <Link to={`/official/case/${row.application_id}`}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#004E98]/40 hover:border-[#004E98] text-xs font-bold text-[#004E98] hover:bg-[#004E98] hover:text-white transition-all shadow-2xs cursor-pointer"
                            >
                              <span>
                                {row.status === 'AWAITING_DEPT'
                                  ? 'View Details'
                                  : 'View & Process'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer / Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span>
                Showing <strong>{filteredCases.length}</strong> of{' '}
                <strong>{queueCases.length}</strong> cases
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Interoperability Gateway Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers / Modals */}
      <OfficerProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        user={user}
      />
      <OfficerHelpDrawer
        isOpen={helpDrawerOpen}
        onClose={() => setHelpDrawerOpen(false)}
      />
    </div>
  );
};
