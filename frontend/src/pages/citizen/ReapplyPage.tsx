import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  HeartHandshake,
  GraduationCap,
  FileText,
  ShieldCheck,
  Send,
  Info,
  Sparkles,
} from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';

const generateIdempotencyKey = (): string =>
  `REAPPLY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

export const ReapplyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 1. Fetch original application
  const {
    data: parentApp,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getApplication(id!),
    enabled: Boolean(id),
  });

  // Form Fields State
  const [applicantName, setApplicantName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [addressLine, setAddressLine] = useState('');

  // Scholarship Fields
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [instituteName, setInstituteName] = useState('');
  const [courseDetails, setCourseDetails] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('1st Year');
  const [rollNumber, setRollNumber] = useState('');
  const [scholarshipScheme, setScholarshipScheme] = useState('');

  // Income Certificate Fields
  const [occupation, setOccupation] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [certificatePurpose, setCertificatePurpose] = useState('');

  // Consents
  const [consentRevenue, setConsentRevenue] = useState(true);
  const [consentLand, setConsentLand] = useState(true);
  const [consentWelfare, setConsentWelfare] = useState(true);
  const [citizenConfirmed, setCitizenConfirmed] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill from parent application data
  useEffect(() => {
    if (parentApp) {
      const data = parentApp.application_data || {};
      setApplicantName(data.applicantName || 'Citizen User');
      setMobileNumber(data.mobileNumber || '9876543210');
      setDistrict(data.district || 'Pune');
      setAddressLine(data.addressLine || 'Flat 402, Shivneri Residency, Kothrud');

      // Scholarship
      setAcademicYear(data.academicYear || '2026-2027');
      setInstituteName(data.instituteName || 'Government College of Engineering, Pune (COEP)');
      setCourseDetails(data.courseDetails || 'B.Tech in Computer Engineering');
      setYearOfStudy(data.yearOfStudy || '3rd Year');
      setRollNumber(data.rollNumber || 'COEP-2024-CS-084');
      setScholarshipScheme(
        data.scholarshipScheme ||
          'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Scheme'
      );

      // Income
      setOccupation(data.occupation || 'Agriculture & Farming');
      setIncomeSource(data.incomeSource || 'Agricultural Harvest');
      setAnnualIncome(data.annualIncome || '1,80,000');
      setEmployerName(data.employerName || 'Self-Managed Farmland');
      setCertificatePurpose(
        data.certificatePurpose || 'Higher Education Admission & Fee Concession'
      );
    }
  }, [parentApp]);

  // Reapply Mutation
  const reapplyMutation = useMutation({
    mutationFn: async () => {
      if (!parentApp) throw new Error('Missing parent application');
      const idempotencyKey = generateIdempotencyKey();

      const isScholarship = parentApp.service_type === 'SCHOLARSHIP';
      const isIncome = parentApp.service_type === 'INCOME_CERTIFICATE';

      const correctedData: Record<string, any> = {
        applicantName,
        mobileNumber,
        district,
        addressLine,
        ...(isScholarship
          ? {
              academicYear,
              instituteName,
              courseDetails,
              yearOfStudy,
              rollNumber,
              scholarshipScheme,
            }
          : {}),
        ...(isIncome
          ? {
              occupation,
              incomeSource,
              annualIncome,
              employerName,
              certificatePurpose,
            }
          : {}),
      };

      return applicationsApi.submitReapplication(
        parentApp.id,
        {
          service_type: parentApp.service_type,
          idempotency_key: idempotencyKey,
          application_data: correctedData,
        },
        idempotencyKey
      );
    },
    onSuccess: (newApp) => {
      navigate(`/applications/${newApp.id}/status`, {
        state: {
          newlyCreated: true,
          applicationNumber: newApp.application_number,
          serviceName: parentApp?.service_type || 'Government Service',
        },
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Reapplication submission failed.';
      setErrorMessage(msg);
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullPage label="Loading previous application record for smart reapplication..." />;
  }

  if (isError || !parentApp) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/my-applications">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to my applications
          </Button>
        </Link>
        <ErrorBanner
          title="Cannot load original application"
          message={error instanceof Error ? error.message : 'Application not found.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (parentApp.status !== 'REJECTED') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/my-applications">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to my applications
          </Button>
        </Link>
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Application is not in REJECTED status</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Smart Reapplication is only available for rejected applications. Current status of{' '}
            <span className="font-mono font-bold">{parentApp.application_number}</span> is{' '}
            <Badge variant="info" size="sm">{parentApp.status}</Badge>.
          </p>
          <div className="pt-2">
            <Link to={`/applications/${parentApp.id}/status`}>
              <Button variant="secondary" size="sm">View Application Status</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const affectedFieldsList = parentApp.affected_fields || [];
  const isAffected = (fieldName: string) => affectedFieldsList.includes(fieldName);

  const isScholarship = parentApp.service_type === 'SCHOLARSHIP';
  const isIncome = parentApp.service_type === 'INCOME_CERTIFICATE';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to={`/applications/${parentApp.id}/status`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to application status
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="md">
            <RotateCcw className="w-3.5 h-3.5 mr-1 inline" />
            Smart Reapplication
          </Badge>
        </div>
      </div>

      {/* Page Title & Context */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FF6700] uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          Closed-Loop Citizen Service Delivery
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Review & Reapply — {parentApp.service_type}
        </h1>
        <p className="text-xs text-slate-500">
          Your previous application <strong className="font-mono text-slate-700">{parentApp.application_number}</strong> was evaluated by the department.
          Review the rejection reason below, correct the highlighted fields, and submit an updated application.
        </p>
      </div>

      {/* Rejection Reason & Guidance Box */}
      <div className="bg-gradient-to-br from-red-50 via-white to-amber-50 border-2 border-red-300 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-black text-red-700 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-full">
              Reason for Previous Rejection
            </span>
            <p className="text-sm font-bold text-slate-900">
              {parentApp.rejection_reason || 'Department verification determined that eligibility requirements were not satisfied.'}
            </p>
            {parentApp.officer_remarks && (
              <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                <strong>Officer guidance:</strong> {parentApp.officer_remarks}
              </p>
            )}
          </div>
        </div>

        {affectedFieldsList.length > 0 && (
          <div className="pt-3 border-t border-red-200">
            <span className="text-[11px] font-bold text-amber-800 block mb-1.5">
              Highlighted Fields Requiring Your Revision:
            </span>
            <div className="flex flex-wrap gap-2">
              {affectedFieldsList.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-lg text-xs font-bold"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  {f} (Correction Needed)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Card: Pre-filled with highlighted affected fields */}
      <Card
        title="Application Details"
        subtitle="Valid data is pre-filled from your previous submission. Update any fields that require revision."
      >
        <div className="space-y-6">
          {/* Identity & Contact Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Applicant & Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                    isAffected('applicantName')
                      ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                  }`}
                />
                {isAffected('applicantName') && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Flagged by reviewing officer
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                    isAffected('mobileNumber')
                      ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District / Domicile
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                    isAffected('district')
                      ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                    isAffected('addressLine')
                      ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Service Specific: Scholarship Form Fields */}
          {(isScholarship || (!isScholarship && !isIncome)) && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Scholarship & Academic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scholarship Scheme
                  </label>
                  <input
                    type="text"
                    value={scholarshipScheme}
                    onChange={(e) => setScholarshipScheme(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('scholarshipScheme')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institute / University Name
                  </label>
                  <input
                    type="text"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('instituteName')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                  {isAffected('instituteName') && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Flagged by reviewing officer
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course / Degree Details
                  </label>
                  <input
                    type="text"
                    value={courseDetails}
                    onChange={(e) => setCourseDetails(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('courseDetails')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Roll / Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('rollNumber')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('academicYear')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Family Income (Rs.)
                  </label>
                  <input
                    type="text"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('annualIncome')
                        ? 'border-red-400 bg-red-50/50 ring-2 ring-red-200 font-bold text-red-900'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                  {isAffected('annualIncome') && (
                    <p className="text-[11px] text-red-700 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      Must be revised to satisfy the scholarship ceiling limit
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Income Source
                  </label>
                  <input
                    type="text"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('incomeSource')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Service Specific: Income Certificate Fields */}
          {isIncome && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Income & Livelihood Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Occupation
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('occupation')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Gross Income (Rs.)
                  </label>
                  <input
                    type="text"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('annualIncome')
                        ? 'border-red-400 bg-red-50/50 ring-2 ring-red-200 font-bold'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Income Source / Employer
                  </label>
                  <input
                    type="text"
                    value={incomeSource}
                    onChange={(e) => setIncomeSource(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('incomeSource')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Certificate Purpose
                  </label>
                  <input
                    type="text"
                    value={certificatePurpose}
                    onChange={(e) => setCertificatePurpose(e.target.value)}
                    className={`w-full rounded-lg border p-2.5 text-sm transition-all ${
                      isAffected('certificatePurpose')
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-200'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#004E98]'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Departmental Consent Reaffirmation */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Departmental Verification Consents
            </h3>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentRevenue}
                  onChange={(e) => setConsentRevenue(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#004E98] focus:ring-[#004E98]"
                />
                <span>
                  <strong>Revenue Department:</strong> I consent to automated verification of family income and tax clearance records.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentLand}
                  onChange={(e) => setConsentLand(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#004E98] focus:ring-[#004E98]"
                />
                <span>
                  <strong>Land Records (Mahabhulekh):</strong> I consent to verification of land parcel ownership and residential records.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentWelfare}
                  onChange={(e) => setConsentWelfare(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#004E98] focus:ring-[#004E98]"
                />
                <span>
                  <strong>Social Welfare Department:</strong> I consent to verification of DBT scheme benefit entitlement.
                </span>
              </label>
            </div>
          </div>

          {/* Final Citizen Declaration */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={citizenConfirmed}
                onChange={(e) => setCitizenConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-blue-400 text-[#004E98] focus:ring-[#004E98]"
              />
              <span className="text-xs text-blue-900 font-medium leading-relaxed">
                I declare that I have reviewed the reasons for previous rejection, updated the required information accurately, and hereby submit this official reapplication.
              </span>
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link to={`/applications/${parentApp.id}/status`}>
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!citizenConfirmed) {
                  setErrorMessage('Please check the citizen declaration before submitting.');
                  return;
                }
                if (!consentRevenue || !consentLand || !consentWelfare) {
                  setErrorMessage('Please grant all required departmental consents.');
                  return;
                }
                setErrorMessage(null);
                reapplyMutation.mutate();
              }}
              isLoading={reapplyMutation.isPending}
              disabled={!citizenConfirmed}
              leftIcon={<Send className="w-4 h-4" />}
              className="bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold shadow-md"
            >
              Submit Corrected Application
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
