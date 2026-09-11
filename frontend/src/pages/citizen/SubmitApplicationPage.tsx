import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Building,
  MapPin,
  HeartHandshake,
  FileText,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Users,
  Clock,
  Layers,
  Info,
  User,
  Phone,
  Briefcase,
  IndianRupee,
  BookOpen,
  School,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { applicationsApi } from '../../api/applications';
import { generateIdempotencyKey } from '../../utils/idGenerator';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuth } from '../../auth/AuthContext';

// ─── Service Catalogue ─────────────────────────────────────────────────────────
export interface ServiceDefinition {
  id: string;
  serviceType: string;
  purpose: string;
  icon: React.ReactNode;
  name: string;
  shortDesc: string;
  departments: string[];
  processing: string;
  isActive: boolean;
  badge?: string;
  whatYouProvide: string[];
  whatFisopVerifies: string[];
}

export const SERVICES: ServiceDefinition[] = [
  {
    id: 'scholarship',
    serviceType: 'SCHOLARSHIP',
    purpose: 'SCHOLARSHIP_ELIGIBILITY',
    icon: <GraduationCap className="w-6 h-6" />,
    name: 'Scholarship Application',
    shortDesc: 'Post-matric merit scholarship for eligible students in Maharashtra.',
    departments: ['Revenue', 'Land Records', 'Welfare'],
    processing: '7–10 working days',
    isActive: true,
    whatYouProvide: ['Educational institution', 'Course & Year of study', 'Scheme category', 'Academic year'],
    whatFisopVerifies: ['Family income (Revenue)', 'Land/property records (Land Records)', 'DBT eligibility (Welfare)'],
  },
  {
    id: 'income_certificate',
    serviceType: 'INCOME_CERTIFICATE',
    purpose: 'INCOME_CERTIFICATE_ISSUANCE',
    icon: <FileText className="w-6 h-6" />,
    name: 'Income Certificate',
    shortDesc: 'Certified annual family income certificate for government schemes.',
    departments: ['Revenue'],
    processing: '3–5 working days',
    isActive: true,
    badge: 'Active Service',
    whatYouProvide: ['Occupation & Income source', 'Declared annual income', 'Purpose of certificate', 'Address details'],
    whatFisopVerifies: ['Annual family income (Revenue)', 'Tax filing status (Revenue)'],
  },
  {
    id: 'caste_certificate',
    serviceType: 'SCHOLARSHIP',
    purpose: 'CASTE_CERTIFICATE',
    icon: <Users className="w-6 h-6" />,
    name: 'Caste Certificate',
    shortDesc: 'Domicile and caste certificate for Maharashtra residents.',
    departments: ['Revenue'],
    processing: '5–7 working days',
    isActive: false,
    badge: 'Coming Soon',
    whatYouProvide: ['Caste category', 'Proof of domicile'],
    whatFisopVerifies: ['Revenue records', 'Domicile verification'],
  },
  {
    id: 'housing',
    serviceType: 'HOUSING',
    purpose: 'HOUSING_SCHEME',
    icon: <Building className="w-6 h-6" />,
    name: 'Housing Scheme',
    shortDesc: 'Pradhan Mantri Awas Yojana and state housing assistance programs.',
    departments: ['Revenue', 'Land Records'],
    processing: '15–30 working days',
    isActive: false,
    badge: 'Coming Soon',
    whatYouProvide: ['Current residence status', 'Family details'],
    whatFisopVerifies: ['Land ownership (Land Records)', 'Income (Revenue)'],
  },
  {
    id: 'welfare',
    serviceType: 'PENSION',
    purpose: 'WELFARE_BENEFIT',
    icon: <HeartHandshake className="w-6 h-6" />,
    name: 'Welfare Benefit',
    shortDesc: 'Social welfare and DBT benefit scheme application.',
    departments: ['Welfare', 'Revenue'],
    processing: '10–15 working days',
    isActive: false,
    badge: 'Coming Soon',
    whatYouProvide: ['Scheme details', 'Beneficiary information'],
    whatFisopVerifies: ['DBT eligibility (Welfare)', 'Income (Revenue)'],
  },
];

// ─── Step Progress Component ────────────────────────────────────────────────
const STEPS = [
  { label: 'Service', shortLabel: '1' },
  { label: 'Overview', shortLabel: '2' },
  { label: 'Details', shortLabel: '3' },
  { label: 'Consent', shortLabel: '4' },
  { label: 'Review', shortLabel: '5' },
];

interface StepProgressProps {
  currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => (
  <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-8">
    {STEPS.map((step, i) => {
      const stepNum = i + 1;
      const isDone = stepNum < currentStep;
      const isActive = stepNum === currentStep;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : isActive
                  ? 'bg-[#004E98] text-white shadow-md'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
            </div>
            <span
              className={`text-[10px] font-semibold hidden sm:block ${
                isActive ? 'text-[#004E98]' : isDone ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-all ${isDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
export const SubmitApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);

  // ─── Shared Applicant Details ──────────────────────────────────────────────
  const [applicantName, setApplicantName] = useState(
    user?.username && !user.username.startsWith('citizen_') ? user.username : 'Priya Ramesh Sharma'
  );
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [district, setDistrict] = useState('Pune');
  const [addressLine, setAddressLine] = useState('Flat 402, Shanti Heights, Kothrud, Pune');

  // ─── Service-Specific: Scholarship Details ─────────────────────────────────
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [instituteName, setInstituteName] = useState('Government College of Engineering, Pune (COEP)');
  const [courseDetails, setCourseDetails] = useState('B.Tech in Computer Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [rollNumber, setRollNumber] = useState('COEP-2024-CS-084');
  const [scholarshipScheme, setScholarshipScheme] = useState(
    'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Scheme'
  );

  // ─── Service-Specific: Income Certificate Details ──────────────────────────
  const [occupation, setOccupation] = useState('Agriculture & Farming');
  const [incomeSource, setIncomeSource] = useState('Agricultural Harvest & Dairy');
  const [annualIncome, setAnnualIncome] = useState('1,20,000');
  const [employerName, setEmployerName] = useState('Self-Managed Farmland');
  const [certificatePurpose, setCertificatePurpose] = useState(
    'Higher Education Admission & Fee Concession'
  );

  // ─── Step 4: Consents ──────────────────────────────────────────────────────
  const [consentRevenue, setConsentRevenue] = useState(false);
  const [consentLand, setConsentLand] = useState(false);
  const [consentWelfare, setConsentWelfare] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isIncomeService = selectedService?.id === 'income_certificate';
  const isScholarshipService = selectedService?.id === 'scholarship';

  // ─── Reset Service-Specific State When Selecting Service ───────────────────
  const selectService = (service: ServiceDefinition) => {
    setSelectedService(service);
    setConsentRevenue(false);
    setConsentLand(false);
    setConsentWelfare(false);
    setErrorMessage(null);

    // Reset service-specific inputs cleanly based on chosen service
    if (service.id === 'income_certificate') {
      setInstituteName('');
      setCourseDetails('');
      setRollNumber('');
      setOccupation('Agriculture & Farming');
      setIncomeSource('Agricultural Harvest & Dairy');
      setAnnualIncome('1,20,000');
      setCertificatePurpose('Higher Education Admission & Fee Concession');
    } else {
      setAcademicYear('2026-2027');
      setInstituteName('Government College of Engineering, Pune (COEP)');
      setCourseDetails('B.Tech in Computer Engineering');
      setYearOfStudy('3rd Year');
      setRollNumber('COEP-2024-CS-084');
      setScholarshipScheme('Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Scheme');
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getConsentsForService = (service: ServiceDefinition) => {
    const consents = [];
    if (service.departments.includes('Revenue')) {
      consents.push({
        key: 'revenue',
        dept: 'Revenue & Income Tax Department',
        purpose: 'Verify annual family income and tax clearance records',
        icon: <Building className="w-4 h-4" />,
        value: consentRevenue,
        setter: setConsentRevenue,
      });
    }
    if (service.departments.includes('Land Records')) {
      consents.push({
        key: 'land',
        dept: 'Land Records Department (Mahabhulekh)',
        purpose: 'Verify land & property ownership and domicile status',
        icon: <MapPin className="w-4 h-4" />,
        value: consentLand,
        setter: setConsentLand,
      });
    }
    if (service.departments.includes('Welfare')) {
      consents.push({
        key: 'welfare',
        dept: 'Social Welfare & Empowerment Department',
        purpose: 'Verify direct benefit transfer (DBT) eligibility & entitlements',
        icon: <HeartHandshake className="w-4 h-4" />,
        value: consentWelfare,
        setter: setConsentWelfare,
      });
    }
    return consents;
  };

  const allConsentsGranted = (() => {
    if (!selectedService) return false;
    const consents = getConsentsForService(selectedService);
    return consents.every((c) => c.value);
  })();

  // ─── Service-Specific Form Validation ──────────────────────────────────────
  const isDetailsValid = (): boolean => {
    if (!applicantName.trim() || !mobileNumber.trim() || !district.trim()) {
      return false;
    }
    if (isIncomeService) {
      return Boolean(occupation.trim() && incomeSource.trim() && annualIncome.trim() && certificatePurpose.trim());
    }
    if (isScholarshipService) {
      return Boolean(instituteName.trim() && courseDetails.trim() && academicYear.trim());
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedService) return;
    if (!allConsentsGranted) {
      setErrorMessage('Please grant all required departmental consents to proceed.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const idempotencyKey = generateIdempotencyKey();
    const applicationData = {
      applicantName,
      mobileNumber,
      district,
      addressLine,
      ...(isScholarshipService
        ? {
            academicYear,
            instituteName,
            courseDetails,
            yearOfStudy,
            rollNumber,
            scholarshipScheme,
          }
        : {}),
      ...(isIncomeService
        ? {
            occupation,
            incomeSource,
            annualIncome,
            employerName,
            certificatePurpose,
          }
        : {}),
    };

    try {
      const response = await applicationsApi.submitApplication(
        {
          service_type: selectedService.serviceType,
          purpose: selectedService.purpose,
          idempotency_key: idempotencyKey,
          application_data: applicationData,
        },
        idempotencyKey
      );
      navigate(`/applications/${response.id}/status`, {
        state: {
          newlyCreated: true,
          applicationNumber: response.application_number,
          serviceName: selectedService.name,
        },
      });
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Failed to submit application. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {step === 1
              ? t('apply.chooseService', 'What would you like to apply for?')
              : step === 2
              ? `${selectedService?.name} — ${t('apply.serviceOverview', 'Service Overview')}`
              : step === 3
              ? `${selectedService?.name} — ${t('apply.stepDetails', 'Application Details')}`
              : step === 4
              ? `${selectedService?.name} — ${t('apply.stepConsent', 'Consent to Verify Information')}`
              : `${selectedService?.name} — ${t('apply.stepReview', 'Review & Submit')}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {step === 1
              ? t('apply.chooseServiceSubtitle', 'Choose a government service. FISOP will guide you through the service-specific information and verification.')
              : selectedService?.name}
          </p>
        </div>
      </div>

      {/* Step progress (steps 2–5 only) */}
      {step > 1 && <StepProgress currentStep={step} />}

      {/* Error Banner */}
      {errorMessage && (
        <ErrorBanner
          title="Submission Error"
          message={errorMessage}
          onRetry={() => setErrorMessage(null)}
        />
      )}

      {/* ─── STEP 1: SERVICE CATALOGUE ─────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col gap-3 shadow-sm transition-all duration-200 ${
                service.isActive
                  ? 'border-slate-200 hover:border-[#004E98] hover:shadow-md cursor-pointer group'
                  : 'border-slate-100 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => service.isActive && selectService(service)}
              role={service.isActive ? 'button' : undefined}
              tabIndex={service.isActive ? 0 : -1}
              onKeyDown={(e) => e.key === 'Enter' && service.isActive && selectService(service)}
              aria-label={service.isActive ? `Apply for ${service.name}` : `${service.name} — ${service.badge}`}
            >
              {/* Badge */}
              {service.badge && (
                <span
                  className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    service.badge === 'Coming Soon'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {service.badge}
                </span>
              )}

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  service.isActive
                    ? 'bg-[#004E98]/10 text-[#004E98] group-hover:bg-[#004E98] group-hover:text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {service.icon}
              </div>

              {/* Text */}
              <div className="flex-1">
                <h3
                  className={`font-bold text-sm ${
                    service.isActive ? 'text-slate-900 group-hover:text-[#004E98]' : 'text-slate-500'
                  } transition-colors`}
                >
                  {service.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{service.shortDesc}</p>
              </div>

              {/* Departments */}
              <div className="flex flex-wrap gap-1.5">
                {service.departments.map((dept) => (
                  <span key={dept} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {dept}
                  </span>
                ))}
              </div>

              {/* Processing time + CTA */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{service.processing}</span>
                </div>
                {service.isActive && (
                  <span className="text-xs font-bold text-[#004E98] group-hover:text-[#FF6700] transition-colors flex items-center gap-1">
                    {t('apply.startApp', 'Start Application')} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── STEP 2: SERVICE OVERVIEW ──────────────────────────────────── */}
      {step === 2 && selectedService && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            {/* Service Header Tag */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#004E98]/5 border border-[#004E98]/20">
              <div className="w-9 h-9 rounded-lg bg-[#004E98] text-white flex items-center justify-center shrink-0">
                {selectedService.icon}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{selectedService.name}</h2>
                <p className="text-xs text-slate-500">{selectedService.shortDesc}</p>
              </div>
            </div>

            {/* What you'll provide */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#004E98]" />
                {t('apply.whatYouNeed', "What you'll need to provide")}
              </h3>
              <ul className="space-y-2">
                {selectedService.whatYouProvide.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-[#004E98]/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#004E98]">{i + 1}</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What FISOP verifies */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t('apply.howFisopVerifies', 'How FISOP will verify your information')}
              </h3>
              <ul className="space-y-2">
                {selectedService.whatFisopVerifies.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Department flow */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-[#FF6700]" />
                {t('apply.deptInvolved', 'Departments involved')}
              </h3>
              <div className="flex flex-col items-center gap-0">
                <div className="flex flex-col items-center">
                  <div className="w-28 py-2 bg-[#004E98] text-white rounded-xl text-xs font-bold text-center">
                    YOU
                  </div>
                  <div className="w-0.5 h-5 bg-slate-300" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-36 py-2 bg-[#FF6700] text-white rounded-xl text-xs font-bold text-center">
                    FISOP GATEWAY
                  </div>
                  <div className="w-0.5 h-5 bg-slate-300" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedService.departments.map((dept) => (
                    <div key={dept} className="py-2 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                      {dept}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Processing time */}
            <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Estimated processing: <strong className="text-slate-900">{selectedService.processing}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {t('apply.proceedToForm', 'Start Application')}
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: SERVICE-SPECIFIC APPLICATION DETAILS ─────────────── */}
      {step === 3 && selectedService && (
        <div className="space-y-6">
          {/* SECTION 1: APPLICANT DETAILS (SHARED) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-[#004E98]" />
              <h2 className="text-base font-bold text-slate-900">1. Applicant Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="applicant-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="applicant-name"
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                  placeholder="E.g. Priya Ramesh Sharma"
                />
              </div>

              <div>
                <label htmlFor="mobile-number" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">+91</span>
                  <input
                    id="mobile-number"
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 py-2.5 pl-12 pr-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="district" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  District (Maharashtra) <span className="text-red-500">*</span>
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                >
                  <option value="Pune">Pune</option>
                  <option value="Mumbai City">Mumbai City</option>
                  <option value="Mumbai Suburban">Mumbai Suburban</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Nashik">Nashik</option>
                  <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar (Aurangabad)</option>
                  <option value="Kolhapur">Kolhapur</option>
                  <option value="Solapur">Solapur</option>
                  <option value="Thane">Thane</option>
                  <option value="Amravati">Amravati</option>
                </select>
              </div>

              <div>
                <label htmlFor="address-line" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Residential Address
                </label>
                <input
                  id="address-line"
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                  placeholder="House / Flat No., Street, Area"
                />
              </div>
            </div>
          </div>

          {/* ─── SERVICE SPECIFIC: INCOME CERTIFICATE ───────────────────────── */}
          {isIncomeService && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">2. Income & Occupation Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="occupation" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Occupation / Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                  >
                    <option value="Agriculture & Farming">Agriculture & Farming</option>
                    <option value="Salaried (Private Sector)">Salaried (Private Sector)</option>
                    <option value="Salaried (Government / PSU)">Salaried (Government / PSU)</option>
                    <option value="Business / Self-Employed">Business / Self-Employed</option>
                    <option value="Daily Wage / Informal Worker">Daily Wage / Informal Worker</option>
                    <option value="Professional Practice">Professional Practice (Doctor / CA / Lawyer)</option>
                    <option value="Retired / Pensioner">Retired / Pensioner</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="income-source" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Income Source <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="income-source"
                    type="text"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                    placeholder="E.g. Agricultural produce, Shop revenue, Salary"
                  />
                </div>

                <div>
                  <label htmlFor="annual-income" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Declared Annual Family Income (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">₹</span>
                    <input
                      id="annual-income"
                      type="text"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 py-2.5 pl-8 pr-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all font-semibold"
                      placeholder="E.g. 1,20,000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="employer-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Employer / Business / Farm Name
                  </label>
                  <input
                    id="employer-name"
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                    placeholder="E.g. Farm Survey No. 42 or Self-employed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="certificate-purpose" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Purpose of Certificate <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="certificate-purpose"
                    value={certificatePurpose}
                    onChange={(e) => setCertificatePurpose(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                  >
                    <option value="Higher Education Admission & Fee Concession">Higher Education Admission & Fee Concession</option>
                    <option value="Government Welfare Scheme Eligibility">Government Welfare Scheme Eligibility</option>
                    <option value="Housing Scheme Subsidy Application">Housing Scheme Subsidy Application</option>
                    <option value="Ration Card / Food Security Program">Ration Card / Food Security Program</option>
                    <option value="Official Court / Bank Verification">Official Court / Bank Verification</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800">
                  <strong>Zero Physical Document Submission: </strong>
                  FISOP will verify declared income directly against Revenue Department and tax records via digital interoperability.
                </p>
              </div>
            </div>
          )}

          {/* ─── SERVICE SPECIFIC: SCHOLARSHIP DETAILS ───────────────────────── */}
          {isScholarshipService && (
            <>
              {/* SECTION 2: ACADEMIC DETAILS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <School className="w-5 h-5 text-[#004E98]" />
                  <h2 className="text-base font-bold text-slate-900">2. Academic Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="academic-year" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Academic Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="academic-year"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                    >
                      <option value="2026-2027">2026 – 2027 (Current Term)</option>
                      <option value="2025-2026">2025 – 2026 (Previous Term)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="year-of-study" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Current Year of Study <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="year-of-study"
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                    >
                      <option value="1st Year">1st Year (Fresher)</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year / 4th Year">Final Year / 4th Year</option>
                      <option value="Post-Graduate 1st Year">Post-Graduate 1st Year</option>
                      <option value="Post-Graduate 2nd Year">Post-Graduate 2nd Year</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="institute-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Educational Institution / College <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="institute-name"
                      type="text"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                      placeholder="E.g. Government College of Engineering, Pune"
                    />
                  </div>

                  <div>
                    <label htmlFor="course-details" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Course / Degree Program <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="course-details"
                      type="text"
                      value={courseDetails}
                      onChange={(e) => setCourseDetails(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                      placeholder="E.g. B.Tech Computer Engineering"
                    />
                  </div>

                  <div>
                    <label htmlFor="roll-number" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student Roll / Enrollment ID
                    </label>
                    <input
                      id="roll-number"
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                      placeholder="E.g. COEP-2024-CS-084"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SCHEME SELECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <BookOpen className="w-5 h-5 text-[#FF6700]" />
                  <h2 className="text-base font-bold text-slate-900">3. Scheme Category</h2>
                </div>

                <div>
                  <label htmlFor="scholarship-scheme" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Government Scheme <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="scholarship-scheme"
                    value={scholarshipScheme}
                    onChange={(e) => setScholarshipScheme(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 py-2.5 px-3.5 bg-white text-slate-900 text-sm focus:outline-none focus:border-[#004E98] focus:ring-2 focus:ring-[#004E98]/20 transition-all"
                  >
                    <option value="Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Scheme">
                      Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Scheme (EBC)
                    </option>
                    <option value="Post-Matric Scholarship for SC/ST/OBC Students">
                      Post-Matric Scholarship for SC/ST/OBC Students (MahaDBT)
                    </option>
                    <option value="Dr. Punjabrao Deshmukh Hostel Maintenance Allowance">
                      Dr. Punjabrao Deshmukh Hostel Maintenance Allowance
                    </option>
                    <option value="State Minority Scholarship for Technical & Professional Courses">
                      State Minority Scholarship for Technical & Professional Courses
                    </option>
                  </select>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-800">
                    FISOP automatically evaluates family income and social welfare records to establish eligibility for the selected scheme.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!isDetailsValid()}
              onClick={() => setStep(4)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Consent
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: CONSENT ───────────────────────────────────────────── */}
      {step === 4 && selectedService && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-5 h-5 text-[#004E98] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                Under <strong>Maharashtra Digital Interoperability Guidelines</strong>, your data is never transferred to commercial third parties. Each verification is cryptographically logged in the central audit registry.
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">{t('apply.consentTitle', 'Give consent to verify your information')}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The following departmental consents are required for <strong>{selectedService.name}</strong>:
              </p>
            </div>

            {getConsentsForService(selectedService).map((consent) => (
              <label
                key={consent.key}
                className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#004E98]/50 hover:bg-slate-50/80 cursor-pointer transition-all"
                htmlFor={`consent-${consent.key}`}
              >
                <input
                  id={`consent-${consent.key}`}
                  type="checkbox"
                  checked={consent.value}
                  onChange={(e) => consent.setter(e.target.checked)}
                  className="w-5 h-5 rounded text-[#004E98] focus:ring-[#004E98] border-slate-300 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#004E98]">{consent.icon}</span>
                    <span className="font-semibold text-slate-900 text-sm">{consent.dept}</span>
                  </div>
                  <p className="text-xs text-slate-600">{consent.purpose}</p>
                </div>
                {consent.value && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />}
              </label>
            ))}

            {!allConsentsGranted && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>All department consents are required to process your {selectedService.name}.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" size="md" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!allConsentsGranted}
              onClick={() => setStep(5)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {t('apply.giveConsent', 'Give Consent & Continue')}
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 5: REVIEW & SUBMIT ───────────────────────────────────── */}
      {step === 5 && selectedService && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {selectedService.name} — Application Summary
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#004E98]/10 text-[#004E98] font-bold">
                {selectedService.name}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Applicant Info */}
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-500">Applicant Name</span>
                <span className="font-bold text-slate-900">{applicantName}</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-500">Applicant ID</span>
                <span className="font-mono font-bold text-slate-900">
                  {user?.canonical_citizen_id || user?.preferred_username || 'CIT-000001'}
                </span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-500">Contact Number</span>
                <span className="font-semibold text-slate-900">+91 {mobileNumber}</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-500">District & Address</span>
                <span className="font-semibold text-slate-900 text-right">{district}, Maharashtra</span>
              </div>

              {/* Service-Specific Income Certificate Fields */}
              {isIncomeService && (
                <>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Occupation</span>
                    <span className="font-semibold text-slate-900">{occupation}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Primary Income Source</span>
                    <span className="font-semibold text-slate-900">{incomeSource}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Declared Annual Family Income</span>
                    <span className="font-bold text-emerald-700">₹ {annualIncome}</span>
                  </div>
                  {employerName && (
                    <div className="flex justify-between py-2.5 text-sm">
                      <span className="text-slate-500">Employer / Farm / Business</span>
                      <span className="font-semibold text-slate-900">{employerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Certificate Purpose</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%]">{certificatePurpose}</span>
                  </div>
                </>
              )}

              {/* Service-Specific Scholarship Fields */}
              {isScholarshipService && (
                <>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Scholarship Scheme</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%]">{scholarshipScheme}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Academic Year</span>
                    <span className="font-semibold text-slate-900">{academicYear}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Educational Institution</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[60%]">{instituteName}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-500">Course & Year of Study</span>
                    <span className="font-semibold text-slate-900">{courseDetails} ({yearOfStudy})</span>
                  </div>
                  {rollNumber && (
                    <div className="flex justify-between py-2.5 text-sm">
                      <span className="text-slate-500">Roll / Enrollment ID</span>
                      <span className="font-mono font-semibold text-slate-900">{rollNumber}</span>
                    </div>
                  )}
                </>
              )}

              {/* Consents */}
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-slate-500">Consents granted</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4" />
                  {selectedService.departments.join(', ')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-sky-50 border border-sky-200">
              <FileCheck2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-800">
                <strong>Duplicate-safe submission: </strong>
                A unique idempotency key will be generated for this submission to guarantee duplicate prevention across the gateway.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="secondary" size="md" onClick={() => setStep(4)} disabled={isSubmitting} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              rightIcon={<Send className="w-5 h-5" />}
              className="px-6 py-3 font-semibold"
            >
              {t('apply.submitApplication', 'Submit Application')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
