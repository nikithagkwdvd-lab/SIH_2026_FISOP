import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { InteractiveSitemap } from '../components/landing/InteractiveSitemap';
import { useTranslation } from 'react-i18next';

export const SitemapPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-[#3A6EA5]/20 selection:text-[#004E98]">
      <LandingNavbar />

      <main className="flex-1 pt-24 md:pt-28 pb-16">
        {/* Page Top Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004E98] hover:text-[#003870] bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('sitemap.backHome', 'Back to Home')}</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-[#004E98] to-[#002f5c] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6700]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider uppercase text-slate-100">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6700]" />
                <span>{t('sitemap.badge', 'Interactive Architecture Explorer')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {t('sitemap.title', 'How FISOP Works')}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                {t('sitemap.subtitle', 'Explore how the different parts of the FISOP platform connect. Use the hierarchical tree below to inspect public portals, citizen workflows, official desk queues, and admin data models.')}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Hierarchical Tree */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveSitemap />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#002244] text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t('footer.copyright', '© 2026 Government of Maharashtra • FISOP Platform')}</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/" className="hover:text-white transition-colors">{t('navbar.home', 'Home')}</Link>
            <span>•</span>
            <Link to="/services" className="hover:text-white transition-colors">{t('navbar.services', 'Services')}</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-white transition-colors">{t('navbar.about', 'About')}</Link>
            <span>•</span>
            <Link to="/access" className="hover:text-white transition-colors">{t('navbar.accessPortal', 'Access Portal')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
