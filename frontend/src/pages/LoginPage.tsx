import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { initKeycloakSSO } from '../api/authApi';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  Building2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { devLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  if (isAuthenticated) {
    if (from) {
      navigate(from, { replace: true });
    } else {
      navigate('/my-applications', { replace: true });
    }
  }

  const handleDevLogin = async (personaKey: 'citizen' | 'official' | 'admin') => {
    try {
      setLoadingPersona(personaKey);
      if (personaKey === 'citizen') {
        devLogin?.('CITIZEN', 1);
        navigate('/my-applications');
      } else if (personaKey === 'official') {
        devLogin?.('DEPARTMENT_OFFICIAL', 'REV_1');
        navigate('/official/queue');
      } else {
        devLogin?.('ADMIN');
        navigate('/official/queue');
      }
    } catch (err: any) {
      alert(`Login failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingPersona(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-between font-sans">
      
      {/* Top Header Bar */}
      <header className="bg-[#0b2545] border-t-4 border-[#d97706] py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/emblem.svg" alt="Government Seal" className="w-8 h-8 object-contain" />
            <span className="text-white font-extrabold text-lg tracking-tight">FISOP</span>
            <span className="bg-[#1e3a8a] text-blue-100 text-[11px] px-2 py-0.5 rounded font-semibold border border-blue-700/50">
              Gov of Maharashtra
            </span>
          </div>
          <span className="text-slate-300 text-xs font-medium">
            Federated Interoperability &amp; Service Orchestration Platform
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 flex flex-col md:flex-row">
          
          {/* LEFT SIDE COLUMN (Dark Navy) */}
          <div className="md:w-1/2 bg-[#0c2b4e] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              
              {/* Header Branding */}
              <div className="flex items-center gap-3 mb-8">
                <img src="/emblem.svg" alt="FISOP Seal" className="w-12 h-12 object-contain" />
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight text-white">FISOP Gateway</h3>
                  <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
                    Government of Maharashtra
                  </p>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-white mb-4 leading-tight">
                Federated Interoperability &amp; Service Orchestration
              </h2>
              <p className="text-slate-300 text-xs leading-relaxed mb-8">
                Submit a single scholarship application. Our platform automatically resolves identity, verifies income, land records, and welfare entitlements across departments in real-time.
              </p>

              {/* Feature Points */}
              <div className="space-y-4 text-xs font-medium text-slate-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero duplicate document submissions required</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Encrypted cross-department consent verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time resilience with circuit-breaker retries</span>
                </div>
              </div>

            </div>

            {/* Bottom Footer inside Left Column */}
            <div className="pt-8 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400 relative z-10 mt-8">
              <span>SIH Problem Statement 26129</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Lock className="w-3 h-3 text-amber-400" />
                Keycloak OIDC Protected
              </span>
            </div>

          </div>

          {/* RIGHT SIDE COLUMN (Authentication & Demo Access) */}
          <div className="md:w-1/2 bg-white p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in to FISOP</h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Access connected Maharashtra State Government services through Single Sign-On.
              </p>

              {/* Keycloak SSO Button */}
              <button
                onClick={initKeycloakSSO}
                className="w-full bg-[#0c2b4e] hover:bg-[#0b2545] text-white text-xs font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-md group mb-2"
              >
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                <span>Sign in with Government SSO</span>
                <ArrowRight className="w-4 h-4 text-white opacity-80" />
              </button>
              <p className="text-[10px] text-slate-400 text-center mb-6">
                Requires Keycloak Single Sign-On service running on port 8080.
              </p>

              {/* DEMO & TESTING ACCESS CONTAINER */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[11px] text-amber-900 uppercase tracking-wide">
                    ⚡ Demo &amp; Testing Access
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mb-3">
                  Choose a test persona to explore the application interfaces:
                </p>

                <div className="space-y-2.5">
                  
                  {/* Citizen Role */}
                  <div
                    onClick={() => handleDevLogin('citizen')}
                    className="bg-white border border-amber-200 hover:border-amber-400 rounded-lg p-3 flex items-center justify-between cursor-pointer transition shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                          Citizen Portal
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Apply for scholarship &amp; track verification
                        </p>
                      </div>
                    </div>
                    {loadingPersona === 'citizen' ? (
                      <Loader2 className="w-4 h-4 text-blue-900 animate-spin" />
                    ) : (
                      <span className="text-[11px] font-semibold text-blue-700 group-hover:underline flex items-center gap-1">
                        Explore Portal &rarr;
                      </span>
                    )}
                  </div>

                  {/* Official Role */}
                  <div
                    onClick={() => handleDevLogin('official')}
                    className="bg-white border border-amber-200 hover:border-amber-400 rounded-lg p-3 flex items-center justify-between cursor-pointer transition shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-900">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                          Department Official
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Review queue &amp; cross-department interop
                        </p>
                      </div>
                    </div>
                    {loadingPersona === 'official' ? (
                      <Loader2 className="w-4 h-4 text-blue-900 animate-spin" />
                    ) : (
                      <span className="text-[11px] font-semibold text-blue-700 group-hover:underline flex items-center gap-1">
                        Explore Queue &rarr;
                      </span>
                    )}
                  </div>

                  {/* Platform Admin Role */}
                  <div
                    onClick={() => handleDevLogin('admin')}
                    className="bg-white border border-amber-200 hover:border-amber-400 rounded-lg p-3 flex items-center justify-between cursor-pointer transition shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-900">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                          Platform Administrator
                        </p>
                        <p className="text-[10px] text-slate-500">
                          System health telemetry &amp; AI mappings
                        </p>
                      </div>
                    </div>
                    {loadingPersona === 'admin' ? (
                      <Loader2 className="w-4 h-4 text-blue-900 animate-spin" />
                    ) : (
                      <span className="text-[11px] font-semibold text-blue-700 group-hover:underline flex items-center gap-1">
                        Explore Admin &rarr;
                      </span>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Footer Policy Notice */}
            <p className="text-[10px] text-slate-400 text-center mt-6">
              Protected by Maharashtra State Interoperability Gateway Security Policies
            </p>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0b192c] text-slate-400 text-center text-xs py-3 border-t border-slate-800">
        FISOP v1.0.0 • Government Digital Interoperability Platform
      </footer>

    </div>
  );
};
