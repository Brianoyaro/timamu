import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Auth components
import SignIn from '../components/auth/SignIn'
import SignUp from '../components/auth/SignUp'
import ForgotPassword from '../components/auth/ForgotPassword'
import ResetPassword from '../components/auth/ResetPassword'
import OAuthSuccess from '../components/auth/OAuthSuccess'
import { ProtectedRoute, PublicRoute } from '../components/auth/ProtectedRoute'

// Layout components
import MainLayout from '../layouts/MainLayout'

// Dashboard components
import Dashboard from '../components/dashboard/Dashboard'

// Placeholder page components
const PlaceholderPage = ({ title, description }) => (
  <div className="max-w-4xl mx-auto text-center py-12">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
    <p className="text-lg text-gray-600 mb-8">{description}</p>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <p className="text-gray-500">This page is under development.</p>
    </div>
  </div>
)

/**
 * Main application routes
 * Defines all the routes and their corresponding components
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public auth routes */}
      <Route
        path="/auth/sign-in"
        element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/sign-up"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/oauth-success"
        element={<OAuthSuccess />}
      />

      {/* Protected routes with main layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Patient routes */}
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage
                title="Schedule"
                description="Book and manage your therapy appointments"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage
                title="Messages"
                description="Communicate securely with your care team"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mood"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage
                title="Mood Tracking"
                description="Track your daily mood and emotional wellbeing"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage
                title="Resources"
                description="Access helpful mental health resources and tools"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Therapist routes */}
      <Route
        path="/patients"
        element={
          <ProtectedRoute requiredRole="therapist">
            <MainLayout>
              <PlaceholderPage
                title="Patients"
                description="Manage your patient roster and treatment plans"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRole="therapist">
            <MainLayout>
              <PlaceholderPage
                title="Analytics"
                description="View insights about your practice and patient outcomes"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <PlaceholderPage
                title="User Management"
                description="Manage therapists, patients, and platform users"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <PlaceholderPage
                title="Platform Analytics"
                description="Monitor platform usage and performance metrics"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <PlaceholderPage
                title="Platform Settings"
                description="Configure platform-wide settings and features"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Profile and settings routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage
                title="Profile"
                description="Manage your personal information and preferences"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PlaceholderPage
                title="Settings"
                description="Configure your account settings and preferences"
              />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Legal pages */}
      <Route
        path="/terms"
        element={
          <PlaceholderPage
            title="Terms of Service"
            description="Terms and conditions for using the Timamu platform"
          />
        }
      />
      <Route
        path="/privacy"
        element={
          <PlaceholderPage
            title="Privacy Policy"
            description="How we protect and handle your personal information"
          />
        }
      />

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Page not found
              </h2>
              <p className="text-gray-600 mb-8">
                The page you're looking for doesn't exist.
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Go back
              </button>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default AppRoutes
