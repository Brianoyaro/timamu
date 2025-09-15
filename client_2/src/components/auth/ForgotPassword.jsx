import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { motion } from 'framer-motion'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

// Validation schema
const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required')
})

/**
 * Forgot Password component for password reset requests
 * Features:
 * - Email validation
 * - Success state management
 * - Loading states
 * - Navigation back to sign in
 */
const ForgotPassword = () => {
  const { forgotPassword, isLoading } = useAuthStore()
  const { addToast } = useToastStore()
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  /**
   * Handle form submission
   */
  const onSubmit = async (data) => {
    try {
      await forgotPassword(data.email)
      setIsSuccess(true)
      
      addToast({
        type: 'success',
        message: 'Password reset instructions sent to your email'
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: error.message || 'Failed to send reset instructions'
      })
    }
  }

  const loading = isLoading || isSubmitting

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
                <EnvelopeIcon className="h-8 w-8 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600">
                We've sent password reset instructions to{' '}
                <span className="font-medium text-gray-900">
                  {getValues('email')}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="link"
                >
                  try again
                </button>
              </p>

              <Link to="/auth/sign-in">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
                >
                  Back to sign in
                </Button>
              </Link>
            </div>
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
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
              autoFocus
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
              Send reset instructions
            </Button>

            {/* Back to Sign In */}
            <div className="text-center">
              <Link
                to="/auth/sign-in"
                className="inline-flex items-center text-sm link"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
