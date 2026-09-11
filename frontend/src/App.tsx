import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ServicesPage } from './pages/ServicesPage';
import { SitemapPage } from './pages/SitemapPage';
import { AboutPage } from './pages/AboutPage';
import { HelpPage } from './pages/HelpPage';
import { AccessPage } from './pages/auth/AccessPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SubmitApplicationPage } from './pages/citizen/SubmitApplicationPage';
import { ApplicationStatusPage } from './pages/citizen/ApplicationStatusPage';
import { MyApplicationsPage } from './pages/citizen/MyApplicationsPage';
import { ReapplyPage } from './pages/citizen/ReapplyPage';
import { CaseQueuePage } from './pages/official/CaseQueuePage';
import { CaseDetailPage } from './pages/official/CaseDetailPage';
import { OperationsDashboardPage } from './pages/official/OperationsDashboardPage';
import { AiMappingReviewPage } from './pages/admin/AiMappingReviewPage';
import { CanonicalSchemaPage } from './pages/admin/CanonicalSchemaPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing & Access Flow Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/sitemap" element={<SitemapPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Layout Routes */}
            <Route element={<AppLayout />}>
              {/* Citizen Routes */}
              <Route
                path="/my-applications"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'DEPARTMENT_OFFICIAL']}>
                    <MyApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/apply"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'DEPARTMENT_OFFICIAL']}>
                    <SubmitApplicationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id/status"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'DEPARTMENT_OFFICIAL']}>
                    <ApplicationStatusPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id/reapply"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'DEPARTMENT_OFFICIAL']}>
                    <ReapplyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN', 'DEPARTMENT_OFFICIAL']}>
                    <ApplicationStatusPage />
                  </ProtectedRoute>
                }
              />

              {/* Official / Department Routes */}
              <Route
                path="/official/queue"
                element={
                  <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS']}>
                    <CaseQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/official/case/:id"
                element={
                  <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS']}>
                    <CaseDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/official/operations"
                element={
                  <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICIAL', 'ADMIN', 'OPERATIONS']}>
                    <OperationsDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin AI Governance Routes */}
              <Route
                path="/admin/ai-mappings"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'DATA_STEWARD', 'DEPARTMENT_OFFICIAL']}>
                    <AiMappingReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/canonical-schema"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'DATA_STEWARD', 'DEPARTMENT_OFFICIAL']}>
                    <CanonicalSchemaPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
