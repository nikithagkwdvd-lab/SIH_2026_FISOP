import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Landmark, Droplets } from 'lucide-react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { useTranslation } from 'react-i18next';

const SERVICE_CARDS = [
  {
    icon: Landmark,
    titleKey: 'services.card1Title',
    descKey: 'services.card1Desc',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    icon: MapPin,
    titleKey: 'services.card2Title',
    descKey: 'services.card2Desc',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    icon: Droplets,
    titleKey: 'services.card3Title',
    descKey: 'services.card3Desc',
    color: 'bg-[#3A6EA5]/15 text-sky-300 border-[#3A6EA5]/30',
  },
];

export const ServicesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[#002244] text-white">
      <LandingNavbar />

      <main className="flex-1 pt-[82px]">
        {/* Hero banner */}
        <section className="relative overflow-hidden py-20 md:py-28 bg-gradient-to-b from-[#004E98] to-[#002244]">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[#3A6EA5]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-widest uppercase text-slate-200">
              <Clock className="w-3.5 h-3.5 text-[#FF6700]" />
              <span>{t('services.comingSoon')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-5">
              {t('services.title')}
            </h1>
            <p className="text-lg text-slate-300 mb-4 max-w-2xl mx-auto">
              {t('services.subtitle')}
            </p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              {t('services.description')}
            </p>
          </div>
        </section>

        {/* Coming-soon cards */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICE_CARDS.map(({ icon: Icon, titleKey, descKey, color }) => (
              <div
                key={titleKey}
                className="relative group bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-white/20 hover:bg-white/8 transition-all duration-300"
              >
                {/* Coming soon ribbon */}
                <span className="absolute top-4 right-4 text-[10px] bg-[#FF6700]/20 text-[#FF6700] border border-[#FF6700]/30 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">
                  {t('services.comingSoon')}
                </span>

                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              to="/access"
              id="services-access-portal-cta"
              className="inline-flex items-center gap-2.5 bg-[#FF6700] hover:bg-[#e55c00] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>{t('services.cta')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
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
