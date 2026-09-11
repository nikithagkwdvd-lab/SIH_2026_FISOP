import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Landmark,
  Coins,
  Building2,
  Droplets,
  Layers,
  Lock,
  UserCheck,
  FileText,
  Activity,
  User,
  Shield,
  Network,
} from 'lucide-react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { InteroperabilityVisual } from '../components/landing/InteroperabilityVisual';
import { useTranslation } from 'react-i18next';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#3A6EA5]/20 selection:text-[#004E98]">
      {/* 1. Navigation Bar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* ============================================================ */}
        {/* 2. HERO SECTION */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#004E98] via-[#003870] to-[#002244] text-white pt-28 md:pt-36 pb-20 md:pb-28 border-b border-slate-800">
          {/* Background dot pattern and ambient glows */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:22px_22px] pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#FF6700]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-[450px] h-[450px] bg-[#3A6EA5]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Heading & Value Proposition */}
              <div className="lg:col-span-6 space-y-7">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider text-slate-100 uppercase backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6700]" />
                  <span>{t('hero.badge', 'Government Interoperability Platform')}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  {t('hero.headline1', 'One Gateway.')} <br />
                  <span className="text-[#FF6700]">{t('hero.headline2', 'Many Government')}</span>{' '}
                  {t('hero.headline3', 'Services.')}
                </h1>

                <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl">
                  {t('hero.subheadline', 'Connect citizens and government departments through a unified interoperability layer for identity, consent, data exchange and workflow orchestration.')}
                </p>

                {/* CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    to="/access"
                    id="hero-access-portal-cta"
                    className="inline-flex items-center justify-center gap-2.5 bg-[#FF6700] hover:bg-[#e55c00] text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>{t('hero.ctaAccess', 'Access Portal')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    to="/sitemap"
                    id="hero-see-how-it-works-cta"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-4 rounded-xl font-bold text-base transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <Compass className="w-5 h-5 text-sky-300" />
                    <span>{t('hero.ctaHowItWorks', 'See How It Works')}</span>
                  </Link>
                </div>

                {/* Key Pillars */}
                <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-3 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('hero.pillar1', 'Single Sign-On')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('hero.pillar2', 'Consent-Based Data Reuse')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('hero.pillar3', 'End-to-End Audit')}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Interoperability Visual */}
              <div className="lg:col-span-6 flex items-center justify-center">
                <InteroperabilityVisual />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. SERVICES SECTION */}
        {/* ============================================================ */}
        <section id="services" className="py-24 bg-white border-b border-slate-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004E98]/10 text-[#004E98] text-xs font-bold uppercase tracking-wider">
                <Landmark className="w-3.5 h-3.5" />
                <span>{t('services.badge', 'Connected Public Gateways')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {t('services.title', 'Government Services')}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                {t('services.subtitle', 'Access connected public services through a single government gateway.')}
              </p>
            </div>

            {/* Service Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Revenue & Land Records */}
              <div className="group rounded-3xl bg-slate-50 border border-slate-200/80 p-8 hover:border-[#3A6EA5] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#004E98]/10 border border-[#004E98]/20 flex items-center justify-center text-[#004E98] group-hover:bg-[#004E98] group-hover:text-white transition-colors">
                      <Coins className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {t('services.statusConnected', 'Connected')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#004E98] transition-colors">
                    {t('services.card1Title', 'Revenue & Land Records')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {t('services.card1Desc', 'Property verification, 7/12 land parcel records, mutation tracking, and digital income certification across state tehsils.')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Mahabhulekh & Revenue</span>
                  <Link
                    to="/access"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004E98] hover:text-[#FF6700] transition-colors"
                  >
                    <span>{t('services.applyNow', 'Access Service')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Social Welfare Schemes */}
              <div className="group rounded-3xl bg-slate-50 border border-slate-200/80 p-8 hover:border-[#3A6EA5] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#3A6EA5]/10 border border-[#3A6EA5]/20 flex items-center justify-center text-[#3A6EA5] group-hover:bg-[#3A6EA5] group-hover:text-white transition-colors">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {t('services.statusAvailable', 'Available')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#004E98] transition-colors">
                    {t('services.card2Title', 'Social Welfare Schemes')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {t('services.card2Desc', 'Unified access to state scholarship schemes, DBT welfare programs, disability assistance, and entitlement validation.')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Social Justice Dept</span>
                  <Link
                    to="/access"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#004E98] hover:text-[#FF6700] transition-colors"
                  >
                    <span>{t('services.applyNow', 'Access Service')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Utility & Municipal Services */}
              <div className="group rounded-3xl bg-slate-50 border border-slate-200/80 p-8 hover:border-[#3A6EA5] hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF6700]/10 border border-[#FF6700]/20 flex items-center justify-center text-[#FF6700] group-hover:bg-[#FF6700] group-hover:text-white transition-colors">
                      <Droplets className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {t('services.comingSoon', 'Coming Soon')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#004E98] transition-colors">
                    {t('services.card3Title', 'Utility & Municipal Services')}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {t('services.card3Desc', 'Water connection validation, electricity billing records, property tax clearance, and civic grievance escalation.')}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Municipal Corporations</span>
                  <span className="text-xs text-slate-400 font-semibold italic">In Integration</span>
                </div>
              </div>
            </div>

            {/* Bottom Section Link to full catalog */}
            <div className="mt-14 text-center">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#004E98] hover:text-[#FF6700] bg-slate-100 hover:bg-slate-200/80 px-6 py-3 rounded-xl transition-colors"
              >
                <span>{t('services.viewFullCatalog', 'View Complete Services Overview')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. ABOUT US SECTION */}
        {/* ============================================================ */}
        <section id="about" className="py-24 bg-slate-100/80 border-b border-slate-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Story & Principles */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004E98]/10 text-[#004E98] text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#004E98]" />
                  <span>{t('about.badge', 'Architecture & Governance')}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {t('about.title', 'About FISOP')} <br />
                  <span className="text-[#004E98]">{t('about.subheading', 'Government services, connected.')}</span>
                </h2>

                <p className="text-base text-slate-700 leading-relaxed">
                  {t('about.p1', 'Government services are often separated across departmental silos, requiring citizens to repeatedly submit physical photocopies and visit multiple offices. FISOP bridges these silos through a unified, consent-driven interoperability layer.')}
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t('about.pillar1Title', 'Unified Citizen Experience')}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{t('about.pillar1Desc', 'Submit once with verified digital consent — no repetitive document uploads across departments.')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t('about.pillar2Title', 'Secure & Consent-Aware Data Exchange')}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{t('about.pillar2Desc', 'Authoritative data exchange occurs via encrypted canonical APIs with explicit citizen authorization.')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4 text-[#FF6700]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t('about.pillar3Title', 'Transparent Application Processing')}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{t('about.pillar3Desc', 'Real-time SLA telemetry, synchronized departmental queues, and verifiable audit trails.')}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#004E98] hover:text-[#FF6700] transition-colors"
                  >
                    <span>{t('about.learnMore', 'Read Detailed Governance & SIH Mission →')}</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Architecture Representation */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-[#FF6700]" />
                      <h4 className="text-sm font-bold text-slate-900">Federated Interoperability Model</h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      SIH-26129
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Layer 1: Citizen Entry */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-[#004E98]" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Single Citizen Window</p>
                          <p className="text-[11px] text-slate-500">Universal application & status dashboard</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#004E98] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                        Step 1
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center -my-1">
                      <div className="w-0.5 h-4 bg-[#FF6700]" />
                    </div>

                    {/* Layer 2: FISOP Core */}
                    <div className="p-4 rounded-2xl bg-[#004E98] text-white shadow-md flex items-center justify-between border border-[#FF6700]">
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-[#FF6700]" />
                        <div>
                          <p className="text-xs font-bold text-white">FISOP Gateway Core</p>
                          <p className="text-[11px] text-slate-200">Consent, Canonical Mapping & Interop APIs</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded">
                        Orchestration
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center -my-1">
                      <div className="w-0.5 h-4 bg-[#FF6700]" />
                    </div>

                    {/* Layer 3: Department Systems */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Network className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Department Repositories</p>
                          <p className="text-[11px] text-slate-500">Land, Revenue, Social Welfare & Civil Supplies</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Authoritative
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>MeitY e-Governance Compliant</span>
                    <span className="font-semibold text-emerald-600">Digital Service Access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. SHORT HOW FISOP WORKS SECTION (4 STEPS) */}
        {/* ============================================================ */}
        <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#002244] to-[#001830] text-white scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider border border-white/15">
                <Compass className="w-3.5 h-3.5 text-[#FF6700]" />
                <span>{t('howItWorks.badge', 'Simple 4-Step Process')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {t('howItWorks.title', 'How FISOP Works')}
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {t('howItWorks.subtitle', 'Understand how FISOP connects citizens, departments, and services through a unified platform.')}
              </p>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Step 01 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/25 hover:bg-white/10 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
                      STEP 01
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {t('howItWorks.step1Title', 'Choose Your Role')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('howItWorks.step1Desc', 'Access the portal as a citizen or government official — each with a tailored experience.')}
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/25 hover:bg-white/10 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
                      STEP 02
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {t('howItWorks.step2Title', 'Authenticate Securely')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('howItWorks.step2Desc', 'Sign in using the existing authentication system with role-based access control.')}
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/25 hover:bg-white/10 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#3A6EA5]/20 border border-[#3A6EA5]/40 flex items-center justify-center text-sky-300 group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
                      STEP 03
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {t('howItWorks.step3Title', 'Submit or Process')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('howItWorks.step3Desc', 'Citizens submit requests; officials review, verify, and process them in synchronized queues.')}
                  </p>
                </div>
              </div>

              {/* Step 04 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/25 hover:bg-white/10 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#FF6700]/15 border border-[#FF6700]/25 flex items-center justify-center text-[#FF6700] group-hover:scale-110 transition-transform">
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-white/5 px-2 py-1 rounded">
                      STEP 04
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {t('howItWorks.step4Title', 'Track in Real-time')}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('howItWorks.step4Desc', 'Citizens can follow application progress through the unified flow with verifiable audit status.')}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button to Full Interactive Sitemap Page */}
            <div className="mt-14 text-center">
              <Link
                to="/sitemap"
                id="explore-how-it-works-btn"
                className="inline-flex items-center gap-2.5 bg-[#FF6700] hover:bg-[#e55c00] text-white px-8 py-4 rounded-xl font-bold text-sm shadow-xl hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{t('howItWorks.exploreCta', 'Explore How It Works (Interactive Sitemap) →')}</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/* 6. COMPREHENSIVE FOOTER */}
      {/* ============================================================ */}
      <footer id="help" className="bg-[#001830] text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Column 1: Identity */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <img src="/emblem.svg" alt="Emblem" className="w-8 h-8 opacity-90" />
                <div>
                  <span className="font-extrabold text-white text-base tracking-wide block">FISOP</span>
                  <span className="text-[11px] text-slate-400">Government of Maharashtra</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('footer.tagline', 'Federated Interoperability and Service Orchestration Platform.')}
              </p>
              <div className="pt-1 text-[11px] text-[#FF6700] font-semibold">
                {t('footer.sih', 'Smart India Hackathon • PS 26129')}
              </div>
            </div>

            {/* Column 2: Public Navigation */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                {t('footer.navTitle', 'Platform Navigation')}
              </h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link to="/" className="hover:text-white transition-colors">{t('footer.homeGateway', 'Home Gateway')}</Link></li>
                <li><a href="#services" className="hover:text-white transition-colors">{t('footer.servicesCatalog', 'Government Services')}</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">{t('navbar.about', 'About FISOP')}</a></li>
                <li><Link to="/sitemap" className="hover:text-white transition-colors">{t('footer.howItWorksLink', 'How It Works (Sitemap)')}</Link></li>
                <li><Link to="/access" className="hover:text-white transition-colors">{t('footer.accessPortalLink', 'Access Portal')}</Link></li>
              </ul>
            </div>

            {/* Column 3: Authenticated Portals */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                {t('footer.portalsTitle', 'Portals & Workflows')}
              </h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link to="/my-applications" className="hover:text-white transition-colors">{t('footer.citizenApps', 'Citizen Applications')}</Link></li>
                <li><Link to="/apply" className="hover:text-white transition-colors">{t('footer.newApplication', 'New Application')}</Link></li>
                <li><Link to="/official/queue" className="hover:text-white transition-colors">{t('footer.officialQueue', 'Official Case Queue')}</Link></li>
                <li><Link to="/official/operations" className="hover:text-white transition-colors">{t('footer.operations', 'Operations & SLA Telemetry')}</Link></li>
                <li><Link to="/admin/canonical-schema" className="hover:text-white transition-colors">{t('footer.canonicalSchemas', 'Canonical Schemas')}</Link></li>
              </ul>
            </div>

            {/* Column 4: Compliance & Security */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                {t('footer.securityTitle', 'Security & Standards')}
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                {t('footer.securityDesc', 'Compliant with MeitY e-Governance standards, Open API specifications, and OIDC Keycloak authentication.')}
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{t('footer.encryptedExchange', 'Encrypted Cross-Dept Exchange')}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>{t('footer.copyright', '© 2026 Government of Maharashtra • FISOP Platform')}</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span>{t('footer.privacy', 'Privacy Policy')}</span>
              <span>•</span>
              <span>{t('footer.terms', 'Terms of Service')}</span>
              <span>•</span>
              <span>{t('footer.accessibility', 'Accessibility Guidelines')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
