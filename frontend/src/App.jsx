import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from './components/ui/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { AppRoutes } from './routes/AppRoutes' // This is what's breaking my application
import { useThemeStore } from './store/themeStore'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { isDarkMode } = useThemeStore()
  const { isInitialized } = useAuthStore()

  React.useEffect(() => {
    // Initialize theme first
    useThemeStore.getState().initializeTheme()
    
    // Initialize auth on app start
    useAuthStore.getState().initialize()
  }, [])

  // Apply theme class to document root
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-grey-900 text-gray-900 dark:text-white transition-colors">
            {/* remove the debuging line below */}
            {/* <h1 className='text-4xl font-bold'>Hello World</h1> */}
            <AppRoutes />
            <Toaster />
          </div>
        </Router>
      </ErrorBoundary>
    </div>
  )
}
