import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from './components/ui/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppRoutes } from './routes/AppRoutes'
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { isDarkMode } = useThemeStore()
  const { isInitialized } = useAuthStore()

  React.useEffect(() => {
    // Initialize auth on app start
    useAuthStore.getState().initialize()
  }, [])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <AppRoutes />
            <Toaster />
          </div>
        </Router>
      </ErrorBoundary>
    </div>
  )
}
