import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LogIn,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  User,
  Building2,
  Cpu,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/common/Button';
import { PORTAL_INTENT_KEY } from './AccessPage';

// ─── After OIDC callback, read portal intent & determine authorized destination
function getPostLoginDestination(
  portalIntent: string | null,
  hasRole: (role: string | string[]) => boolean,
  from?: string
): { destination: string; authorized: boolean } {
  // If ProtectedRoute stored a "from" location state (user was trying to reach a protected page), go there
  if (from && from !== '/access' && from !== '/login') {
    return { destination: from, authorized: true };
  }

  const isOfficial = hasRole(['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS']);
  const isCitizen = hasRole('CITIZEN');

  if (portalIntent === 'official') {
    if (isOfficial) return { destination: '/official/queue', authorized: true };
    // Authenticated but not an official — show unauthorized
    return { destination: '/access', authorized: false };
  }

  if (portalIntent === 'citizen') {
    if (isCitizen || isOfficial) return { destination: '/my-applications', authorized: true };
    return { destination: '/access', authorized: false };
  }

  // No explicit intent — route by actual role
  if (isOfficial) return { destination: '/official/queue', authorized: true };
  if (isCitizen) return { destination: '/my-applications', authorized: true };
  return { destination: '/access', authorized: false };
}

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, login, hasRole, isLoading, devLogin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const requestedRole = searchParams.get('role')?.toLowerCase();

  const [activeTab, setActiveTab] = useState<'citizen' | 'official' | 'admin'>(
    requestedRole === 'official'
      ? 'official'
      : requestedRole === 'admin'
      ? 'admin'
      : 'citizen'
  );

  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [unauthorizedPortal, setUnauthorizedPortal] = useState<string>('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  // ─── Post-authentication routing ────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Read portal intent from sessionStorage (ephemeral nav state, not auth state)
    const portalIntent = sessionStorage.getItem(PORTAL_INTENT_KEY);
    const { destination, authorized } = getPostLoginDestination(portalIntent, hasRole, from);

    if (authorized) {
      // Clear portal intent after consuming it
      sessionStorage.removeItem(PORTAL_INTENT_KEY);
      navigate(destination, { replace: true });
    } else {
      // Authenticated but unauthorized for the selected portal — show clear message
      sessionStorage.removeItem(PORTAL_INTENT_KEY);
      setIsUnauthorized(true);
      setUnauthorizedPortal(portalIntent || '');
    }
  }, [isAuthenticated, user, hasRole, navigate, from]);

  const showDevHint = import.meta.env.DEV;

  const [keycloakError, setKeycloakError] = useState<string | null>(null);
  const [isCheckingKeycloak, setIsCheckingKeycloak] = useState(false);

  const handleKeycloakLogin = async () => {
    setKeycloakError(null);
    setIsCheckingKeycloak(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      await fetch(import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080', {
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Store tab selection as portal intent before OIDC redirect
      sessionStorage.setItem(PORTAL_INTENT_KEY, activeTab === 'admin' ? 'official' : activeTab);

      await login();
    } catch {
      setIsCheckingKeycloak(false);
      setKeycloakError(
        'Keycloak server on port 8080 is not currently active. In development mode, please use the Quick Test Login below.'
      );
    }
  };

  const getRoleContext = () => {
    switch (activeTab) {
      case 'citizen':
        return {
          title: 'Citizen Sign In',
          subtitle: 'Sign in to access government services and track your applications.',
          devPersona: 'CITIZEN' as const,
          devId: 'dev-login-citizen',
          devName: '👤 Citizen Portal (CIT-000001)',
          devDesc: 'Apply for schemes, grant consent, view live status',
        };
      case 'official':
        return {
          title: 'Official Sign In',
          subtitle: 'Sign in to access departmental and operational tools.',
          devPersona: 'DEPARTMENT_OFFICIAL' as const,
          devId: 'dev-login-official',
          devName: '🏛 Department Official (REV-OFFICER-01)',
          devDesc: 'Review case queue, inspect cross-dept payloads, approve claims',
        };
      case 'admin':
        return {
          title: 'Administrator Sign In',
          subtitle: 'Sign in to access AI schema governance, canonical registries, and telemetry.',
          devPersona: 'ADMIN' as const,
          devId: 'dev-login-admin',
          devName: '⚙️ Platform Administrator (ADMIN-ROOT)',
          devDesc: 'AI mapping reviews, schema management, SLA analytics',
        };
    }
  };

  const roleInfo = getRoleContext();

  // ─── Unauthorized state after authentication ─────────────────────────────
  if (isUnauthorized && isAuthenticated) {
    const portalLabel = unauthorizedPortal === 'citizen' ? 'Citizen Portal' : 'Official Portal';
    return (
      <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-xl p-8 space-y-5">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{t('auth.unauthorized')}</h1>
            <p className="text-sm text-slate-600">{t('auth.unauthorizedDetail')}</p>
            {unauthorizedPortal && (
              <p className="text-xs text-slate-400">
                Attempted portal: <span className="font-semibold text-slate-600">{portalLabel}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link
              to="/access"
              className="w-full flex items-center justify-center gap-2 bg-[#004E98] hover:bg-[#003870] text-white py-3 px-6 rounded-xl font-bold text-sm transition-all shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('access.backToAccess')}
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsUnauthorized(false);
                // Logout is handled by useAuth — this clears state and redirects via Keycloak
                window.location.href = '/';
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-semibold text-sm transition-all border border-slate-200"
            >
              {t('auth.signOut')}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Backend RBAC policies remain enforced regardless of portal selection.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main SSO login view ─────────────────────────────────────────────────
  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-6">
      {/* Back to access */}
      <div className="w-full max-w-4xl mx-auto mb-4 px-2">
        <Link
          to="/access"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004E98] hover:text-[#003870] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('access.backToAccess', 'Return to Access')}</span>
        </Link>
      </div>

      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Left: Branding */}
        <div className="bg-gradient-to-b from-[#004E98] via-[#003870] to-[#002244] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6700]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/emblem.svg" alt="Government Emblem" className="w-12 h-12" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">FISOP Gateway</h1>
                <p className="text-xs text-slate-200">Government of Maharashtra</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-2xl font-extrabold leading-tight text-white">
                Federated Interoperability &amp; Service Orchestration
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                One unified platform connecting citizens with Revenue, Land Records, and Social Welfare
                authorities through secure, consent-driven APIs.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero duplicate document submissions required</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted cross-department consent verification</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time resilience with circuit-breaker retries</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/20 flex items-center justify-between text-xs text-slate-300">
            <span>SIH Problem Statement 26129</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-300" />
              Keycloak OIDC Protected
            </span>
          </div>
        </div>

        {/* Right: Auth actions */}
        <div className="p-8 flex flex-col justify-center space-y-5 bg-white">
          {/* Role tab bar */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('citizen')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'citizen'
                  ? 'bg-white text-[#004E98] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('official')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'official'
                  ? 'bg-white text-[#004E98] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Official</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-[#004E98] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">{roleInfo.title}</h2>
            <p className="text-xs text-slate-600">{roleInfo.subtitle}</p>
          </div>

          {keycloakError && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <span>ℹ️ Keycloak SSO Offline</span>
              </div>
              <p className="text-[11px] leading-relaxed">{keycloakError}</p>
            </div>
          )}

          {/* Primary Keycloak SSO */}
          <div className="space-y-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={handleKeycloakLogin}
              isLoading={isLoading || isCheckingKeycloak}
              className="w-full text-sm py-3 font-bold bg-[#004E98] hover:bg-[#003870]"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign in with Keycloak SSO
            </Button>
            <p className="text-[11px] text-slate-500 text-center">
              Requires Keycloak running on port 8080.
            </p>
          </div>

          {/* Dev-only quick-login */}
          {showDevHint && (
            <div className="pt-2 border-t border-slate-200">
              <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6700]">
                    <UserCheck className="w-4 h-4" />
                    <span>Quick Test Login (Local Dev)</span>
                  </div>
                  <span className="text-[10px] bg-white border border-orange-200 text-[#FF6700] font-bold px-1.5 py-0.5 rounded">
                    One-Click
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mb-2.5">
                  Click below to issue a signed test token from the backend and enter the{' '}
                  <strong>{activeTab}</strong> portal immediately:
                </p>

                <button
                  type="button"
                  id={roleInfo.devId}
                  onClick={() => {
                    sessionStorage.setItem(
                      PORTAL_INTENT_KEY,
                      activeTab === 'admin' ? 'official' : activeTab
                    );
                    devLogin?.(roleInfo.devPersona);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium bg-white hover:bg-[#FF6700]/10 border border-[#FF6700]/40 hover:border-[#FF6700] rounded-lg transition-all text-left shadow-sm group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-[#004E98]">
                      {roleInfo.devName}
                    </div>
                    <div className="text-[10px] text-slate-500">{roleInfo.devDesc}</div>
                  </div>
                  <span className="text-[#FF6700] font-bold text-xs shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                    Enter Portal →
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              Protected by Maharashtra State Interoperability Gateway Security Policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
