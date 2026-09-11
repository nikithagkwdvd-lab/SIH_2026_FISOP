import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { useTranslation } from 'react-i18next';

export const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[#002244] text-white">
      <LandingNavbar />

      <main className="flex-1 pt-[82px]">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-[#004E98] to-[#002244]">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-widest uppercase text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6700]" />
              <span>{t('about.sihBadge')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-5">
              {t('about.title')}
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>
        </section>

        {/* Mission content */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Mission card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <h2 className="text-2xl font-bold text-white mb-4">{t('about.missionTitle')}</h2>
              <p className="text-slate-300 leading-relaxed">{t('about.missionDesc')}</p>
            </div>

            {/* Compliance card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{t('footer.securityTitle')}</h2>
                  <p className="text-slate-300 text-sm leading-relaxed">{t('about.compliance')}</p>
                </div>
              </div>
            </div>

            {/* SIH badge card */}
            <div className="bg-gradient-to-r from-[#FF6700]/10 to-transparent border border-[#FF6700]/20 rounded-2xl p-8">
              <div className="text-sm font-bold text-[#FF6700] uppercase tracking-widest mb-2">
                {t('about.sihBadge')}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                FISOP was developed as part of Smart India Hackathon 2026, Problem Statement 26129, 
                with the goal of building a federated interoperability backbone for Maharashtra's 
                digital governance ecosystem.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center pt-4">
              <Link
                to="/access"
                id="about-access-portal-cta"
                className="inline-flex items-center gap-2.5 bg-[#FF6700] hover:bg-[#e55c00] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>{t('about.cta')}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal footer strip */}
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        {t('footer.copyright')}
      </div>
    </div>
  );
};
