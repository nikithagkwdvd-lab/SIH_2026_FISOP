import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListFilter,
  UserCheck,
  FileSpreadsheet,
  Workflow,
  Network,
  BarChart3,
  Bell,
  User,
  HelpCircle,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export interface OfficerSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenHelp?: () => void;
  onOpenProfile?: () => void;
  onOpenNotif?: () => void;
  className?: string;
}

export const OfficerSidebar: React.FC<OfficerSidebarProps> = ({
  activeTab = 'queue',
  onTabChange,
  onOpenHelp,
  onOpenProfile,
  onOpenNotif,
  className = '',
}) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const officerId =
    user?.canonical_citizen_id ||
    (user?.department_code ? `${user.department_code}-OFF-0001` : 'OFF-000001');

  const deptKey = (user?.department_code || 'REV').toUpperCase() === 'WELFARE' ? 'WELF' : (user?.department_code || 'REV').toUpperCase();

  const deptBadges: Record<string, { queue: string; assigned: string; interDept: string }> = {
    REV: { queue: '18', assigned: '7', interDept: '29' },
    LAND: { queue: '14', assigned: '5', interDept: '21' },
    WELF: { queue: '31', assigned: '11', interDept: '42' },
  };

  const currentBadges = deptBadges[deptKey] || deptBadges.REV;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/official/queue',
      active: activeTab === 'dashboard' || (location.pathname === '/official/queue' && activeTab === 'dashboard'),
    },
    {
      id: 'queue',
      label: 'Case Queue',
      icon: ListFilter,
      to: '/official/queue',
      badge: currentBadges.queue,
      active: activeTab === 'queue' || (location.pathname === '/official/queue' && activeTab === 'queue'),
    },
    {
      id: 'assigned',
      label: 'My Assigned Cases',
      icon: UserCheck,
      badge: currentBadges.assigned,
      badgeColor: 'bg-amber-100 text-amber-800',
      active: activeTab === 'assigned',
    },
    {
      id: 'service-requests',
      label: 'Service Requests',
      icon: FileSpreadsheet,
      active: activeTab === 'service-requests',
    },
    {
      id: 'actions',
      label: 'Department Actions',
      icon: Workflow,
      active: activeTab === 'actions',
    },
    {
      id: 'inter-dept',
      label: 'Inter-Department Requests',
      icon: Network,
      badge: currentBadges.interDept,
      badgeColor: 'bg-blue-100 text-blue-800',
      active: activeTab === 'inter-dept',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      to: '/official/operations',
      active: location.pathname === '/official/operations' || activeTab === 'reports',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: '3',
      badgeColor: 'bg-rose-100 text-rose-700',
      action: onOpenNotif,
      active: activeTab === 'notifications',
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      action: onOpenProfile,
      active: activeTab === 'profile',
    },
  ];

  return (
    <aside
      className={`w-64 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-col justify-between select-none ${className}`}
      aria-label="Department portal sidebar navigation"
    >
      <div className="space-y-4">
        {/* Header Label */}
        <div className="px-3 pt-1 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#004E98]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Department Portal
            </span>
          </div>
          {user?.department_code && (
            <span className="text-[10px] text-[#FF6700] font-bold mt-0.5 block">
              {user.department_code} Operational Unit
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.active;

            const content = (
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isCurrent ? 'text-[#004E98]' : 'text-slate-500 group-hover:text-slate-800'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                      item.badgeColor || (isCurrent ? 'bg-[#004E98] text-white' : 'bg-slate-100 text-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            );

            const baseClass = `group w-full flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isCurrent
                ? 'bg-[#004E98]/10 text-[#004E98] font-bold shadow-xs border border-[#004E98]/20'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`;

            if (item.to && !item.action) {
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => onTabChange?.(item.id)}
                  className={baseClass}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.action) item.action();
                  onTabChange?.(item.id);
                }}
                className={baseClass}
              >
                {content}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-slate-200/80 space-y-3">
        {/* Help & Support Button */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Help &amp; Support</span>
        </button>

        {/* Verification Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 text-left space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Department Official</span>
            </div>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed">
            Authenticated via Maharashtra State Interoperability Policies.
          </p>

          <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">ID:</span>
            <span className="font-bold text-[#004E98]">{officerId}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
