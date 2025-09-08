import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required')
})

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { forgotPassword, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data) => {
    await forgotPassword(data.email)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 w-full"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('auth.forgotPassword')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you reset instructions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.email')}
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            autoComplete="email"
            className="mt-1 input"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary"
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/sign-in"
          className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          {t('auth.backToSignIn')}
        </Link>
      </div>
    </motion.div>
  )
}
