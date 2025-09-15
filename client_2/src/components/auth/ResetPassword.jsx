import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { authService } from '../../services/authService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

// Validation schema
const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/\d/, 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match')
})

/**
 * Reset Password component for completing password reset
 * Features:
 * - Token validation
 * - Password strength indicator
 * - Password confirmation
 * - Success state management
 * - Auto-redirect to sign in
 */
const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword, isLoading } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  const watchedPassword = watch('password')

  // Get token from URL params
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      addToast({
        type: 'error',
        message: 'Invalid reset link. Please request a new password reset.'
      })
      navigate('/auth/forgot-password')
      return
    }
    setToken(tokenParam)
  }, [searchParams, navigate, addToast])

  // Update password strength when password changes
  useEffect(() => {
    if (watchedPassword) {
      const strength = authService.getPasswordStrength(watchedPassword)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [watchedPassword])

  /**
   * Handle form submission
   */
  const onSubmit = async (data) => {
    if (!token) {
      addToast({
        type: 'error',
        message: 'Invalid reset token'
      })
      return
    }

    try {
      await resetPassword(token, data.password)
      setIsSuccess(true)
      
      addToast({
        type: 'success',
        message: 'Password reset successful! You can now sign in with your new password.'
      })

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/auth/sign-in')
      }, 3000)
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Password reset failed'
      })
    }
  }

  /**
   * Get password strength color and text
   */
  const getPasswordStrengthInfo = (strength) => {
    switch (strength) {
      case 0:
        return { color: 'bg-gray-300', text: '' }
      case 1:
        return { color: 'bg-error-500', text: 'Weak' }
      case 2:
        return { color: 'bg-warning-500', text: 'Fair' }
      case 3:
        return { color: 'bg-primary-500', text: 'Good' }
      case 4:
        return { color: 'bg-success-500', text: 'Strong' }
      default:
        return { color: 'bg-gray-300', text: '' }
    }
  }

  const loading = isLoading || isSubmitting
  const strengthInfo = getPasswordStrengthInfo(passwordStrength)

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <Card className="text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-4">
                <CheckCircleIcon className="h-8 w-8 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password reset successful!
              </h2>
              <p className="text-gray-600">
                Your password has been successfully updated. You will be redirected to the sign in page shortly.
              </p>
            </div>

            <Link to="/auth/sign-in">
              <Button variant="primary" fullWidth>
                Continue to sign in
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Password Field */}
            <div>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="New password"
                placeholder="Enter your new password"
                error={errors.password?.message}
                required
                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                }
                autoComplete="new-password"
                disabled={loading}
                autoFocus
              />
              
              {/* Password Strength Indicator */}
              {watchedPassword && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${strengthInfo.color}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    {strengthInfo.text && (
                      <span className="text-xs text-gray-600">
                        {strengthInfo.text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm new password"
              placeholder="Confirm your new password"
              error={errors.confirmPassword?.message}
              required
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              }
              autoComplete="new-password"
              disabled={loading}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Reset password
            </Button>

            {/* Back to Sign In */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/auth/sign-in" className="link">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default ResetPassword
