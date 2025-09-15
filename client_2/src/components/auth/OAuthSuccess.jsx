import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { authService } from '../../services/authService'
import LoadingSpinner from '../ui/LoadingSpinner'
import Card from '../ui/Card'

/**
 * OAuth Success component for handling OAuth callback
 * Features:
 * - Token extraction from URL params
 * - Automatic authentication setup
 * - Error handling for failed OAuth
 * - Redirect to dashboard on success
 */
const OAuthSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setOAuthUser } = useAuthStore()
  const { addToast } = useToastStore()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(getErrorMessage(error))
        }

        if (!token) {
          throw new Error('No authentication token received')
        }

        // Handle OAuth success
        const { user, accessToken, refreshToken } = await authService.handleOAuthSuccess(token)
        
        // Set user in auth store
        setOAuthUser(user, accessToken, refreshToken)
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true })
      } catch (error) {
        console.error('OAuth callback error:', error)
        
        addToast({
          type: 'error',
          message: error.message || 'OAuth authentication failed'
        })
        
        // Redirect to sign in on error
        navigate('/auth/sign-in', { replace: true })
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, setOAuthUser, addToast])

  /**
   * Get user-friendly error message based on error code
   */
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'oauth_failed':
        return 'OAuth authentication failed. Please try again.'
      case 'access_denied':
        return 'Access was denied. Please try signing in again.'
      case 'invalid_request':
        return 'Invalid OAuth request. Please try again.'
      default:
        return 'Authentication failed. Please try again.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="text-center">
          <div className="py-8">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your account
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default OAuthSuccess
