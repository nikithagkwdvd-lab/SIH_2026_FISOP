import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FileText, PlusCircle, LogOut, User, Building2, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated, devLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };


  const isCitizen = user?.roles.includes('CITIZEN');
  const isOfficial = user?.roles.includes('DEPARTMENT_OFFICIAL');
  const isAdmin = user?.roles.includes('ADMIN') || user?.roles.includes('OPERATIONS');

  const getDisplayName = () => {
    if (!user) return 'Guest';
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace('.', ' ');
    }
    return user.username || user.preferred_username || 'Authenticated User';
  };

  const getRoleBadge = () => {
    if (isCitizen) return 'Citizen';
    if (isOfficial) return 'Department Official';
    if (isAdmin) return 'Administrator';
    return 'User';
  };

  return (
    <header className="bg-[#0b2545] text-white border-t-4 border-[#d97706] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <Link
            to={
              !isAuthenticated
                ? '/login'
                : isCitizen
                ? '/my-applications'
                : isOfficial
                ? '/department'
                : '/admin'
            }
            className="flex items-center gap-3 group"
          >
            <img src="/emblem.svg" alt="Government Seal" className="w-10 h-10 object-contain" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">FISOP</span>
                <span className="bg-[#1e3a8a] text-blue-100 text-xs px-2 py-0.5 rounded font-semibold border border-blue-700/50">
                  Gov of Maharashtra
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-medium tracking-wide">
                Federated Interoperability &amp; Service Orchestration Platform
              </span>
            </div>
          </Link>

          {/* Dynamic Navigation Items */}
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              
              {/* Citizen Navigation */}
              {isCitizen && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/my-applications"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      location.pathname === '/my-applications'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>My applications</span>
                  </Link>

                  <Link
                    to="/apply"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      location.pathname === '/apply'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-900/60 text-blue-100 border border-blue-700/60 hover:bg-blue-800'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New application</span>
                  </Link>
                </div>
              )}

              {/* Department Official Navigation */}
              {isOfficial && !isCitizen && (
                <Link
                  to="/department"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    location.pathname === '/department'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Official Review Queue</span>
                </Link>
              )}

              {/* Platform Admin Navigation */}
              {isAdmin && !isCitizen && !isOfficial && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    location.pathname === '/admin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform Admin</span>
                </Link>
              )}

              {/* Authenticated User Session Info & Sign Out */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-700/80">
                <div className="flex items-center gap-2 text-xs font-medium">

                  <User className="w-3.5 h-3.5 text-slate-300" />
                  <span className="font-bold text-white max-w-[140px] truncate" title={getDisplayName()}>
                    {getDisplayName()}
                  </span>
                  <span className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                    {getRoleBadge()}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 bg-slate-800/40 transition"
                  title="Sign out of FISOP"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              </div>


            </div>
          )}

        </div>
      </div>
    </header>
  );
};
