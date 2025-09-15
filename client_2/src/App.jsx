import React, { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import AppRoutes from './routes/AppRoutes'
import ToastContainer from './components/ui/Toast'

/**
 * Main App component
 * Sets up the application with authentication initialization and global components
 */
function App() {
  const { initialize } = useAuthStore()

  // Initialize auth store on app startup
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="App">
      {/* Main application routes */}
      <AppRoutes />
      
      {/* Global toast notifications */}
      <ToastContainer />
    </div>
  )
}

export default App
