import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'

export function OAuthSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setOAuthUser } = useAuthStore()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      try {
        const token = searchParams.get('token')
        console.log('OAuth token received:', token ? 'Present' : 'Missing')
        
        if (!token) {
          console.error('No token parameter found in URL')
          setStatus('error')
          return
        }

        // Decode the temporary token
        console.log('Attempting to decode token...')
        const decoded = JSON.parse(atob(token))
        console.log('Token decoded successfully:', {
          hasUser: !!decoded.user,
          hasAccessToken: !!decoded.accessToken,
          hasRefreshToken: !!decoded.refreshToken,
          timestamp: decoded.timestamp
        })
        
        const { user, accessToken, refreshToken, timestamp } = decoded

        // Check if token is not too old (5 minutes max)
        const tokenAge = Date.now() - timestamp
        console.log('Token age in minutes:', tokenAge / (60 * 1000))
        
        if (tokenAge > 5 * 60 * 1000) {
          console.error('Token expired, age:', tokenAge)
          setStatus('expired')
          return
        }

        // Validate required data
        if (!user || !accessToken || !refreshToken) {
          console.error('Missing required data in token:', { user: !!user, accessToken: !!accessToken, refreshToken: !!refreshToken })
          setStatus('error')
          return
        }

        console.log('Setting OAuth user in store...')
        // Store tokens and user data using proper store method
        setOAuthUser(user, accessToken, refreshToken)

        console.log('OAuth success handling completed')
        setStatus('success')
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate('/t/default', { replace: true })
        }, 1500)

      } catch (error) {
        console.error('OAuth success handling error:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          searchParams: searchParams.toString()
        })
        setStatus('error')
      }
    }

    handleOAuthSuccess()
  }, [searchParams, navigate, setOAuthUser])

  const getMessage = () => {
    switch (status) {
      case 'processing':
        return 'Completing your sign in...'
      case 'success':
        return 'Success! Redirecting to your dashboard...'
      case 'expired':
        return 'Sign in session expired. Please try again.'
      case 'error':
        return 'Something went wrong. Please try again.'
      default:
        return 'Processing...'
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'expired':
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return <LoadingSpinner size="lg" className="mb-4" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {getIcon()}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {status === 'success' ? 'Welcome to MindLink!' : 'Sign In Status'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {getMessage()}
          </p>
          
          {(status === 'expired' || status === 'error') && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/auth/sign-in')}
                className="btn btn-primary w-full"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
