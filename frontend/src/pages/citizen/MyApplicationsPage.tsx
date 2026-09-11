import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  PlusCircle,
  Clock,
  ArrowRight,
  Search,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sparkles,
  User,
  ShieldCheck,
  Bell,
  HelpCircle,
  LogOut,
  RefreshCw,
  Shield,
  Activity,
  Phone,
  Mail,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Menu,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { TableSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { GatewayOfIndiaIllustration } from '../../components/citizen/GatewayOfIndiaIllustration';
import { formatDate, formatStatusLabel } from '../../utils/formatters';

export const MyApplicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, devLogin } = useAuth();

  // Dynamic citizen identity resolution for all 15 demo citizens (CIT-000001 to CIT-000015)
  const citizenId = user?.canonical_citizen_id || (
    user?.preferred_username?.startsWith('CIT-') ? user.preferred_username : (
      user?.username?.startsWith('citizen_') ? `CIT-${String(parseInt(user.username.split('_')[1], 10)).padStart(6, '0')}` : 'CIT-000001'
    )
  );

  const displayName = user?.preferred_username || user?.username || citizenId;


  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Interactive Drawers & Modals
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  // Active navigation indicator in sidebar
  const [activeNav, setActiveNav] = useState<'dashboard' | 'myApps'>('dashboard');

  // Fetch live applications for the authenticated citizen
  const {
    data: applications,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['citizenApplications', citizenId],
    queryFn: () => applicationsApi.getCitizenApplications(citizenId),
    enabled: Boolean(citizenId),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const queryClient = useQueryClient();

  // Fetch real database-backed notifications for authenticated citizen
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => applicationsApi.getNotifications(),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (notifId: string) => applicationsApi.markNotificationRead(notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadNotifsCount = notificationsData?.unread_count || 0;
  const notificationsList = notificationsData?.notifications || [];

  const getBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'COMPLETED':
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

  // Safe client-side metrics calculated directly from authenticated applications data
  const totalApps = applications?.length || 0;
  const inProgressApps = (applications || []).filter(
    (app) =>
      !['APPROVED', 'COMPLETED', 'REJECTED', 'FAILED'].includes(app.status.toUpperCase())
  ).length;
  const waitingApps = (applications || []).filter(
    (app) => ['WAITING_FOR_DEPARTMENT', 'MANUAL_REVIEW'].includes(app.status.toUpperCase())
  ).length;
  const completedApps = (applications || []).filter(
    (app) => ['APPROVED', 'COMPLETED'].includes(app.status.toUpperCase())
  ).length;

  // Filtered applications list
  const filteredApps = (applications || []).filter((app) => {
    const matchesStatus =
      filterStatus === 'ALL' || app.status.toUpperCase() === filterStatus.toUpperCase();
    const matchesSearch =
      !searchTerm ||
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Workflow progress helper for individual application card
  const getWorkflowSteps = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED') {
      return [
        { label: 'Submitted', state: 'done' },
        { label: 'Verification', state: 'done' },
        { label: 'Department Processing', state: 'done' },
        { label: 'Completed', state: 'done' },
      ];
    }
    if (s === 'REJECTED' || s === 'FAILED') {
      return [
        { label: 'Submitted', state: 'done' },
        { label: 'Verification', state: 'done' },
        { label: 'Department Processing', state: 'rejected' },
        { label: 'Rejected', state: 'rejected' },
      ];
    }
    if (s === 'WAITING_FOR_DEPARTMENT') {
      return [
        { label: 'Submitted', state: 'done' },
        { label: 'Verification', state: 'done' },
        { label: 'Department Processing', state: 'waiting' },
        { label: 'Completed', state: 'todo' },
      ];
    }
    if (s === 'MANUAL_REVIEW' || s === 'LAND_VERIFICATION' || s === 'REVENUE_VERIFICATION') {
      return [
        { label: 'Submitted', state: 'done' },
        { label: 'Verification', state: 'active' },
        { label: 'Department Processing', state: 'todo' },
        { label: 'Completed', state: 'todo' },
      ];
    }
    return [
      { label: 'Submitted', state: 'done' },
      { label: 'Verification', state: 'active' },
      { label: 'Department Processing', state: 'todo' },
      { label: 'Completed', state: 'todo' },
    ];
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      {/* ─── MOBILE SIDEBAR TOGGLE BAR (Visible only on small screens) ──────── */}
      <div className="lg:hidden w-full flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#004E98] text-white flex items-center justify-center font-bold text-xs">
            CP
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Citizen Portal Navigation
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </div>

      {/* ─── LEFT CITIZEN SIDEBAR (Desktop) ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex-col justify-between shrink-0 sticky top-22">
        <div className="space-y-5">
          {/* Sidebar Header */}
          <div className="pb-3 border-b border-slate-100">
            <span className="text-[11px] font-black text-[#004E98] tracking-widest uppercase block">
              Citizen Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">Maharashtra State Gateway</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Citizen portal navigation">
            <button
              type="button"
              onClick={() => {
                setActiveNav('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-[#004E98] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity
                  className={`w-4 h-4 ${
                    activeNav === 'dashboard' ? 'text-[#FF6700]' : 'text-slate-400'
                  }`}
                />
                <span>{t('dashboard.navDashboard', 'Dashboard')}</span>
              </div>
              {activeNav === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveNav('myApps');
                const el = document.getElementById('my-applications-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'myApps'
                  ? 'bg-[#004E98] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  className={`w-4 h-4 ${
                    activeNav === 'myApps' ? 'text-[#FF6700]' : 'text-slate-400'
                  }`}
                />
                <span>{t('dashboard.navMyApps', 'My Applications')}</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeNav === 'myApps'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {totalApps}
              </span>
            </button>

            <Link
              to="/apply"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>{t('dashboard.navApply', 'Apply for Service')}</span>
            </Link>

            <Link
              to="/services"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Compass className="w-4 h-4 text-sky-600" />
              <span>{t('dashboard.navServices', 'Browse Services')}</span>
            </Link>

            <button
              type="button"
              onClick={() => setNotifModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>{t('dashboard.navNotifications', 'Notifications')}</span>
              </div>
              {unreadNotifsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#FF6700] text-white text-[10px] font-bold">
                  {unreadNotifsCount}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setProfileDrawerOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[#004E98]" />
              <span>{t('dashboard.navProfile', 'My Profile')}</span>
            </button>

            {/* Divider */}
            <div className="pt-2 pb-1">
              <div className="h-px bg-slate-100" />
            </div>

            <button
              type="button"
              onClick={() => setHelpDrawerOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>{t('dashboard.navHelp', 'Help & Support')}</span>
            </button>
          </nav>
        </div>

        {/* Verified Citizen Panel (At the bottom of sidebar) */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-b from-[#001733] to-[#002B5B] text-white space-y-2 border border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verified Citizen</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Protected by Maharashtra State Interoperability Policies.
          </p>
          <div className="pt-2 text-[11px] text-slate-200 border-t border-white/10 flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Citizen ID:</span>
            <span className="font-mono font-bold text-[#FF9933]">{citizenId}</span>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE NAVIGATION DRAWER (Overlay) ─────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative bg-white w-72 max-w-full p-6 space-y-6 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <img src="/emblem.svg" alt="Emblem" className="w-6 h-6 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">FISOP Citizen Portal</span>
                    <span className="text-[10px] text-slate-500">Govt. of Maharashtra</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setActiveNav('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#004E98] text-white"
                >
                  <Activity className="w-4 h-4 text-[#FF6700]" />
                  <span>{t('dashboard.navDashboard', 'Dashboard')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setActiveNav('myApps');
                    const el = document.getElementById('my-applications-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{t('dashboard.navMyApps', 'My Applications')}</span>
                </button>

                <Link
                  to="/apply"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>{t('dashboard.navApply', 'Apply for Service')}</span>
                </Link>

                <Link
                  to="/services"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>{t('dashboard.navServices', 'Browse Services')}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setNotifModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>{t('dashboard.navNotifications', 'Notifications')}</span>
                  </div>
                  {unreadNotifsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF6700] text-white text-[10px] font-bold">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setProfileDrawerOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{t('dashboard.navProfile', 'My Profile')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setHelpDrawerOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>{t('dashboard.navHelp', 'Help & Support')}</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="text-xs text-slate-600">
                Signed in as <strong className="text-slate-900">{displayName}</strong>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('auth.signOut', 'Sign Out')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN DASHBOARD CONTENT (Right Column) ──────────────────────────── */}
      <div className="flex-1 w-full space-y-6 min-w-0">
        {/* 1. WELCOME HERO (Light Government Service Banner with Gateway of India) */}
        <section
          className="bg-gradient-to-r from-white via-sky-50/50 to-blue-50/30 rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
          aria-label="Welcome banner"
        >
          {/* Subtle state watermark background accent */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#004E98]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Left Hero Content */}
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#004E98]/10 text-[#004E98] text-xs font-bold uppercase tracking-wider border border-[#004E98]/15">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6700]" />
              <span>{t('dashboard.heroMotto', 'One Gateway. Many Government Services.')}</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t('dashboard.welcomeBack', 'Welcome back')}, {displayName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                {t('dashboard.heroSubtitle', 'Access government services, track your applications, and manage everything in one place.')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/apply">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-[#004E98] hover:bg-[#003870] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  leftIcon={<PlusCircle className="w-4 h-4 text-[#FF6700]" />}
                >
                  {t('dashboard.newApplication', 'New Application')}
                </Button>
              </Link>

              <Link to="/services">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  leftIcon={<Compass className="w-4 h-4 text-sky-600" />}
                >
                  {t('dashboard.browseServices', 'Browse Services')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Hero Illustration: Gateway of India in Mumbai (Right 30–35%) */}
          <div className="w-full md:w-72 lg:w-80 shrink-0 z-10 flex items-center justify-center">
            <GatewayOfIndiaIllustration className="w-full max-w-xs" />
          </div>
        </section>

        {/* 2. LIVE METRIC CARDS (Computed from API Data) */}
        <section aria-label="Application statistics" className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Applications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('dashboard.totalSubmissions', 'Total Applications')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#004E98] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 mt-3">
              {isLoading ? '—' : totalApps}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {t('dashboard.totalSubmissionsSubtitle', 'Registered in FISOP')}
            </span>
          </div>

          {/* 2. In Progress */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('dashboard.inProgress', 'In Progress')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#004E98] mt-3">
              {isLoading ? '—' : inProgressApps}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {t('dashboard.inProgressSubtitle', 'Active department reviews')}
            </span>
          </div>

          {/* 3. Waiting for Department */}
          <div
            className={`p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all ${
              waitingApps > 0
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  waitingApps > 0 ? 'text-amber-900' : 'text-slate-500'
                }`}
              >
                {t('dashboard.waitingOnDept', 'Waiting for Dept')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p
              className={`text-3xl font-black mt-3 ${
                waitingApps > 0 ? 'text-amber-900' : 'text-slate-900'
              }`}
            >
              {isLoading ? '—' : waitingApps}
            </p>
            <span
              className={`text-[11px] mt-1 block ${
                waitingApps > 0 ? 'text-amber-800' : 'text-slate-400'
              }`}
            >
              {t('dashboard.waitingOnDeptSubtitle', 'Automatic retries active')}
            </span>
          </div>

          {/* 4. Approved / Completed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t('dashboard.completed', 'Approved / Completed')}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-700 mt-3">
              {isLoading ? '—' : completedApps}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              {t('dashboard.completedSubtitle', 'Successfully processed')}
            </span>
          </div>
        </section>

        {/* 3. QUICK ACTIONS */}
        <section aria-label="Quick actions" className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {t('dashboard.quickActionsTitle', 'Quick Actions')}
            </h2>
            <span className="text-[11px] text-slate-400">
              {t('dashboard.quickActionsSubtitle', 'Direct Portal Shortcuts')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. New Application */}
            <Link
              to="/apply"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200/80 hover:border-[#FF6700]/50 transition-all flex items-center gap-3.5 group cursor-pointer shadow-2xs"
            >
              <div className="w-11 h-11 rounded-xl bg-[#FF6700]/10 text-[#FF6700] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#004E98] transition-colors">
                  {t('dashboard.newApplication', 'New Application')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t('dashboard.newAppDesc', 'Submit a new request')}
                </div>
              </div>
            </Link>

            {/* 2. Browse Services */}
            <Link
              to="/services"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-[#004E98]/50 transition-all flex items-center gap-3.5 group cursor-pointer shadow-2xs"
            >
              <div className="w-11 h-11 rounded-xl bg-[#004E98]/10 text-[#004E98] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#004E98] transition-colors">
                  {t('dashboard.browseServices', 'Browse Services')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t('dashboard.browseDesc', 'Explore government services')}
                </div>
              </div>
            </Link>

            {/* 3. Track Application */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('my-applications-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-400/50 transition-all flex items-center gap-3.5 group text-left cursor-pointer shadow-2xs"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#004E98] transition-colors">
                  {t('dashboard.trackApplication', 'Track Application')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t('dashboard.trackDesc', 'Search and check status')}
                </div>
              </div>
            </button>

            {/* 4. View Verified Identity */}
            <button
              type="button"
              onClick={() => setProfileDrawerOpen(true)}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-400/50 transition-all flex items-center gap-3.5 group text-left cursor-pointer shadow-2xs"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#004E98] transition-colors">
                  {t('dashboard.profileDrawerTitle', 'View Verified Identity')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {t('dashboard.viewProfileDesc', 'View your verified records')}
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* 4. MY APPLICATIONS & ANNOUNCEMENTS SECTION (Desktop Grid) */}
        <div id="my-applications-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Column: My Applications List (Col span 8 on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              {/* Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {t('dashboard.myApplications', 'My Applications')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('dashboard.subtitle', 'Track real-time progress and cross-department verification for your submissions.')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    title="Refresh applications"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#004E98]' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('dashboard.searchPlaceholder', 'Search by application number or service...')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004E98] focus:bg-white transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: 'ALL', label: t('dashboard.filterAll', 'All') },
                    { key: 'SUBMITTED', label: t('dashboard.filterSubmitted', 'Submitted') },
                    { key: 'IN_PROGRESS', label: t('dashboard.filterInProgress', 'In Progress') },
                    { key: 'WAITING_FOR_DEPARTMENT', label: t('dashboard.filterWaiting', 'Waiting / Retrying') },
                    { key: 'APPROVED', label: t('dashboard.filterApproved', 'Approved') },
                    { key: 'REJECTED', label: t('dashboard.filterRejected', 'Rejected') },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilterStatus(item.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        filterStatus === item.key
                          ? 'bg-[#004E98] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Application Records List / Loading / Error / Empty states */}
              {isLoading ? (
                <div className="py-4">
                  <TableSkeleton rows={3} cols={4} />
                </div>
              ) : isError ? (
                <div className="py-2 space-y-3">
                  <ErrorBanner
                    title="Could not load your applications"
                    message={
                      error instanceof Error
                        ? error.message
                        : 'Failed to communicate with government applications registry.'
                    }
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="px-4 py-2 bg-[#004E98] hover:bg-[#003870] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Request</span>
                    </button>
                  </div>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="py-6">
                  <EmptyState
                    title={
                      searchTerm || filterStatus !== 'ALL'
                        ? 'No applications match your filter'
                        : 'No applications yet'
                    }
                    description={
                      searchTerm || filterStatus !== 'ALL'
                        ? 'Try adjusting your search criteria or resetting filters.'
                        : 'Submit your first government service application through the single window portal.'
                    }
                    icon={<FileText className="w-8 h-8 text-slate-400" />}
                    actionLabel={
                      searchTerm || filterStatus !== 'ALL' ? 'Reset Filters' : 'New Application'
                    }
                    onAction={() => {
                      if (searchTerm || filterStatus !== 'ALL') {
                        setSearchTerm('');
                        setFilterStatus('ALL');
                      } else {
                        navigate('/apply');
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {filteredApps.map((app) => {
                    const steps = getWorkflowSteps(app.status);
                    return (
                      <div
                        key={app.id}
                        className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/90 p-5 transition-all shadow-2xs hover:shadow-md hover:border-[#004E98]/40 space-y-4 group"
                      >
                        {/* Top Card Line: App Number + Status Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-tight">
                              {app.application_number}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                              ID: {app.canonical_citizen_id || citizenId}
                            </span>
                            {app.parent_application_id && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                Reapplication
                              </span>
                            )}
                          </div>

                          <Badge variant={getBadgeVariant(app.status)} size="sm" dot>
                            {app.status === 'WAITING_FOR_DEPARTMENT'
                              ? 'Waiting for department response'
                              : formatStatusLabel(app.status)}
                          </Badge>
                        </div>

                        {/* Middle Info Details */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Service: <strong className="text-slate-900">{app.service_type}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Submitted: {formatDate(app.created_at)}</span>
                          </div>

                          {app.decision_by && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <span>Decision by: <strong className="text-slate-700">{app.decision_by}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Rejection Snippet */}
                        {app.status === 'REJECTED' && app.rejection_reason && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-red-700 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>Rejection Reason:</span>
                            </div>
                            <p className="text-slate-800 text-xs leading-relaxed font-medium">
                              {app.rejection_reason}
                            </p>
                          </div>
                        )}

                        {/* Visual Workflow Progress Bar (Multi-step) */}
                        <div className="pt-2 border-t border-slate-200/60">
                          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold">
                            {steps.map((step, idx) => (
                              <div key={idx} className="flex flex-col items-center space-y-1">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    step.state === 'done'
                                      ? 'bg-emerald-600 text-white'
                                      : step.state === 'active'
                                      ? 'bg-[#004E98] text-white animate-pulse'
                                      : step.state === 'waiting'
                                      ? 'bg-amber-500 text-white'
                                      : step.state === 'rejected'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}
                                >
                                  {step.state === 'done' ? (
                                    '✓'
                                  ) : step.state === 'active' ? (
                                    '●'
                                  ) : step.state === 'waiting' ? (
                                    '!'
                                  ) : step.state === 'rejected' ? (
                                    '✕'
                                  ) : (
                                    '○'
                                  )}
                                </div>
                                <span
                                  className={`truncate w-full ${
                                    step.state === 'done'
                                      ? 'text-emerald-700'
                                      : step.state === 'active'
                                      ? 'text-[#004E98] font-bold'
                                      : step.state === 'waiting'
                                      ? 'text-amber-800 font-bold'
                                      : step.state === 'rejected'
                                      ? 'text-red-700 font-bold'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Bottom CTA Buttons */}
                        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                          {app.status === 'REJECTED' && (
                            <Link to={`/applications/${app.id}/reapply`}>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6700] hover:bg-[#e55c00] transition-all cursor-pointer shadow-xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Review & Reapply</span>
                              </button>
                            </Link>
                          )}

                          <Link to={`/applications/${app.id}/status`}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#004E98] hover:text-white bg-blue-50 hover:bg-[#004E98] transition-all cursor-pointer border border-[#004E98]/20"
                            >
                              <span>Track Application</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Announcements & Help Support (Col span 4 on desktop) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Announcements Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-[#004E98] uppercase tracking-wider pb-2 border-b border-slate-100">
                <Activity className="w-4 h-4 text-[#FF6700]" />
                <span>Announcements</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>New Services Added</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    More citizen services are now available on FISOP across Revenue and Land Records.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Scheduled Maintenance</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Portal maintenance notifications and scheduled sync windows will appear here.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6700]" />
                    <span>Help Center Updated</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    New step-by-step guides for scholarship and property verification are now online.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Need Help / Support Card */}
            <div className="bg-gradient-to-b from-[#002244] to-[#001733] text-white p-5 rounded-3xl border border-slate-800 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FF9933] uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" />
                  <span>Need Help?</span>
                </div>
                <span className="text-[10px] text-slate-400">24x7 Citizen Support</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Toll-Free Helpline</div>
                    <div className="font-bold text-white font-mono">1800-123-4567</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Support Email</div>
                    <div className="font-bold text-white font-mono">support@fisop.gov.in</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHelpDrawerOpen(true)}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Help Center &amp; FAQs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: CITIZEN PROFILE DRAWER ─────────────────────────────────── */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setProfileDrawerOpen(false)}
          />
          <div className="relative bg-white w-96 max-w-full h-full p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Citizen Profile
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Authenticated government identity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Verified Identity Badge */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">Verified Citizen Identity</div>
                    <div className="text-[11px] text-emerald-800">
                      Keycloak Single Sign-On Authenticated
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Username
                    </span>
                    <div className="font-bold text-slate-900 text-sm font-mono">
                      {displayName}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Canonical Citizen ID
                    </span>
                    <div className="font-mono font-bold text-[#004E98] text-sm">
                      {citizenId}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Assigned Role
                    </span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Citizen</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Status
                    </span>
                    <div className="font-semibold text-emerald-700">Verified</div>
                  </div>
                </div>

                {/* Verified Department Mappings */}
                <div className="pt-2 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Interoperability Department Mappings
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-xl border border-slate-200 flex justify-between items-center bg-slate-50">
                      <span className="text-slate-600">Revenue Dept</span>
                      <span className="font-mono font-bold text-slate-900">REV-000001</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 flex justify-between items-center bg-slate-50">
                      <span className="text-slate-600">Land Records</span>
                      <span className="font-mono font-bold text-slate-900">LAND-000001</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 flex justify-between items-center bg-slate-50">
                      <span className="text-slate-600">Social Welfare</span>
                      <span className="font-mono font-bold text-slate-900">WEL-000001</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProfileDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: HELP & SUPPORT DRAWER ─────────────────────────────────── */}
      {helpDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setHelpDrawerOpen(false)}
          />
          <div className="relative bg-white w-96 max-w-full h-full p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Help &amp; Guidance Support
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Frequently asked questions &amp; contact support
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900">
                    How do I track my submitted application?
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Click the &apos;Track Application&apos; button on any application card to view live departmental verification progress and audit logs.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900">
                    What does &apos;Waiting for Department&apos; mean?
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    It indicates the platform is waiting for an automated response from a connected system. FISOP automatically schedules retries.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900">
                    Do I need to submit physical paper documents?
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    No! FISOP uses consent-based digital data exchange directly between government databases with zero duplicate submissions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1.5">
                  <div className="font-bold text-xs">
                    State e-Governance Helpline
                  </div>
                  <div className="text-[11px] text-blue-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Toll Free: 1800-123-4567</span>
                  </div>
                  <div className="text-[11px] text-blue-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email: support@fisop.gov.in</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHelpDrawerOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Support
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: NOTIFICATIONS MODAL ───────────────────────────────────── */}
      {notifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setNotifModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#FF6700]" />
                <h3 className="font-black text-sm text-slate-900">Notifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setNotifModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
              {notificationsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-xs">No Notifications Yet</p>
                  <p className="text-[11px] text-slate-400">
                    Department decisions, consent confirmations, and workflow updates will appear here in real time.
                  </p>
                </div>
              ) : (
                notificationsList.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) {
                        markReadMutation.mutate(notif.id);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border transition-all space-y-1.5 cursor-pointer ${
                      notif.is_read
                        ? 'bg-slate-50/60 border-slate-200/80 text-slate-600'
                        : 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-2xs ring-1 ring-blue-300/50'
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <div className="flex items-center gap-2">
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#004E98] shrink-0" />
                        )}
                        <span className={notif.is_read ? 'text-slate-700' : 'text-[#004E98] font-black'}>
                          {notif.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {formatDate(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-700">
                      {notif.message}
                    </p>

                    {notif.application_id && (
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <Link
                          to={`/applications/${notif.application_id}/status`}
                          onClick={() => setNotifModalOpen(false)}
                          className="font-bold text-[#004E98] hover:underline flex items-center gap-1"
                        >
                          <span>View Case Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        {!notif.is_read && (
                          <span className="text-[10px] text-slate-400">Click to mark read</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                {unreadNotifsCount} unread notification{unreadNotifsCount === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setNotifModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
