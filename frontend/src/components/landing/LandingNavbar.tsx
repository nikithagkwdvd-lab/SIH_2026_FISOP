import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'हि' },
  { code: 'mr', label: 'मराठी', short: 'म' },
];

export const LandingNavbar: React.FC = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close lang menu when clicking outside
  useEffect(() => {
    const close = () => setLangMenuOpen(false);
    if (langMenuOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [langMenuOpen]);

  const handleNavClick = (target: string, isAnchor: boolean = false) => {
    setMobileMenuOpen(false);
    if (isAnchor) {
      if (location.pathname === '/') {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } else {
        navigate(`/${target}`);
        return;
      }
    }
    navigate(target);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#004E98]/95 backdrop-blur-md shadow-lg border-b border-white/10'
          : 'bg-[#004E98] border-b border-white/10'
      }`}
    >
      {/* Tiranga accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6700] via-white to-emerald-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#FF6700] rounded-lg p-1"
          >
            <img src="/emblem.svg" alt="Government of Maharashtra" className="w-10 h-10 shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">FISOP</span>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-semibold">
                  Gov of Maharashtra
                </span>
              </div>
              <span className="text-xs text-slate-200 hidden sm:block">
                Government Interoperability Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                location.pathname === '/' && !location.hash
                  ? 'text-white bg-white/15'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('navbar.home', 'Home')}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('#services', true)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {t('navbar.services', 'Services')}
            </button>

            <Link
              to="/sitemap"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === '/sitemap'
                  ? 'text-white bg-white/15'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {t('navbar.howItWorks', 'How It Works')}
            </Link>

            <button
              type="button"
              onClick={() => handleNavClick('#about', true)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {t('navbar.about', 'About')}
            </button>
          </nav>

          {/* Right side: language selector + CTA + Help */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                id="lang-selector-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangMenuOpen(!langMenuOpen);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all border border-white/15 cursor-pointer"
                aria-label="Select language"
                aria-expanded={langMenuOpen}
              >
                <span>{currentLang.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {langMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-36 bg-[#003870] border border-white/15 rounded-xl shadow-xl overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {LANGUAGES.map(({ code, label, short }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage(code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                        i18n.language === code
                          ? 'bg-[#FF6700]/25 text-[#FF6700] font-bold'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-[10px] opacity-70 uppercase font-mono">{short}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Access Portal CTA (Primary) */}
            <Link
              to="/access"
              id="navbar-access-portal-btn"
              className="inline-flex items-center gap-2 bg-[#FF6700] hover:bg-[#e55c00] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{t('navbar.accessPortal', 'Access Portal')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Help Button (Secondary) */}
            <Link
              to="/help"
              id="navbar-help-btn"
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                location.pathname === '/help'
                  ? 'bg-white/20 text-white border-white/40 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-200" />
              <span>{t('navbar.help', 'Help')}</span>
            </Link>
          </div>

          {/* Mobile menu hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#002f5c] border-t border-white/10 px-4 pt-4 pb-6 space-y-3 shadow-2xl">
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleNavClick('/')}
              className="text-left px-3 py-2.5 text-sm font-semibold rounded-lg text-slate-200 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              {t('navbar.home', 'Home')}
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('#services', true)}
              className="text-left px-3 py-2.5 text-sm font-semibold rounded-lg text-slate-200 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              {t('navbar.services', 'Services')}
            </button>
            <Link
              to="/sitemap"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold rounded-lg text-slate-200 hover:bg-white/10 hover:text-white"
            >
              {t('navbar.howItWorks', 'How It Works')}
            </Link>
            <button
              type="button"
              onClick={() => handleNavClick('#about', true)}
              className="text-left px-3 py-2.5 text-sm font-semibold rounded-lg text-slate-200 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              {t('navbar.about', 'About')}
            </button>
            <Link
              to="/help"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold rounded-lg text-slate-200 hover:bg-white/10 hover:text-white flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-slate-300" />
              <span>{t('navbar.help', 'Help')}</span>
            </Link>
          </div>

          {/* Mobile language switcher */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-2 px-1">
              Language / भाषा
            </p>
            <div className="flex gap-2">
              {LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => i18n.changeLanguage(code)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    i18n.language === code
                      ? 'bg-[#FF6700] text-white border-[#FF6700]'
                      : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="pt-2">
            <Link
              to="/access"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#FF6700] text-white py-3 rounded-xl font-bold text-sm shadow-md"
            >
              <span>{t('navbar.accessPortal', 'Access Portal')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

