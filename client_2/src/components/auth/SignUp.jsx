import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { authService } from '../../services/authService'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

// Validation schema
const signUpSchema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
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
    .oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup
    .string()
    .required('Please select your role')
    .oneOf(['patient', 'therapist'], 'Invalid role selected'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions')
})

/**
 * Sign Up component for user registration
 * Features:
 * - User registration form
 * - Role selection (patient/therapist)
 * - Password strength indicator
 * - Google OAuth integration
 * - Form validation
 * - Terms agreement
 */
const SignUp = () => {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const { addToast } = useToastStore()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      agreeToTerms: false
    }
  })

  const watchedPassword = watch('password')

  // Update password strength when password changes
  React.useEffect(() => {
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
    try {
      const { confirmPassword, agreeToTerms, ...userData } = data
      
      await signUp(userData)
      
      addToast({
        type: 'success',
        message: 'Account created successfully! Welcome to Timamu.'
      })
      
      navigate('/dashboard')
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Registration failed'
      })
    }
  }

  /**
   * Handle Google OAuth sign up
   */
  const handleGoogleSignUp = () => {
    const oauthUrl = authService.getGoogleOAuthUrl()
    window.location.href = oauthUrl
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Timamu for secure mental health support
          </p>
        </div>

        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name Field */}
            <Input
              {...register('name')}
              type="text"
              label="Full name"
              placeholder="Enter your full name"
              error={errors.name?.message}
              required
              leftIcon={<UserIcon className="w-5 h-5" />}
              autoComplete="name"
              disabled={loading}
            />

            {/* Email Field */}
            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="Enter your email"
              error={errors.email?.message}
              required
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              autoComplete="email"
              disabled={loading}
            />

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a <span className="text-error-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <input
                    {...register('role')}
                    type="radio"
                    value="patient"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    disabled={loading}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Patient
                  </span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                  <input
                    {...register('role')}
                    type="radio"
                    value="therapist"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    disabled={loading}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Therapist
                  </span>
                </label>
              </div>
              {errors.role && (
                <p className="text-sm text-error-600 mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a strong password"
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
              label="Confirm password"
              placeholder="Confirm your password"
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

            {/* Terms Agreement */}
            <div>
              <label className="flex items-start">
                <input
                  {...register('agreeToTerms')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                  disabled={loading}
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="link">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="link">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-sm text-error-600 mt-1">
                  {errors.agreeToTerms.message}
                </p>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Create account
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleGoogleSignUp}
              disabled={loading}
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              }
            >
              Continue with Google
            </Button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
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

export default SignUp
