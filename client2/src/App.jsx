import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from 'react-error-boundary'

// Layouts
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'

// Pages
import { DashboardPage } from '@/pages/DashboardPage'
import { TherapistListPage } from '@/pages/TherapistListPage'
import { TherapistDetailPage } from '@/pages/TherapistDetailPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'

// Auth Pages
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'

// Admin Pages (lazy loaded)
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminAppointmentsPage } from '@/pages/admin/AdminAppointmentsPage'

// Components
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { ToastProvider } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Stores
import { useAuthStore } from '@/stores/authStore'

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>
        <div className="space-x-2">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-input rounded-md hover:bg-accent"
          >
            Refresh page
          </button>
        </div>
      </div>
    </div>
  )
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

/**
 * Main App component with routing and providers
 */
function App() {
  const { isInitialized } = useAuthStore()

  // Show loading spinner while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="signin" element={<SignInPage />} />
                  <Route path="signup" element={<SignUpPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route index element={<Navigate to="signin" replace />} />
                </Route>

                {/* Tenant-based Protected Routes */}
                <Route path="/t/:tenantId" element={
                  <ProtectedRoute>
                    <TenantProvider>
                      <AppLayout />
                    </TenantProvider>
                  </ProtectedRoute>
                }>
                  {/* Main App Routes */}
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  
                  {/* Therapist Routes */}
                  <Route path="therapists" element={<TherapistListPage />} />
                  <Route path="therapists/:therapistId" element={<TherapistDetailPage />} />
                  
                  {/* Appointment Routes */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  
                  {/* Communication Routes */}
                  <Route path="messages" element={<MessagesPage />} />
                  
                  {/* User Routes */}
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Admin Routes */}
                  <Route path="admin" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUsersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="admin/appointments" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAppointmentsPage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Root redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* 404 Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AnimatePresence>
          </Router>
        </ToastProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

/**
 * Root redirect component - redirects based on auth state
 */
function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />
  }

  // Redirect to user's tenant dashboard
  const tenantId = user?.tenantId || 'default'
  return <Navigate to={`/t/${tenantId}/dashboard`} replace />
}

/**
 * 404 Not Found page
 */
function NotFoundPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-2">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-input rounded-md hover:bg-accent"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default App
