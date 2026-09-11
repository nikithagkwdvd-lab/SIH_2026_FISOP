import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getCitizenApplications } from '../api/applicationApi';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import {
  Plus,
  Activity,
  CheckCircle2,
  FileText,
  Search,
  ArrowRight,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const MyApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const citizenId = user?.canonical_citizen_id || user?.preferred_username || 'CIT-000001';

  const { data: applications = [], isLoading, isError, error } = useQuery({
    queryKey: ['citizen-applications', citizenId],
    queryFn: () => getCitizenApplications(citizenId),
    refetchInterval: 5000,
  });

  const activeStatuses = [
    'SUBMITTED',
    'VALIDATING',
    'CONSENT_CHECK',
    'IDENTITY_RESOLUTION',
    'REVENUE_VERIFICATION',
    'LAND_VERIFICATION',
    'WELFARE_VERIFICATION',
    'ELIGIBILITY_EVALUATION',
    'WAITING_FOR_DEPARTMENT',
    'MANUAL_REVIEW',
  ];

  const activeApps = applications.filter((app) =>
    activeStatuses.includes(app.status.toUpperCase())
  );
  const historyApps = applications.filter(
    (app) => !activeStatuses.includes(app.status.toUpperCase())
  );
  const approvedApps = applications.filter(
    (app) => app.status.toUpperCase() === 'APPROVED'
  );

  const filteredActive = activeApps.filter(
    (app) =>
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = historyApps.filter(
    (app) =>
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getHumanStatus = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'SUBMITTED':
        return 'Application Submitted';
      case 'VALIDATING':
        return 'Validating Application Details';
      case 'CONSENT_CHECK':
        return 'Checking Department Consents';
      case 'IDENTITY_RESOLUTION':
        return 'Resolving Citizen Identity';
      case 'REVENUE_VERIFICATION':
        return 'Verifying Income with Revenue Dept';
      case 'LAND_VERIFICATION':
        return 'Verifying Land Records';
      case 'WELFARE_VERIFICATION':
        return 'Verifying Social Welfare Entitlements';
      case 'ELIGIBILITY_EVALUATION':
        return 'Evaluating Final Eligibility';
      case 'APPROVED':
        return 'Approved & Confirmed';
      case 'REJECTED':
        return 'Application Rejected';
      case 'WAITING_FOR_DEPARTMENT':
        return 'Verification Temporarily Waiting';
      case 'MANUAL_REVIEW':
        return 'Under Official Manual Review';
      default:
        return status;
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    const humanLabel = getHumanStatus(status);

    if (s === 'WAITING_FOR_DEPARTMENT') {
      return (
        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          {humanLabel}
        </span>
      );
    }
    if (s === 'REVENUE_VERIFICATION' || s === 'LAND_VERIFICATION' || s === 'WELFARE_VERIFICATION') {
      return (
        <span className="bg-blue-100 text-blue-900 border border-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          {humanLabel}
        </span>
      );
    }
    if (s === 'APPROVED') {
      return (
        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {humanLabel}
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
          {humanLabel}
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
        {humanLabel}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* HERO WELCOME CARD */}
        <div className="bg-[#0f3d6e] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-900/60 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-blue-900/80 text-blue-200 border border-blue-700/60 text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
              Government Services Portal (FISOP)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed mb-6">
              Manage your government service applications in one place. Your submissions are automatically verified across state departments.
            </p>

            <button
              onClick={() => navigate('/apply')}
              className="bg-white hover:bg-slate-100 text-[#0f3d6e] font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#0f3d6e]" />
              <span>Start New Application</span>
            </button>
          </div>
        </div>

        {/* DYNAMIC STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Active Applications */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ACTIVE APPLICATIONS
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {activeApps.length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Undergoing verification</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* Approved Applications */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                APPROVED APPLICATIONS
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {approvedApps.length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Eligible &amp; confirmed</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Total Applications */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                TOTAL SUBMITTED
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {applications.length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">All time applications</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#0f3d6e]/10 text-[#0f3d6e] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* SEARCH BAR (Only when applications exist) */}
        {applications.length > 0 && (
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by application number or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-900 bg-transparent border-none focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium pr-2">
              Showing {filteredActive.length + filteredHistory.length} of {applications.length} applications
            </span>
          </div>
        )}

        {/* LOADING & ERROR STATES */}
        {isLoading && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-600 font-medium">Retrieving your government applications...</p>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">Unable to load applications</p>
              <p>{(error as any)?.message || 'Please check backend connectivity.'}</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !isError && applications.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No applications yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start a new application to access government services through FISOP.
              </p>
            </div>
            <button
              onClick={() => navigate('/apply')}
              className="bg-[#0c2b4e] hover:bg-[#0b2545] text-white text-xs font-bold px-5 py-2.5 rounded-lg inline-flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Application</span>
            </button>
          </div>
        )}

        {/* ACTIVE APPLICATIONS SECTION */}
        {!isLoading && !isError && filteredActive.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Applications ({filteredActive.length})
              </h2>
            </div>

            <div className="space-y-3">
              {filteredActive.map((app) => {
                const isWaiting = app.status.toUpperCase() === 'WAITING_FOR_DEPARTMENT';
                return (
                  <div
                    key={app.id}
                    className={`bg-white rounded-xl p-5 border transition shadow-2xs hover:shadow-xs ${
                      isWaiting ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                            {app.application_number}
                          </span>
                          {renderStatusBadge(app.status)}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Service: <strong className="text-slate-800">{app.service_type}</strong></span>
                          <span>•</span>
                          <span>Submitted: {formatDate(app.created_at)}</span>
                        </div>

                        {isWaiting && (
                          <p className="text-[11px] text-amber-800 font-medium bg-amber-100/60 border border-amber-200/80 rounded-md px-3 py-1 inline-block mt-1">
                            Processing will resume automatically when department connection recovers.
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/application/${app.id}`)}
                        className="bg-[#0c2b4e] hover:bg-[#0b2545] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition self-start md:self-center shadow-xs"
                      >
                        <span>Track Application</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* APPLICATION HISTORY SECTION */}
        {!isLoading && !isError && filteredHistory.length > 0 && (
          <section className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Application History ({filteredHistory.length})
              </h2>
            </div>

            <div className="space-y-3">
              {filteredHistory.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                        {app.application_number}
                      </span>
                      {renderStatusBadge(app.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Service: <strong className="text-slate-800">{app.service_type}</strong></span>
                      <span>•</span>
                      <span>Submitted: {formatDate(app.created_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/application/${app.id}`)}
                    className="border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition self-start md:self-center"
                  >
                    <span>View Application</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
};
