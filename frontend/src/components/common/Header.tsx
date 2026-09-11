import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  ListFilter,
  BarChart3,
  Network,
  LogOut,
  LogIn,
  Menu,
  X,
  Shield,
  User as UserIcon,
  Building,
  Bell,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useAuth } from '../../auth/AuthContext';
import { Button } from './Button';
import { Badge } from './Badge';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'mr', label: 'मराठी', short: 'म' },
];

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout, login, hasRole, devLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const close = () => {
      setLangOpen(false);
      setNotifOpen(false);
    };
    if (langOpen || notifOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langOpen, notifOpen]);

  const isCitizen = hasRole('CITIZEN') && !hasRole('ADMIN') && !hasRole('DEPARTMENT_OFFICIAL');
  const isOfficial = hasRole(['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS']);
  const isAdmin = hasRole(['ADMIN', 'DATA_STEWARD']);

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string): string => {
    if (!name) return 'DO';
    const parts = name.replace(/[_-]/g, ' ').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#002244] text-white border-b-2 border-[#FF6700] shadow-md">
      {/* Top Tiranga / State Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6700] via-white to-emerald-500" />

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <Link
            to={isAuthenticated ? (isOfficial ? '/official/queue' : '/my-applications') : '/'}
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#FF6700] rounded-md p-1 group"
          >
            <img src="/emblem.svg" alt="Government of Maharashtra" className="w-9 h-9 shrink-0 opacity-95" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">FISOP</span>
                <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded text-slate-100 font-bold tracking-wide uppercase">
                  Gov of Maharashtra
                </span>
              </div>
              <span className="text-[11px] text-slate-300 hidden md:block leading-none">
                Federated Interoperability &amp; Service Orchestration Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation (Desktop) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Center navigation">
              {/* Citizen Links */}
              {isCitizen && (
                <>
                  <Link
                    to="/my-applications"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/my-applications')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#FF6700]" />
                      My applications
                    </span>
                  </Link>
                  <Link
                    to="/apply"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/apply')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      New application
                    </span>
                  </Link>
                  <Link
                    to="/services"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/services')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Services</span>
                  </Link>
                </>
              )}

              {/* Official / Admin Links */}
              {isOfficial && (
                <>
                  <Link
                    to="/official/queue"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/official/queue')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ListFilter className="w-3.5 h-3.5 text-amber-400" />
                      Case Queue
                    </span>
                  </Link>
                  <Link
                    to="/services"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/services')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Services</span>
                  </Link>
                  <Link
                    to="/official/operations"
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/official/operations')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                      Reports
                    </span>
                  </Link>
                </>
              )}

              {/* Admin AI Governance Links */}
              {isAdmin && (
                <>
                  <Link
                    to="/admin/ai-mappings"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/admin/ai-mappings')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-sky-300" />
                      AI schema governance
                    </span>
                  </Link>
                  <Link
                    to="/admin/canonical-schema"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive('/admin/canonical-schema')
                        ? 'bg-[#004E98] text-white shadow-xs border border-white/20'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Canonical schema
                    </span>
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* User Profile & Actions (Right Side) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                id="header-lang-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen(!langOpen);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
                aria-label="Select language"
              >
                <Globe className="w-3.5 h-3.5 text-sky-300" />
                <span>{currentLang.short}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-[#002f5c] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {LANGUAGES.map(({ code, label, short }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage(code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        i18n.language === code ? 'bg-[#FF6700] text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-[10px] opacity-75 font-mono uppercase">{short}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/15">
                {/* Notification Bell with Badge */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF6700] transition-colors cursor-pointer"
                    aria-label="View notifications (3 unread)"
                  >
                    <Bell className="w-4 h-4 text-slate-200" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6700] rounded-full ring-2 ring-[#002244] animate-pulse" />
                  </button>

                  {notifOpen && (
                    <div
                      className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Notifications
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          3 new
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                          <p className="font-semibold text-slate-900">Revenue Service Resumed</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Automated connector verified 14 waiting cases.</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">5m ago</span>
                        </div>
                        <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                          <p className="font-semibold text-slate-900">SLA Warning: 2 Cases Overdue</p>
                          <p className="text-[11px] text-amber-700 mt-0.5">Immediate departmental review required.</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">22m ago</span>
                        </div>
                        <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                          <p className="font-semibold text-slate-900">New Case Assigned: APP-2026-000169</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Caste Certificate application received.</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">1h ago</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Officer profile section: circular avatar with initials, username, role label, dropdown indicator */}
                <div className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">

                  <div className="w-8 h-8 rounded-full bg-[#004E98] border border-white/30 text-white font-extrabold text-xs flex items-center justify-center shadow-xs uppercase tracking-wider">
                    {getInitials(user.preferred_username || user.username || 'Department Official')}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">
                      {user.preferred_username || user.username || 'officer_01'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5">
                      {isAdmin ? 'Administrator' : isOfficial ? 'Department Official' : 'Citizen'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                </div>

                {/* Sign out button */}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 hover:border-white/40 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FF6700] transition-all select-none cursor-pointer"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#FF6700] shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => login()}
                className="bg-white text-[#002244] hover:bg-slate-100 border-none font-bold text-xs"
                leftIcon={<LogIn className="w-3.5 h-3.5" />}
              >
                Sign in (Keycloak SSO)
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gov-navy border-t border-white/10 px-4 pt-3 pb-6 space-y-3">
          {isAuthenticated && user && (
            <div className="p-3 bg-white/10 rounded-md mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {user.preferred_username || user.username}
                </p>
                <p className="text-xs text-slate-300">
                  {user.canonical_citizen_id || user.email || 'Authenticated user'}
                </p>
              </div>
              <Badge
                variant={isAdmin ? 'danger' : isOfficial ? 'warning' : 'info'}
                size="sm"
              >
                {isAdmin ? 'Admin' : isOfficial ? 'Official' : 'Citizen'}
              </Badge>
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex flex-col space-y-1">
              {isCitizen && (
                <>
                  <Link
                    to="/my-applications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base ${
                      isActive('/my-applications') ? 'bg-white/20 text-white font-bold' : 'text-slate-200'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    My applications
                  </Link>
                  <Link
                    to="/apply"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base ${
                      isActive('/apply') ? 'bg-white/20 text-white font-bold' : 'text-slate-200'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5" />
                    New application
                  </Link>
                </>
              )}

              {isOfficial && (
                <>
                  <Link
                    to="/official/queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base ${
                      isActive('/official/queue') ? 'bg-white/20 text-white font-bold' : 'text-slate-200'
                    }`}
                  >
                    <ListFilter className="w-5 h-5" />
                    Case queue
                  </Link>
                  <Link
                    to="/official/operations"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base ${
                      isActive('/official/operations') ? 'bg-white/20 text-white font-bold' : 'text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    Operational metrics
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin/ai-mappings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base ${
                      isActive('/admin/ai-mappings') ? 'bg-white/20 text-white font-bold' : 'text-slate-200'
                    }`}
                  >
                    <Network className="w-5 h-5" />
                    AI schema governance
                  </Link>
                  <Link
                    to="/admin/canonical-schema"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-base ${
                      isActive('/admin/canonical-schema') ? 'bg-white/20 text-white font-bold' : 'text-slate-200'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    Canonical schema
                  </Link>
                </>
              )}

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-base font-semibold text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/40 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
                >
                  <LogOut className="w-5 h-5 text-orange-200 shrink-0" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                login();
              }}
              className="w-full bg-white text-gov-primary font-bold"
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign in with Keycloak
            </Button>
          )}
        </div>
      )}
    </header>
  );
};
