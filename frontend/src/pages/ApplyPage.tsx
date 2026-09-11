import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GraduationCap, ArrowRight } from 'lucide-react';

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [academicYear, setAcademicYear] = useState('2026 - 2027 (Current Term)');
  const [institution, setInstitution] = useState('Government College of Engineering, Pune');

  const handleProceed = () => {
    // Phase 1 navigation foundation
    alert('Phase 1 Foundation: Scheme selected! Proceeding to next steps in future phases.');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Apply for government scholarship
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Single application for cross-departmental verification &amp; eligibility determination.
          </p>
        </div>

        {/* STEP WIZARD INDICATOR */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0c2b4e] text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STEP 1</p>
              <p className="text-xs font-bold text-slate-900">Scheme selection</p>
            </div>
          </div>

          <div className="hidden sm:block flex-1 h-[2px] bg-slate-200 mx-4"></div>

          {/* Step 2 */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STEP 2</p>
              <p className="text-xs font-bold text-slate-700">Department consents</p>
            </div>
          </div>

          <div className="hidden sm:block flex-1 h-[2px] bg-slate-200 mx-4"></div>

          {/* Step 3 */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STEP 3</p>
              <p className="text-xs font-bold text-slate-700">Review &amp; submit</p>
            </div>
          </div>

        </div>

        {/* SCHEME SELECTION FORM CARD */}
        <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Select government scholarship scheme</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose the service and academic details</p>
          </div>

          {/* Program Selector Card */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Scholarship program</label>
            <div className="border-2 border-[#0c2b4e] rounded-xl p-4 bg-blue-50/20 relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#0c2b4e] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">
                    Maharashtra Post-Matric Merit Scholarship 2026
                  </h3>
                  <span className="bg-[#0c2b4e] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Direct benefit transfer scholarship covering full tuition and maintenance allowance for eligible students.
                </p>
              </div>
            </div>
          </div>

          {/* Academic Year Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Academic year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
            >
              <option value="2026 - 2027 (Current Term)">2026 - 2027 (Current Term)</option>
              <option value="2025 - 2026">2025 - 2026</option>
            </select>
          </div>

          {/* Institution Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Educational institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleProceed}
              className="bg-[#0c2b4e] hover:bg-[#0b2545] text-white text-xs font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition shadow-sm"
            >
              <span>Proceed to department consents</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
};
