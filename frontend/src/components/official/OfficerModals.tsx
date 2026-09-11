import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  Building2,
  HelpCircle,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';

interface OfficerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const OfficerProfileDrawer: React.FC<OfficerProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  const officerId =
    user?.canonical_citizen_id ||
    (user?.department_code ? `${user.department_code}-OFF-0001` : 'OFF-000001');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          <div>
            {/* Header */}
            <div className="p-6 bg-[#002244] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#004E98] border border-white/30 flex items-center justify-center font-bold text-white uppercase text-sm">
                  {user?.preferred_username?.slice(0, 2).toUpperCase() || 'DO'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Department Official Profile</h3>
                  <p className="text-xs text-slate-300">Maharashtra State e-Governance Hub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Authenticated ID Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Official ID
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
                <p className="text-xl font-mono font-black text-[#004E98]">{officerId}</p>
                <p className="text-xs text-slate-600">
                  Authenticated via Maharashtra State Interoperability Policies.
                </p>
              </div>

              {/* Identity Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Account Details
                </h4>
                <div className="divide-y divide-slate-100 text-sm">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Username</span>
                    <span className="font-semibold text-slate-900">
                      {user?.preferred_username || user?.username || 'officer_01'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Role</span>
                    <span className="font-semibold text-slate-900">
                      {user?.roles?.join(', ') || 'DEPARTMENT_OFFICIAL'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-semibold text-slate-900">
                      {user?.department_code || 'REV (Revenue & Tehsildar Office)'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-mono text-xs text-slate-700">
                      {user?.email || 'officer_01@maharashtra.gov.in'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Access Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Security Privileges
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    ✓ Case Approvals
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    ✓ Manual Review
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    ✓ Connector Resumption
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                    ✓ Cross-Dept Telemetry
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 text-center text-xs text-slate-400">
            Protected by Keycloak OIDC Session Token • FISOP PS 26129
          </div>
        </div>
      </div>
    </div>
  );
};

interface OfficerHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficerHelpDrawer: React.FC<OfficerHelpDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
          <div>
            <div className="p-6 bg-[#002244] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#FF6700]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Department Official Help</h3>
                  <p className="text-xs text-slate-300">Operational Guidance &amp; Escalations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Standard Operating Procedures
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <p className="font-bold text-slate-900">How do I process a pending application?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Click "View &amp; Process →" on any case row to inspect verified cross-departmental payloads and execute Approve or Reject actions.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <p className="font-bold text-slate-900">What to do when status is 'Waiting for Dept'?</p>
                    <p className="text-slate-600 leading-relaxed">
                      This indicates a temporary connector hold. Once the external department service reconnects, click "Resume Stuck Workflow" in the case detail screen.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <p className="font-bold text-slate-900">How are SLAs calculated?</p>
                    <p className="text-slate-600 leading-relaxed">
                      State Citizen Charter mandates a maximum 7-day turnaround for certificate verifications. Applications with &lt; 2 days remaining are highlighted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Emergency Department Support
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-[#004E98]" />
                    <span>State Tech Desk: 1800-123-FISOP (Ext. 402)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-[#004E98]" />
                    <span>it-support@fisop.maharashtra.gov.in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 text-center text-xs text-slate-400">
            Maharashtra State Interoperability Platform v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};
