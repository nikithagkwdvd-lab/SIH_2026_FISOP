import React from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import { MantralayaIllustration } from './MantralayaIllustration';
import { useTranslation } from 'react-i18next';

export interface OfficerHeroProps {
  username?: string;
  departmentCode?: string;
}

export const OfficerHero: React.FC<OfficerHeroProps> = ({
  username = 'officer_01',
  departmentCode = 'REV',
}) => {
  const { t } = useTranslation();

  const getDeptInfo = (code: string) => {
    const c = code.toUpperCase();
    if (c === 'LAND') {
      return {
        name: t('officialHero.landDeptName', 'Land Records & Settlement Department'),
        desc: t('officialHero.landDeptDesc', 'Review land title mutation requests, 7/12 extract verifications, and property survey plot boundaries.'),
        banner: t('officialHero.landBanner', 'Land Registration & Property Verification Pipeline'),
        themeColor: '#004E98',
        accentColor: '#d97706',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
      };
    } else if (c === 'WELF' || c === 'WELFARE') {
      return {
        name: t('officialHero.welfDeptName', 'Social Welfare & Pension Department'),
        desc: t('officialHero.welfDeptDesc', 'Process higher education scholarship eligibility, pension scheme enrollments, and Direct Benefit Transfers.'),
        banner: t('officialHero.welfBanner', 'DBT & Social Security Scheme Verification Pipeline'),
        themeColor: '#004E98',
        accentColor: '#3A6EA5',
        badgeBg: 'bg-[#3A6EA5]/15 text-[#004E98] border-[#3A6EA5]/30',
      };
    }
    return {
      name: t('officialHero.revDeptName', 'Revenue & Financial Verification Department'),
      desc: t('officialHero.revDeptDesc', 'Verify income certificates, tax compliance, caste solvency records, and revenue audit approvals.'),
      banner: t('officialHero.revBanner', 'Income & Revenue Verification Pipeline'),
      themeColor: '#004E98',
      accentColor: '#FF6700',
      badgeBg: 'bg-blue-50 text-[#004E98] border-blue-200',
    };
  };

  const deptInfo = getDeptInfo(departmentCode);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50/90 via-white to-sky-50/70 border border-slate-200/90 shadow-xs p-6 sm:p-8">
      {/* Background Decorative Government Watermark / Gradients */}
      <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-blue-100/30 to-transparent pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#004E98]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 60-65%: Welcome & Action Text */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Eyebrow badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${deptInfo.badgeBg}`}>
            <Building2 className="w-3.5 h-3.5 text-[#004E98]" />
            <span className="uppercase tracking-wider">{deptInfo.name}</span>
            {departmentCode && (
              <span className="text-[10px] bg-[#004E98] text-white px-1.5 py-0.2 rounded font-bold">
                {departmentCode}
              </span>
            )}
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('officialHero.welcome', 'Welcome back')}, <span className="text-[#004E98]">{username}</span>!
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
            {deptInfo.desc}
          </p>

          {/* Highlighted Statement Banner */}
          <div className="pt-2">
            <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5 text-[#004E98]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{deptInfo.banner}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">{t('officialHero.federatedProtocol', 'FISOP Federated Protocol')}</span>
            </div>
          </div>
        </div>

        {/* Right 35-40%: Maharashtra Government Heritage Building */}
        <div className="lg:col-span-5 xl:col-span-4 flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#002244] to-[#001733] p-4 border border-white/10 shadow-inner overflow-hidden">
            <MantralayaIllustration className="w-full h-auto max-h-44" opacity={1.0} />
          </div>
        </div>
      </div>
    </div>
  );
};
