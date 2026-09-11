import React, { useState, useEffect, useRef } from 'react';
import type { TFunction } from 'i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  Shield,
  FileCheck2,
  Layers,
  Wrench,
  Phone,
  Fingerprint,
  ExternalLink,
  RefreshCw,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuth } from '../../auth/AuthContext';
import { CitizenAuthMethod } from '../../types/auth';

// ─── Portal intent key (session-scoped, non-auth, navigation-only) ────────────
export const PORTAL_INTENT_KEY = 'fisop_portal_intent';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'mr', label: 'मराठी', short: 'म' },
];

type CitizenStep =
  | 'choose_method'
  | 'mobile_input'
  | 'mobile_otp'
  | 'aadhaar_input'
  | 'aadhaar_otp'
  | 'digilocker';

export const AccessPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, hasRole, user, login, logout, devLogin, citizenLogin, sendCitizenOtp, verifyCitizenOtp } =
    useAuth();


  const [selectedPortal, setSelectedPortal] = useState<'citizen' | 'official' | null>(() => {
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('portal')?.toLowerCase();
    if (roleParam === 'citizen' || roleParam === 'official') return roleParam;
    const stored = sessionStorage.getItem(PORTAL_INTENT_KEY);
    if (stored === 'citizen' || stored === 'official') return stored;
    return null;
  });

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingMsg, setConnectingMsg] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isKeycloakOffline, setIsKeycloakOffline] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);

  // ─── Citizen-specific state ────────────────────────────────────────────────
  const [citizenStep, setCitizenStep] = useState<CitizenStep>('choose_method');
  const [mobileNumber, setMobileNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [digiLockerLoading, setDigiLockerLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  // Close language menu on outside click
  useEffect(() => {
    const close = () => setLangMenuOpen(false);
    if (langMenuOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langMenuOpen]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      countdownRef.current = setInterval(() => {
        setResendCountdown((c) => {
          if (c <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resendCountdown]);

  // ─── Role helpers ───────────────────────────────────────────────────────────
  const isOfficial = isAuthenticated && hasRole(['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS', 'DATA_STEWARD']);

  // ─── Automatic Post-Login Redirection ───────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      const isOff = hasRole(['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS', 'DATA_STEWARD']);
      const dest = isOff ? '/official/queue' : '/my-applications';
      sessionStorage.removeItem(PORTAL_INTENT_KEY);
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, hasRole, navigate]);

  // ─── Portal selection ───────────────────────────────────────────────────────
  const handleSelectPortal = (portal: 'citizen' | 'official') => {
    setAuthError(null);
    setIsKeycloakOffline(false);
    setCitizenStep('choose_method');
    setOtp(['', '', '', '', '', '']);
    setMobileNumber('');
    setAadhaarNumber('');
    setOtpError(null);
    setSelectedPortal(portal);
    sessionStorage.setItem(PORTAL_INTENT_KEY, portal);
  };

  const handleBackToGateway = () => {
    setAuthError(null);
    setIsKeycloakOffline(false);
    setCitizenStep('choose_method');
    setSelectedPortal(null);
    sessionStorage.removeItem(PORTAL_INTENT_KEY);
  };

  // ─── Official Keycloak SSO ─────────────────────────────────────────────────
  const handleKeycloakLogin = async (deptContext?: string) => {
    if (deptContext) {
      sessionStorage.setItem('fisop_official_dept_context', deptContext);
    }
    setIsConnecting(true);
    setConnectingMsg(t('access.connecting', 'Connecting securely...'));
    setAuthError(null);
    setIsKeycloakOffline(false);

    try {
      if (import.meta.env.DEV) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1600);
        try {
          await fetch(import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080', {
            mode: 'no-cors',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          setConnectingMsg(t('access.redirecting', 'Redirecting to Keycloak SSO...'));
          await login('/official/queue');
        } catch {
          clearTimeout(timeoutId);
          setIsConnecting(false);
          setIsKeycloakOffline(true);
        }
      } else {
        setConnectingMsg(t('access.redirecting', 'Redirecting to Keycloak SSO...'));
        await login('/official/queue');
      }
    } catch {
      setIsConnecting(false);
      setAuthError(t('auth.authenticationFailed', 'Authentication failed. Please try again.'));
    }
  };

  // ─── OTP helpers ─────────────────────────────────────────────────────────
  const handleSendOtp = async (method: 'mobile' | 'aadhaar') => {
    const rawTarget = method === 'mobile' ? mobileNumber : aadhaarNumber;
    const digits = rawTarget.replace(/\D/g, '');
    if (digits.length < 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      if (sendCitizenOtp) {
        await sendCitizenOtp(digits);
      }
      setIsSendingOtp(false);
      setOtpSent(true);
      setResendCountdown(30);
      setCitizenStep(method === 'mobile' ? 'mobile_otp' : 'aadhaar_otp');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setIsSendingOtp(false);
      setOtpError(err.message || 'No registered citizen account found for this mobile number.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setOtpError(null);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (method: CitizenAuthMethod) => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setOtpError(t('citizenAuth.invalidOtp', 'Please enter a complete 6-digit OTP.'));
      return;
    }
    setIsVerifying(true);
    setOtpError(null);

    const rawTarget = method === 'mobile_otp' ? mobileNumber : aadhaarNumber;
    const digits = rawTarget.replace(/\D/g, '');

    try {
      if (verifyCitizenOtp) {
        await verifyCitizenOtp(digits, enteredOtp);
      } else {
        await citizenLogin(method);
      }
    } catch (err: any) {
      setIsVerifying(false);
      setOtpError(err.message || t('citizenAuth.verificationFailed', 'Verification failed. Please try again.'));
    }
  };

  const handleDigiLockerContinue = async () => {
    setDigiLockerLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    try {
      if (verifyCitizenOtp && mobileNumber) {
        await verifyCitizenOtp(mobileNumber, '100001');
      } else {
        await citizenLogin('digilocker');
      }
    } catch {
      setDigiLockerLoading(false);
      setOtpError(t('citizenAuth.verificationFailed', 'Verification failed. Please try again.'));
    }
  };



  const handleResendOtp = async (method: 'mobile' | 'aadhaar') => {
    if (resendCountdown > 0) return;
    setOtp(['', '', '', '', '', '']);
    setOtpError(null);
    setIsSendingOtp(true);
    await new Promise((r) => setTimeout(r, 500));
    setIsSendingOtp(false);
    setResendCountdown(30);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#002244] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#FF6700] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-200 text-sm font-medium">
            {t('auth.initializing', 'Checking session status...')}
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-[#002244] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#FF6700] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-200 text-sm font-medium">
            {t('access.redirecting', 'Redirecting to your dashboard...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#001733] via-[#003366] to-[#004E98] text-white flex flex-col justify-between overflow-x-hidden selection:bg-[#FF6700]/30 selection:text-white">
      {/* Top tricolor accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6700] via-white to-emerald-500 z-20" />

      {/* Ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="gateway-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gateway-grid)" />
        </svg>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#3A6EA5]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#FF6700]/10 rounded-full blur-3xl" />
      </div>

      <AccessHeader langMenuOpen={langMenuOpen} setLangMenuOpen={setLangMenuOpen} currentLang={currentLang} />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 flex flex-col justify-center z-10">
        {!selectedPortal ? (
          // ─── VIEW A: GATEWAY PORTAL SELECTION ──────────────────────────────
          <div className="w-full">
            <div className="text-center space-y-3 mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#FF6700] bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('access.gatewayBadge', 'FISOP Gateway')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {t('access.gatewayTitle', 'How would you like to access FISOP?')}
              </h1>
              <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto font-medium leading-relaxed">
                {t('access.description', 'Choose an access path to continue.')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {/* CITIZEN CARD */}
              <button
                type="button"
                id="access-choose-citizen"
                onClick={() => handleSelectPortal('citizen')}
                className="group relative text-left bg-gradient-to-b from-white to-slate-50 text-slate-900 rounded-3xl p-7 sm:p-9 shadow-2xl border-2 border-transparent hover:border-[#FF6700] focus:border-[#FF6700] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6700]/40 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                aria-label={t('access.continueCitizen', 'Continue as Citizen')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#004E98]/10 text-[#004E98] flex items-center justify-center group-hover:bg-[#004E98] group-hover:text-white transition-all duration-300">
                      <User className="w-7 h-7 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {t('access.citizenBadge', 'Citizen')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-[#004E98] transition-colors tracking-tight">
                    {t('access.citizen', 'Citizen')}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                    {t('access.citizenSubtitle', 'Government services & applications')}
                  </p>
                  <p className="text-sm text-slate-600 mt-3.5 leading-relaxed">
                    {t('access.citizenDesc', 'Access government services, submit applications and track your requests.')}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{t('access.citizenAuth1', 'Mobile OTP')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{t('access.citizenAuth2', 'Aadhaar + OTP')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{t('access.citizenAuth3', 'DigiLocker')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-2">
                  <div className="w-full flex items-center justify-between px-5 py-3.5 bg-[#004E98] group-hover:bg-[#FF6700] text-white rounded-2xl font-bold text-sm shadow-md transition-all duration-300">
                    <span>{t('access.continueCitizen', 'Continue as Citizen')}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </button>

              {/* GOVERNMENT OFFICIAL CARD */}
              <button
                type="button"
                id="access-choose-official"
                onClick={() => handleSelectPortal('official')}
                className="group relative text-left bg-gradient-to-b from-white to-slate-50 text-slate-900 rounded-3xl p-7 sm:p-9 shadow-2xl border-2 border-transparent hover:border-[#3A6EA5] focus:border-[#3A6EA5] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#3A6EA5]/40 transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
                aria-label={t('access.continueOfficial', 'Continue as Official')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#004E98]/10 text-[#004E98] flex items-center justify-center group-hover:bg-[#004E98] group-hover:text-white transition-all duration-300">
                      <Building2 className="w-7 h-7 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      {t('access.officialBadge', 'Government Official')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-[#004E98] transition-colors tracking-tight">
                    {t('access.official', 'Government Official')}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                    {t('access.officialSubtitle', 'Case processing & operations')}
                  </p>
                  <p className="text-sm text-slate-600 mt-3.5 leading-relaxed">
                    {t('access.officialDesc', 'Process cases, manage departmental workflows and monitor operations.')}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-200/80 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium">{t('access.officialFeature1', 'Case processing')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium">{t('access.officialFeature2', 'Department workflows')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-medium">{t('access.officialFeature3', 'Operations & SLA')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-2">
                  <div className="w-full flex items-center justify-between px-5 py-3.5 bg-[#004E98] group-hover:bg-[#3A6EA5] text-white rounded-2xl font-bold text-sm shadow-md transition-all duration-300">
                    <span>{t('access.continueOfficial', 'Continue as Official')}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-200/90">
              <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3.5 rounded-full border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('access.trustSecure', 'Secure authentication')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3.5 rounded-full border border-white/10 backdrop-blur-sm">
                <FileCheck2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{t('access.trustConsent', 'Consent-driven access')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 py-1.5 px-3.5 rounded-full border border-white/10 backdrop-blur-sm">
                <Layers className="w-4 h-4 text-[#FF6700] shrink-0" />
                <span>{t('access.trustAudit', 'Auditable workflows')}</span>
              </div>
            </div>
          </div>
        ) : (
          // ─── VIEW B: SIGN-IN PANEL ──────────────────────────────────────────
          <div className="w-full max-w-md mx-auto">
            {/* Back button */}
            <div className="mb-4">
              <button
                type="button"
                id="change-access-type-btn"
                onClick={handleBackToGateway}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 py-2 px-3.5 rounded-xl border border-white/15 transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('access.changeAccess', 'Change access type')}</span>
              </button>
            </div>

            {selectedPortal === 'citizen' ? (
              // ─── CITIZEN AUTHENTICATION PANEL ───────────────────────────────
              <CitizenAuthPanel
                citizenStep={citizenStep}
                setCitizenStep={setCitizenStep}
                mobileNumber={mobileNumber}
                setMobileNumber={setMobileNumber}
                aadhaarNumber={aadhaarNumber}
                setAadhaarNumber={setAadhaarNumber}
                otp={otp}
                otpInputRefs={otpInputRefs}
                otpError={otpError}
                setOtpError={setOtpError}
                isVerifying={isVerifying}
                isSendingOtp={isSendingOtp}
                digiLockerLoading={digiLockerLoading}
                resendCountdown={resendCountdown}
                onSendOtp={handleSendOtp}
                onOtpChange={handleOtpChange}
                onOtpKeyDown={handleOtpKeyDown}
                onOtpPaste={handleOtpPaste}
                onVerifyOtp={handleVerifyOtp}
                onResendOtp={handleResendOtp}
                onDigiLockerContinue={handleDigiLockerContinue}
                t={t}
              />
            ) : (
              // ─── OFFICIAL KEYCLOAK SSO PANEL ────────────────────────────────
              <OfficialAuthPanel
                isConnecting={isConnecting}
                connectingMsg={connectingMsg}
                authError={authError}
                isKeycloakOffline={isKeycloakOffline}
                selectedPortal={selectedPortal}
                onKeycloakLogin={handleKeycloakLogin}
                devLogin={devLogin}
                navigate={navigate}
                t={t}
              />
            )}
          </div>
        )}
      </main>

      <AccessFooter />
    </div>
  );
};

// ─── CitizenAuthPanel ─────────────────────────────────────────────────────────

interface CitizenAuthPanelProps {
  citizenStep: CitizenStep;
  setCitizenStep: (s: CitizenStep) => void;
  mobileNumber: string;
  setMobileNumber: (v: string) => void;
  aadhaarNumber: string;
  setAadhaarNumber: (v: string) => void;
  otp: string[];
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  otpError: string | null;
  setOtpError: (v: string | null) => void;
  isVerifying: boolean;
  isSendingOtp: boolean;
  digiLockerLoading: boolean;
  resendCountdown: number;
  onSendOtp: (method: 'mobile' | 'aadhaar') => void;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste: (e: React.ClipboardEvent) => void;
  onVerifyOtp: (method: CitizenAuthMethod) => void;
  onResendOtp: (method: 'mobile' | 'aadhaar') => void;
  onDigiLockerContinue: () => void;
  t: TFunction;
}

const CitizenAuthPanel: React.FC<CitizenAuthPanelProps> = ({
  citizenStep,
  setCitizenStep,
  mobileNumber,
  setMobileNumber,
  aadhaarNumber,
  setAadhaarNumber,
  otp,
  otpInputRefs,
  otpError,
  setOtpError,
  isVerifying,
  isSendingOtp,
  digiLockerLoading,
  resendCountdown,
  onSendOtp,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onVerifyOtp,
  onResendOtp,
  onDigiLockerContinue,
  t,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
      {/* Card header */}
      <div className="px-7 pt-7 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#004E98]/10 flex items-center justify-center">
            <User className="w-5 h-5 text-[#004E98]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full block">
              {t('access.citizenPortal', 'Citizen Portal')}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {t('citizenAuth.title', 'Sign in to FISOP')}
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {t('citizenAuth.subtitle', 'One Gateway. Many Government Services.')}
        </p>
      </div>

      <div className="px-7 py-6 space-y-4">


        {/* PROTOTYPE NOTICE */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <span className="font-bold">FISOP SIH Demo Prototype · </span>
            {t(
              'citizenAuth.prototypeNotice',
              'This prototype simulates identity verification. In production, real government identity APIs would be used.'
            )}
          </p>
        </div>


        {/* STEP: CHOOSE METHOD */}
        {citizenStep === 'choose_method' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('citizenAuth.chooseMethod', 'Choose how to sign in')}
            </p>

            {/* Mobile OTP */}
            <button
              type="button"
              id="citizen-auth-mobile-btn"
              onClick={() => setCitizenStep('mobile_input')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-[#004E98] hover:bg-[#004E98]/5 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#004E98]/30"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-[#004E98] transition-colors">
                <Phone className="w-5 h-5 text-[#004E98] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-sm text-slate-900 group-hover:text-[#004E98] transition-colors">
                  {t('citizenAuth.chooseMobile', 'Continue with Mobile OTP')}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t('citizenAuth.chooseMobileDesc', 'Receive a one-time password on your mobile')}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#004E98] transition-colors" />
            </button>

            {/* Aadhaar OTP */}
            <button
              type="button"
              id="citizen-auth-aadhaar-btn"
              onClick={() => setCitizenStep('aadhaar_input')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-[#004E98] hover:bg-[#004E98]/5 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#004E98]/30"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-[#004E98] transition-colors">
                <Fingerprint className="w-5 h-5 text-[#004E98] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-sm text-slate-900 group-hover:text-[#004E98] transition-colors">
                  {t('citizenAuth.chooseAadhaar', 'Continue with Aadhaar + OTP')}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t('citizenAuth.chooseAadhaarDesc', 'Verify using your Aadhaar-linked mobile OTP')}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#004E98] transition-colors" />
            </button>

            {/* DigiLocker */}
            <button
              type="button"
              id="citizen-auth-digilocker-btn"
              onClick={() => setCitizenStep('digilocker')}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6700]/30"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-[#FF6700] transition-colors">
                <ExternalLink className="w-5 h-5 text-[#FF6700] group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-sm text-slate-900 group-hover:text-[#FF6700] transition-colors">
                  {t('citizenAuth.chooseDigiLocker', 'Continue with DigiLocker')}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t('citizenAuth.chooseDigiLockerDesc', 'Authorize using your DigiLocker account')}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF6700] transition-colors" />
            </button>
          </div>
        )}

        {/* STEP: MOBILE INPUT */}
        {citizenStep === 'mobile_input' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setCitizenStep('choose_method')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#004E98] hover:text-[#003870] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('citizenAuth.backToMethods', 'Choose different method')}
            </button>
            <div>
              <label htmlFor="mobile-number" className="block text-sm font-semibold text-slate-900 mb-2">
                {t('citizenAuth.mobileLabel', 'Mobile Number')}
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 shrink-0">
                  🇮🇳 +91
                </div>
                <input
                  id="mobile-number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {t('citizenAuth.mobileHint', 'Enter any 10-digit mobile number, or pick a demo account below.')}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setMobileNumber('9876000001')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004E98] text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200"
                >
                  Citizen 1: 9876000001
                </button>
                <button
                  type="button"
                  onClick={() => setMobileNumber('9876000002')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#004E98] text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200"
                >
                  Citizen 2: 9876000002
                </button>
              </div>
            </div>
            <button
              type="button"
              id="send-mobile-otp-btn"
              disabled={mobileNumber.length !== 10 || isSendingOtp}
              onClick={() => onSendOtp('mobile')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#004E98] hover:bg-[#003870] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#004E98]/30"
            >
              {isSendingOtp ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP...</>
              ) : (
                <>{t('citizenAuth.sendOtp', 'Send OTP')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}

        {/* STEP: MOBILE OTP */}
        {citizenStep === 'mobile_otp' && (
          <OtpVerifyScreen
            method="mobile_otp"
            identifier={`+91 ${mobileNumber}`}
            otp={otp}
            otpInputRefs={otpInputRefs}
            otpError={otpError}
            isVerifying={isVerifying}
            resendCountdown={resendCountdown}
            onOtpChange={onOtpChange}
            onOtpKeyDown={onOtpKeyDown}
            onOtpPaste={onOtpPaste}
            onVerify={() => onVerifyOtp('mobile_otp')}
            onResend={() => onResendOtp('mobile')}
            onBack={() => setCitizenStep('mobile_input')}
            t={t}
          />
        )}

        {/* STEP: AADHAAR INPUT */}
        {citizenStep === 'aadhaar_input' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setCitizenStep('choose_method')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#004E98] hover:text-[#003870] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('citizenAuth.backToMethods', 'Choose different method')}
            </button>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-[11px] text-blue-800 font-medium">
                🔒 {t('citizenAuth.aadhaarPrivacyNotice', 'Do not enter your real Aadhaar number in this prototype. Use the demo Aadhaar below.')}
              </p>
            </div>
            <div>
              <label htmlFor="aadhaar-number" className="block text-sm font-semibold text-slate-900 mb-2">
                {t('citizenAuth.aadhaarLabel', 'Aadhaar Number')}
              </label>
              <input
                id="aadhaar-number"
                type="text"
                inputMode="numeric"
                maxLength={14}
                value={aadhaarNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                  const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
                  setAadhaarNumber(formatted);
                }}
                placeholder="XXXX XXXX XXXX"
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 tracking-widest transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setAadhaarNumber('1234 5678 9012')}
              className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#004E98] text-xs font-semibold text-slate-500 hover:text-[#004E98] transition-all cursor-pointer"
            >
              ↗ {t('citizenAuth.useDemoAadhaar', 'Use Demo Aadhaar (1234 5678 9012)')}
            </button>
            <button
              type="button"
              id="send-aadhaar-otp-btn"
              disabled={aadhaarNumber.replace(/\s/g, '').length !== 12 || isSendingOtp}
              onClick={() => onSendOtp('aadhaar')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#004E98] hover:bg-[#003870] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#004E98]/30"
            >
              {isSendingOtp ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending OTP...</>
              ) : (
                <>{t('citizenAuth.sendOtp', 'Send OTP')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}

        {/* STEP: AADHAAR OTP */}
        {citizenStep === 'aadhaar_otp' && (
          <OtpVerifyScreen
            method="aadhaar_otp"
            identifier={aadhaarNumber}
            otp={otp}
            otpInputRefs={otpInputRefs}
            otpError={otpError}
            isVerifying={isVerifying}
            resendCountdown={resendCountdown}
            onOtpChange={onOtpChange}
            onOtpKeyDown={onOtpKeyDown}
            onOtpPaste={onOtpPaste}
            onVerify={() => onVerifyOtp('aadhaar_otp')}
            onResend={() => onResendOtp('aadhaar')}
            onBack={() => setCitizenStep('aadhaar_input')}
            t={t}
          />
        )}

        {/* STEP: DIGILOCKER */}
        {citizenStep === 'digilocker' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setCitizenStep('choose_method')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#004E98] hover:text-[#003870] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('citizenAuth.backToMethods', 'Choose different method')}
            </button>
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#FF6700] to-[#e55c00] flex items-center justify-center shadow-lg">
                <ExternalLink className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{t('citizenAuth.digiLockerTitle', 'DigiLocker Authorization')}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {t('citizenAuth.digiLockerDesc', 'You will be redirected to DigiLocker to authenticate and authorize FISOP to access your documents.')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <p className="text-[11px] text-amber-800">
                  <span className="font-bold">FISOP SIH Demo Prototype · </span>
                  {t('citizenAuth.digiLockerPrototypeNotice', 'This prototype simulates DigiLocker authorization. Production deployment would use the official DigiLocker OAuth integration.')}
                </p>
              </div>
              <div className="space-y-1 text-xs text-slate-500 text-left bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Verify your DigiLocker account identity</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Authorize FISOP to access your documents</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Return to FISOP with verified session</span></div>
              </div>
            </div>
            <button
              type="button"
              id="digilocker-continue-btn"
              onClick={onDigiLockerContinue}
              disabled={digiLockerLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#FF6700] hover:bg-[#e55c00] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#FF6700]/30"
            >
              {digiLockerLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('citizenAuth.redirectingDigiLocker', 'Redirecting to DigiLocker...')}</>
              ) : (
                <>{t('citizenAuth.continueDigiLocker', 'Continue to DigiLocker')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}

        {/* Security note */}
        <div className="pt-3 border-t border-slate-100 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t('citizenAuth.securityNote', 'Your information is protected. FISOP uses secure identity verification and consent-based access to government records.')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── OTP Verify Screen ────────────────────────────────────────────────────────
interface OtpVerifyScreenProps {
  method: CitizenAuthMethod;
  identifier: string;
  otp: string[];
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  otpError: string | null;
  isVerifying: boolean;
  resendCountdown: number;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste: (e: React.ClipboardEvent) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  t: TFunction;
}

const OtpVerifyScreen: React.FC<OtpVerifyScreenProps> = ({
  method,
  identifier,
  otp,
  otpInputRefs,
  otpError,
  isVerifying,
  resendCountdown,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onVerify,
  onResend,
  onBack,
  t,
}) => {
  const isComplete = otp.every((d) => d !== '');
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#004E98] hover:text-[#003870] cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <div className="text-center space-y-1">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
        <p className="text-sm font-bold text-slate-900">
          {t('citizenAuth.otpSentTo', 'OTP sent to')} <span className="text-[#004E98]">{identifier}</span>
        </p>
        <p className="text-[11px] text-slate-500">
          {t('citizenAuth.otpHint', 'Enter the 6-digit code. For this prototype, any 6-digit code will work.')}
        </p>
      </div>
      {/* OTP input boxes */}
      <div
        className="flex gap-2 justify-center"
        onPaste={onOtpPaste}
        role="group"
        aria-label="One-time password input"
      >
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpInputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            id={`otp-digit-${i}`}
            aria-label={`OTP digit ${i + 1}`}
            onChange={(e) => onOtpChange(i, e.target.value)}
            onKeyDown={(e) => onOtpKeyDown(i, e)}
            className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 transition-all focus:outline-none ${
              otpError
                ? 'border-red-400 bg-red-50 text-red-700'
                : digit
                ? 'border-[#004E98] bg-[#004E98]/5 text-[#004E98]'
                : 'border-slate-200 bg-white text-slate-900 focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20'
            }`}
          />
        ))}
      </div>
      {/* Error */}
      {otpError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-xs font-medium text-red-700">{otpError}</p>
        </div>
      )}
      {/* Verify button */}
      <button
        type="button"
        id={`verify-otp-btn-${method}`}
        disabled={!isComplete || isVerifying}
        onClick={onVerify}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#004E98] hover:bg-[#003870] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#004E98]/30"
      >
        {isVerifying ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('citizenAuth.verifying', 'Verifying...')}</>
        ) : (
          <><ShieldCheck className="w-4 h-4" />{t('citizenAuth.verifyOtp', 'Verify & Sign In')}</>
        )}
      </button>
      {/* Resend */}
      <div className="text-center">
        <button
          type="button"
          disabled={resendCountdown > 0}
          onClick={onResend}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004E98] hover:text-[#003870] disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {resendCountdown > 0
            ? `${t('citizenAuth.resendOtpIn', 'Resend OTP in')} ${resendCountdown}s`
            : t('citizenAuth.resendOtp', 'Resend OTP')}
        </button>
      </div>
    </div>
  );
};

// ─── OfficialAuthPanel ────────────────────────────────────────────────────────
interface OfficialAuthPanelProps {
  isConnecting: boolean;
  connectingMsg: string;
  authError: string | null;
  isKeycloakOffline: boolean;
  selectedPortal: 'citizen' | 'official';
  onKeycloakLogin: (dept?: string) => void;
  devLogin?: (persona: 'CITIZEN' | 'DEPARTMENT_OFFICIAL' | 'ADMIN', targetId?: string | number) => void;
  navigate: (path: string) => void;
  t: TFunction;
}

const OfficialAuthPanel: React.FC<OfficialAuthPanelProps> = ({
  isConnecting,
  connectingMsg,
  authError,
  isKeycloakOffline,
  onKeycloakLogin,
  devLogin,
  navigate,
  t,
}) => (
  <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl p-7 sm:p-9 border border-white/20 space-y-6">
    <div className="text-center space-y-2">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#004E98]/10 text-[#004E98] mx-auto">
        <Building2 className="w-7 h-7" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full border inline-block bg-amber-50 text-amber-800 border-amber-200">
        {t('access.officialPortal', 'Government Official Portal')}
      </span>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
        {t('access.welcomeBack', 'Welcome back.')}
      </h2>
      <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
        {t('access.officialPortalDesc', 'Process departmental cases, manage workflows, and monitor operations.')}
      </p>
    </div>

    {authError && (
      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
        <p className="font-medium">{authError}</p>
      </div>
    )}

    {isKeycloakOffline && (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{t('auth.signInUnavailable', 'Official authentication temporarily unavailable.')}</h3>
            <p className="text-xs text-slate-600 mt-1">{t('auth.makeSureRunning', 'Please ensure the Keycloak authentication service is running on port 8080.')}</p>
          </div>
        </div>
        {import.meta.env.DEV && (
          <div className="pt-2 border-t border-amber-200/80 space-y-2">
            <p className="text-[11px] text-amber-800 font-medium">{t('auth.keycloakDevNotice', 'Keycloak is unavailable. Use development auth below for prototype testing.')}</p>
            <button
              type="button"
              id="dev-offline-login-btn"
              onClick={() => { devLogin?.('DEPARTMENT_OFFICIAL'); navigate('/official/queue'); }}
              className="w-full py-2.5 px-3 bg-[#FF6700] hover:bg-[#e55c00] text-white rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              ⚡ Continue with Local Dev Auth (Official) →
            </button>
          </div>
        )}
        <button type="button" onClick={() => onKeycloakLogin()} className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs border border-slate-200 transition-colors cursor-pointer">
          🔄 {t('auth.tryAgain', 'Try Again')}
        </button>
      </div>
    )}

    {/* Primary Keycloak SSO Action */}
    <div className="space-y-3">
      <button
        type="button"
        id="keycloak-sso-cta-btn"
        onClick={() => onKeycloakLogin()}
        disabled={isConnecting}
        className="w-full flex items-center justify-between px-6 py-4 bg-[#004E98] hover:bg-[#003870] disabled:bg-slate-400 text-white rounded-2xl font-black text-sm transition-all duration-200 shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#004E98]/30"
      >
        <div className="flex items-center gap-3">
          {isConnecting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-5 h-5 text-[#FF6700]" />}
          <span>{isConnecting ? connectingMsg : t('access.continueSSO', 'Continue with Keycloak SSO')}</span>
        </div>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    {/* Department Selection Buttons - Route to Real Keycloak SSO */}
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
        {t('access.selectDeptHeading', 'Select Department Context & Sign In with Keycloak:')}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {/* Revenue Official */}
        <button
          type="button"
          id="keycloak-login-rev-btn"
          disabled={isConnecting}
          onClick={() => onKeycloakLogin('REV')}
          className="w-full py-3 px-3.5 rounded-xl border border-blue-200 hover:border-[#004E98] bg-blue-50/70 hover:bg-blue-100/80 text-blue-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#004E98] text-white font-black text-[10px] flex items-center justify-center shadow-xs">REV</span>
            <div className="text-left">
              <span className="text-slate-900 group-hover:text-[#004E98] transition-colors block">{t('access.revOfficial', 'Revenue Official')}</span>
              <span className="text-[10px] text-slate-500 font-normal">{t('access.revDesc', 'Income & Revenue Cases')}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#004E98] group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Land Records Official */}
        <button
          type="button"
          id="keycloak-login-land-btn"
          disabled={isConnecting}
          onClick={() => onKeycloakLogin('LAND')}
          className="w-full py-3 px-3.5 rounded-xl border border-amber-200 hover:border-amber-500 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 text-xs font-bold transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">LAND</span>
            <div className="text-left">
              <span className="text-slate-900 group-hover:text-amber-800 transition-colors block">{t('access.landOfficial', 'Land Records Official')}</span>
              <span className="text-[10px] text-slate-500 font-normal">{t('access.landDesc', 'Title Mutation & Plots')}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Welfare Official */}
        <button
          type="button"
          id="keycloak-login-welf-btn"
          disabled={isConnecting}
          onClick={() => onKeycloakLogin('WELF')}
          className="w-full py-3 px-3.5 rounded-xl border border-[#3A6EA5]/30 hover:border-[#004E98] bg-[#3A6EA5]/10 hover:bg-[#3A6EA5]/20 text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-[#3A6EA5] text-white font-black text-[10px] flex items-center justify-center shadow-xs">WELF</span>
            <div className="text-left">
              <span className="text-slate-900 group-hover:text-[#004E98] transition-colors block">{t('access.welfOfficial', 'Social Welfare Official')}</span>
              <span className="text-[10px] text-slate-500 font-normal">{t('access.welfDesc', 'Scholarships & Pensions')}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#3A6EA5] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>

    <div className="pt-3 border-t border-slate-100 text-center space-y-1">
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Lock className="w-3.5 h-3.5 text-emerald-600" />
        <span>{t('access.secureAuthentication', 'Secure authentication')}</span>
      </div>
      <p className="text-[11px] text-slate-400">{t('access.protectedBy', 'Protected by FISOP security policies.')}</p>
    </div>

    {/* Strictly Separated Developer Quick Test Personas */}
    {import.meta.env.DEV && (
      <div className="pt-3 border-t border-slate-200 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Wrench className="w-3.5 h-3.5 text-slate-400" />
          <span>Developer Testing Tools (Local Prototype Simulation)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Fast test personas for local evaluation when Keycloak server is offline.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            id="dev-test-rev-btn"
            onClick={() => {
              devLogin?.('DEPARTMENT_OFFICIAL', 'REV_1');
              navigate('/official/queue');
            }}
            className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer text-center"
          >
            ⚡ Dev: REV
          </button>
          <button
            type="button"
            id="dev-test-land-btn"
            onClick={() => {
              devLogin?.('DEPARTMENT_OFFICIAL', 'LAND_1');
              navigate('/official/queue');
            }}
            className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer text-center"
          >
            ⚡ Dev: LAND
          </button>
          <button
            type="button"
            id="dev-test-welf-btn"
            onClick={() => {
              devLogin?.('DEPARTMENT_OFFICIAL', 'WELF_1');
              navigate('/official/queue');
            }}
            className="py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all cursor-pointer text-center"
          >
            ⚡ Dev: WELF
          </button>
        </div>
      </div>
    )}
  </div>
);

// ─── Header ───────────────────────────────────────────────────────────────────
interface AccessHeaderProps {
  langMenuOpen: boolean;
  setLangMenuOpen: (v: boolean) => void;
  currentLang: { code: string; label: string; short: string };
}

const AccessHeader: React.FC<AccessHeaderProps> = ({ langMenuOpen, setLangMenuOpen, currentLang }) => (
  <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between z-20">
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl border border-white/20 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-white/40"
      aria-label="Back to Home"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden xs:inline">Back to Home</span>
    </Link>

    <div className="flex items-center gap-3 sm:gap-4">
      <div className="relative">
        <button
          id="access-lang-selector"
          type="button"
          onClick={(e) => { e.stopPropagation(); setLangMenuOpen(!langMenuOpen); }}
          className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all border border-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Select language"
          aria-expanded={langMenuOpen}
          aria-haspopup="listbox"
        >
          <span>{currentLang.label}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {langMenuOpen && (
          <div role="listbox" className="absolute right-0 top-full mt-2 w-40 bg-[#002f5c] border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50 py-1" onClick={(e) => e.stopPropagation()}>
            {LANGUAGES.map(({ code, label, short }) => (
              <button key={code} role="option" aria-selected={i18n.language === code} type="button"
                onClick={() => { i18n.changeLanguage(code); setLangMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${i18n.language === code ? 'bg-[#FF6700] text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
              >
                <span>{label}</span><span className="text-[10px] opacity-75 font-mono uppercase">{short}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 pl-2 border-l border-white/15">
        <img src="/emblem.svg" alt="Government Emblem" className="w-8 h-8 opacity-95 shrink-0" />
        <div className="hidden sm:block text-left">
          <div className="font-black text-xs tracking-wider text-white uppercase">FISOP Gateway</div>
          <div className="text-[10px] text-slate-300 leading-none">Govt. of Maharashtra</div>
        </div>
      </div>
    </div>
  </header>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const AccessFooter: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-slate-400 border-t border-white/10 z-10">
      <p>{t('access.footer', 'Protected by Maharashtra State Interoperability Gateway Security Policies • SIH PS 26129')}</p>
    </footer>
  );
};
