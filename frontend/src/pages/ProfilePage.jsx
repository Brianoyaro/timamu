import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { PatientProfile } from '../components/profile/PatientProfile'
import { TherapistProfile } from '../components/profile/TherapistProfile'
import { analyticsService } from '../services/analyticsService'

export function ProfilePage() {
  const { t } = useTranslation()
  const {  hasRole } = useAuthStore()

  useEffect(() => {
    analyticsService.page('Profile')
  }, [])

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('navigation.profile')}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your profile information and preferences
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {hasRole('therapist') ? <TherapistProfile /> : <PatientProfile />}
      </motion.div>
    </div>
  )
}
