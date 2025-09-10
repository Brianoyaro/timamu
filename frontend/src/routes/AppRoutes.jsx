import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { MainLayout } from '../layouts/MainLayout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { RoleGuard } from '../components/auth/RoleGuard'

// Auth pages
import { SignInPage } from '../pages/auth/SignInPage'
import { SignUpPage } from '../pages/auth/SignUpPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { OAuthSuccessPage } from '../pages/auth/OAuthSuccessPage'

// Main pages
import { DashboardPage } from '../pages/DashboardPage'
import { TherapistsPage } from '../pages/TherapistsPage'
import { TherapistDetailPage } from '../pages/TherapistDetailPage'
import { SchedulePage } from '../pages/SchedulePage'
import { VideoSessionPage } from '../pages/VideoSessionPage'
import { MessagesPage } from '../pages/MessagesPage'
import { ProfilePage } from '../pages/ProfilePage'
import { ResourcesPage } from '../pages/ResourcesPage'
import { SettingsPage } from '../pages/SettingsPage'

// Admin pages
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminTenantsPage } from '../pages/admin/AdminTenantsPage'
import { AdminAuditPage } from '../pages/admin/AdminAuditPage'

// Static pages
import { PrivacyPage } from '../pages/PrivacyPage'
import { TermsPage } from '../pages/TermsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignInPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* OAuth success route (outside AuthLayout to avoid conflicts) */}
      <Route path="/auth/oauth-success" element={<OAuthSuccessPage />} />

      {/* Tenant-aware protected routes */}
      <Route path="/t/:tenantId" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="therapists" element={<TherapistsPage />} />
        <Route path="therapists/:therapistId" element={<TherapistDetailPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="sessions/:sessionId/video" element={<VideoSessionPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="messages/:peerId" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Admin routes */}
        <Route path="admin" element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="tenants" element={<AdminTenantsPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
        </Route>
      </Route>

      {/* Static pages */}
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
