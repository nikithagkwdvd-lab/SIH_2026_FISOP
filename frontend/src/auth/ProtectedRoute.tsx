import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 border-4 border-gov-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-medium">
            {t('auth.verifyingCredentials', 'Verifying government credentials...')}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to /access (the gateway), preserving the intended destination so
    // ProtectedRoute can restore it after successful authentication.
    return <Navigate to="/access" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Authenticated but not authorized for this route.
    // Send officials to their own area if they have those roles, otherwise back to access.
    if (hasRole(['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS'])) {
      return <Navigate to="/official/queue" replace />;
    }
    if (hasRole('CITIZEN')) {
      return <Navigate to="/my-applications" replace />;
    }
    // No recognized role — return to access page
    return <Navigate to="/access" replace />;
  }

  return <>{children}</>;
};
