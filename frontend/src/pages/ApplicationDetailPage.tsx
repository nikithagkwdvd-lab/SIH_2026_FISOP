import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getApplicationStatus } from '../api/applicationApi';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ArrowLeft, Activity, CheckCircle2, Clock, Loader2 } from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: statusData, isLoading, isError } = useQuery({
    queryKey: ['application-status', id],
    queryFn: () => getApplicationStatus(id!),
    enabled: !!id,
    refetchInterval: 3000,
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          onClick={() => navigate('/my-applications')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Applications</span>
        </button>

        {isLoading && (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-600 font-medium">Fetching real-time verification details...</p>
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-xl p-8 text-center border border-red-200 text-red-700 text-xs">
            <p className="font-bold text-sm">Failed to retrieve application details</p>
            <p className="mt-1">Application identifier standard verify query failed.</p>
          </div>
        )}

        {!isLoading && !isError && statusData && (
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  APPLICATION TRACKING
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {statusData.application_number}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Service: <strong className="text-slate-800">{statusData.service}</strong> | Citizen: <strong className="text-slate-800">{statusData.canonical_citizen_id || statusData.citizen_id}</strong>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-bold">
                Status: {statusData.status}
              </div>
            </div>

            {/* Department Progress Overview */}
            {statusData.progress && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Federated Verification Pipeline
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-semibold">REVENUE DEPT</p>
                    <p className="font-bold text-slate-900 mt-1">{statusData.progress.revenue}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-semibold">LAND RECORDS</p>
                    <p className="font-bold text-slate-900 mt-1">{statusData.progress.land}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-semibold">SOCIAL WELFARE</p>
                    <p className="font-bold text-slate-900 mt-1">{statusData.progress.welfare}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-semibold">ELIGIBILITY</p>
                    <p className="font-bold text-slate-900 mt-1">{statusData.progress.eligibility}</p>
                  </div>
                </div>
              </div>
            )}

            {statusData.waiting_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Resilience Hold Active</p>
                  <p className="mt-0.5">{statusData.waiting_reason}</p>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
