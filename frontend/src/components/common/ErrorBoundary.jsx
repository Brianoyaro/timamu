import React from 'react'
import { AlertTriangle } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
    
    // TODO: Send error to monitoring service
    // analyticsService.track('Error Boundary Triggered', {
    //   error: error.message,
    //   stack: error.stack,
    //   componentStack: errorInfo.componentStack
    // })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full btn btn-primary"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                }}
                className="w-full btn btn-secondary"
              >
                Try Again
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
