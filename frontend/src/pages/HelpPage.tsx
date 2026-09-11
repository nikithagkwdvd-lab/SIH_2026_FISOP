import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  BookOpen,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Send,
  User,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  KeyRound,
  ExternalLink,
  Star,
  ArrowRight,
  Layers,
  Lock,
} from 'lucide-react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { useTranslation } from 'react-i18next';

interface FaqItem {
  question: string;
  answer: string;
  category: 'General' | 'Citizen' | 'Official' | 'Security';
}

interface TutorialCard {
  id: string;
  title: string;
  role: string;
  duration: string;
  description: string;
  steps: string[];
  icon: React.ElementType;
}

export const HelpPage: React.FC = () => {
  const { t } = useTranslation();

  const FAQS: FaqItem[] = [
    {
      category: 'General',
      question: t('dashboard.faq1Q', 'What is FISOP and how does it connect departments?'),
      answer:
        'FISOP (Federated Interoperable Service Orchestration Platform) is a unified interoperability gateway for the Government of Maharashtra. It connects citizens and government departments—such as Revenue, Land Records, and Social Welfare—so data and verifications can be exchanged securely with explicit citizen consent without repeated manual submissions.',
    },
    {
      category: 'General',
      question: 'What services can I access through FISOP?',
      answer:
        'In this current version, connected services include Revenue & Tehsildar certificates (Income and Caste verification), Land Records & Mutation (Mahabhulekh 7/12 land titles), and Social Welfare benefits (Direct Benefit Transfer and Scholarship verification).',
    },
    {
      category: 'Citizen',
      question: 'How do I submit an application?',
      answer:
        'Click "Access Portal" from the top navigation, select the "Citizen Portal" role, and choose "New Application". You can select your desired service (Revenue, Land, or Welfare), review the required document proofs, grant explicit consent for automated verification, and submit.',
    },
    {
      category: 'Citizen',
      question: 'How do I track my submitted application?',
      answer:
        'After submitting, you receive a unique Application ID (e.g. APP-2026-XXXXXX). You can track live progress in the "My Applications" dashboard or open the status timeline to view which department is currently reviewing or verifying your request.',
    },
    {
      category: 'Security',
      question: 'What is consent in FISOP and why is it required?',
      answer:
        'Consent is a legally backed, digital authorization provided by the citizen before any department accesses personal records from another department registry. FISOP records this consent on an immutable audit ledger in accordance with data protection principles.',
    },
    {
      category: 'Official',
      question: 'How do department officials review and approve cases?',
      answer:
        'Government officials log in through Keycloak SSO to their respective department case queues (Revenue, Land Records, or Social Welfare). They inspect canonical data mappings, verify automated connector responses, and approve or request additional clarification.',
    },
    {
      category: 'Security',
      question: 'How is citizen privacy and auditability preserved?',
      answer:
        'All data exchanges between department registries occur over encrypted canonical APIs with mutual TLS and signed tokens. Every verification step creates a tamper-evident audit record visible in the application telemetry.',
    },
  ];

  const TUTORIALS: TutorialCard[] = [
    {
      id: 'tut-1',
      title: 'How to Access FISOP',
      role: 'Citizen & Official',
      duration: '2 min guide',
      description: 'Learn how to sign in, select your role, and navigate the central gateway.',
      steps: [
        'Click "Access Portal" on the header or hero banner.',
        'Select Citizen Portal (Mobile/Aadhaar/DigiLocker) or Government Official Portal (Keycloak SSO).',
        'Review your active role session in the dashboard.',
      ],
      icon: KeyRound,
    },
    {
      id: 'tut-2',
      title: 'How to Submit an Application',
      role: 'Citizen',
      duration: '3 min guide',
      description: 'Step-by-step walkthrough of selecting a service, providing data, and submitting.',
      steps: [
        'Navigate to "New Application" from the citizen dashboard.',
        'Select service type (Revenue, Land, or Welfare).',
        'Fill required details and review auto-matched registry records.',
        'Grant consent for automated verification and submit to receive your tracking ID.',
      ],
      icon: FileText,
    },
    {
      id: 'tut-3',
      title: 'How Consent Works',
      role: 'Security & Privacy',
      duration: '2 min guide',
      description: 'Understand how federated data exchange uses time-bound citizen consent.',
      steps: [
        'Inspect which authoritative registries will share data.',
        'Grant explicit permission for verification purposes.',
        'View consent status logged in the application status audit trail.',
      ],
      icon: Shield,
    },
    {
      id: 'tut-4',
      title: 'How to Track an Application',
      role: 'Citizen',
      duration: '2 min guide',
      description: 'Monitor cross-department verification stages on the interactive timeline.',
      steps: [
        'Open "My Applications" tab in the citizen dashboard.',
        'Click "Track Application" on any active application card.',
        'Review the status stepper and live verification outcomes from connected departments.',
      ],
      icon: Clock,
    },
    {
      id: 'tut-5',
      title: 'How Officers Process Applications',
      role: 'Government Official',
      duration: '4 min guide',
      description: 'How desk officers review case queues, audit trails, and approve federated data.',
      steps: [
        'Log into the Officer Case Queue via Keycloak SSO.',
        'Filter cases by department (Revenue, Land, Welfare).',
        'Inspect canonical data mappings and automated connector verification badges.',
        'Approve or request clarification on the case.',
      ],
      icon: Building2,
    },
  ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [faqFilter, setFaqFilter] = useState<string>('All');
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialCard | null>(TUTORIALS[0]);

  // Prototype Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    role: 'CITIZEN',
    rating: 5,
    service: 'General',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  const filteredFaqs =
    faqFilter === 'All' ? FAQS : FAQS.filter((f) => f.category === faqFilter);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedFeedback(true);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#3A6EA5]/20 selection:text-[#004E98]">
      <LandingNavbar />

      <main className="flex-1 pt-20">
        {/* ============================================================ */}
        {/* HERO HEADER */}
        {/* ============================================================ */}
        <section className="relative py-16 sm:py-20 bg-gradient-to-b from-[#004E98] via-[#003870] to-[#002244] text-white overflow-hidden border-b border-[#3A6EA5]/30">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#FF6700]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#3A6EA5]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider text-slate-100 uppercase backdrop-blur-sm shadow-xs">
                <HelpCircle className="w-3.5 h-3.5 text-[#FF6700]" />
                <span>{t('help.badge', 'Help & User Guide')}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {t('help.title', 'How can we assist you with')} <br />
                <span className="text-[#FF6700]">{t('help.titleHighlight', 'FISOP Gateway?')}</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                {t('help.subtitle', 'Find clear guides on accessing services, understanding consent-based data exchange, tracking your applications, and providing prototype feedback.')}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Nav Anchors */}
        <section className="bg-white border-b border-slate-200 sticky top-20 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-slate-600">
              <a
                href="#tutorials"
                className="px-3.5 py-1.5 rounded-xl hover:bg-[#EBEBEB] hover:text-[#004E98] transition-colors shrink-0"
              >
                {t('help.navHowToUse', 'How to Use FISOP')}
              </a>
              <a
                href="#faqs"
                className="px-3.5 py-1.5 rounded-xl hover:bg-[#EBEBEB] hover:text-[#004E98] transition-colors shrink-0"
              >
                {t('help.navFaqs', 'Frequently Asked Questions')}
              </a>
              <a
                href="#feedback"
                className="px-3.5 py-1.5 rounded-xl hover:bg-[#EBEBEB] hover:text-[#004E98] transition-colors shrink-0"
              >
                {t('help.navFeedback', 'Prototype Feedback')}
              </a>
              <Link
                to="/access"
                className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6700] hover:text-[#e55c00] transition-colors shrink-0"
              >
                <span>{t('help.navGoToPortal', 'Go to Portal')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
          {/* ============================================================ */}
          {/* SECTION 1: HOW TO USE FISOP */}
          {/* ============================================================ */}
          <section id="tutorials" className="scroll-mt-36">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004E98]/10 text-[#004E98] text-xs font-bold uppercase tracking-wider mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t('help.guidesBadge', 'Interactive Guides')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t('help.guidesTitle', 'How to Use FISOP')}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  {t('help.guidesSubtitle', 'Structured walkthroughs for citizens and government officials.')}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('help.prototypeNotice', 'Prototype Walkthroughs • Video tutorials coming soon')}</span>
              </div>
            </div>

            {/* Grid of Tutorial Cards + Detail Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: List of Tutorial Cards */}
              <div className="lg:col-span-5 space-y-3">
                {TUTORIALS.map((tut) => {
                  const Icon = tut.icon;
                  const isSelected = selectedTutorial?.id === tut.id;
                  return (
                    <button
                      key={tut.id}
                      type="button"
                      onClick={() => setSelectedTutorial(tut)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 group hover:-translate-y-0.5 ${
                        isSelected
                          ? 'bg-white border-[#004E98] ring-2 ring-[#004E98]/20 shadow-md'
                          : 'bg-white border-slate-200 hover:border-[#3A6EA5]/60 hover:bg-[#EBEBEB]/40'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                          isSelected
                            ? 'bg-[#004E98] text-white shadow-xs'
                            : 'bg-blue-50 text-[#004E98] border border-blue-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {tut.role}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {tut.duration}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-[#004E98] transition-colors">
                          {tut.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                          {tut.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Selected Tutorial Detail */}
              {selectedTutorial && (
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 transition-all duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#004E98]/10 text-[#004E98] flex items-center justify-center">
                        <selectedTutorial.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#FF6700] uppercase tracking-wider">
                          {selectedTutorial.role}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          {selectedTutorial.title}
                        </h3>
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                      {selectedTutorial.duration}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {selectedTutorial.description}
                  </p>

                  {/* Step list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t('help.stepByStep', 'Step-by-Step Instructions')}
                    </h4>
                    <div className="space-y-2.5">
                      {selectedTutorial.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#004E98] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prototype Video Placeholder Notice */}
                  <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#004E98] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{t('help.videoNoticeTitle', 'Prototype Tutorial Guide')}</p>
                      <p className="text-slate-600 mt-0.5">
                        {t('help.videoNoticeDesc', 'Video demonstrations for this module will be added as full department integrations go live.')}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action */}
                  <div className="pt-2 flex justify-end">
                    <Link
                      to="/access"
                      className="inline-flex items-center gap-2 bg-[#004E98] hover:bg-[#003870] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-98"
                    >
                      <span>{t('help.tryInPortal', 'Try this in Portal')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 2: FAQS ACCORDION */}
          {/* ============================================================ */}
          <section id="faqs" className="scroll-mt-36">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004E98]/10 text-[#004E98] text-xs font-bold uppercase tracking-wider mb-2">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{t('help.faqBadge', 'Frequently Asked Questions')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t('help.faqTitle', 'Answers & Explanations')}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                  {t('help.faqSubtitle', 'Common questions regarding FISOP architecture, privacy, and services.')}
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {['All', 'General', 'Citizen', 'Official', 'Security'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFaqFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      faqFilter === cat
                        ? 'bg-[#004E98] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-[#EBEBEB]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion list */}
            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200 hover:border-slate-300"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/80 cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3 pr-4">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-[#EBEBEB] px-2.5 py-0.5 rounded-full">
                          {faq.category}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          {faq.question}
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#004E98]' : ''}`} />
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 3: USER FEEDBACK (PROTOTYPE LOCAL STATE) */}
          {/* ============================================================ */}
          <section id="feedback" className="scroll-mt-36">
            <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/30 rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6700]/10 text-[#FF6700] text-xs font-bold uppercase tracking-wider mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('help.feedbackBadge', 'Prototype Feedback')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {t('help.feedbackTitle', 'Share Your Prototype Feedback')}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  {t('help.feedbackSubtitle', 'Help us refine user experience and interoperability flows. This form records feedback in local session state for the prototype demonstration.')}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Feedback Form */}
                <div className="lg:col-span-7">
                  {submittedFeedback ? (
                    <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {t('help.feedbackSuccessTitle', 'Thank you for your feedback!')}
                      </h3>
                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        {t('help.feedbackSuccessDesc', 'Your response has been recorded for this prototype evaluation session.')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedFeedback(false);
                          setFeedbackForm({
                            name: '',
                            role: 'CITIZEN',
                            rating: 5,
                            service: 'General',
                            message: '',
                          });
                        }}
                        className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#004E98] hover:text-[#003870] cursor-pointer"
                      >
                        ← {t('help.feedbackSubmitAnother', 'Submit another response')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            {t('help.feedbackName', 'Your Name / Identifier')}
                          </label>
                          <input
                            type="text"
                            value={feedbackForm.name}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                            placeholder="e.g. Evaluator / Citizen"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            {t('help.feedbackRole', 'User Role')}
                          </label>
                          <select
                            value={feedbackForm.role}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, role: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                          >
                            <option value="CITIZEN">Citizen Persona</option>
                            <option value="OFFICIAL">Department Official</option>
                            <option value="ADMIN">System Administrator / Evaluator</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            {t('help.feedbackRating', 'Experience Rating')}
                          </label>
                          <div className="flex items-center gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none cursor-pointer transition-colors"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    star <= feedbackForm.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-slate-600 ml-2">
                              {feedbackForm.rating} / 5
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            {t('help.feedbackService', 'Service Evaluated')}
                          </label>
                          <select
                            value={feedbackForm.service}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, service: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                          >
                            <option value="General">General Platform Navigation</option>
                            <option value="Revenue">Revenue & Income Verification</option>
                            <option value="Land">Land Records & 7/12</option>
                            <option value="Welfare">Social Welfare & DBT</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {t('help.feedbackMessage', 'Feedback / Observations')} *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={feedbackForm.message}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                          placeholder="Share feedback on form usability, verification clarity, or speed..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all resize-y"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !feedbackForm.message.trim()}
                        className="inline-flex items-center gap-2 bg-[#FF6700] hover:bg-[#e55c00] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:shadow-orange-500/25 transition-all cursor-pointer active:scale-98"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{t('help.feedbackSubmitting', 'Recording Feedback...')}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{t('help.feedbackSubmit', 'Submit Prototype Feedback')}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Right: Informational Sidecard */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#004E98]">
                    <Sparkles className="w-4 h-4 text-[#FF6700]" />
                    <span>Smart India Hackathon • PS 26129</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Interoperability Evaluation Framework
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    FISOP adheres to the National Data Governance Framework Policy and MeitY e-Governance standards for Open API interoperability.
                  </p>
                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Federated Identity via Keycloak OIDC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zero duplicate document submission</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>End-to-end audit logging</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#001830] text-slate-400 border-t border-slate-800 py-8 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>© 2026 Government of Maharashtra • FISOP Platform</p>
          <p className="text-[11px] text-slate-500">
            Smart India Hackathon 2024 • Federated Interoperability &amp; Service Orchestration Platform
          </p>
        </div>
      </footer>
    </div>
  );
};
