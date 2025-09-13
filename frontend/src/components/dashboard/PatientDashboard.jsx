import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { NextSessionCard } from './NextSessionCard'
import { QuickActionsCard } from './QuickActionsCard'
import { MoodCheckInCard } from './MoodCheckInCard'
import { PatientStatsCard } from './PatientStatsCard'
import { RecentActivityCard } from './RecentActivityCard'
import { WelcomeCard } from './WelcomeCard'
import { useAuthStore } from '../../store/authStore'
import { useTenantStore } from '../../store/tenantStore'
import { schedulingService } from '../../services/schedulingService'
import { assessmentService } from '../../services/assessmentService'

export function PatientDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { currentTenant } = useTenantStore()
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserActivity = async () => {
      // Wait for tenant to be loaded before making API calls
      if (!currentTenant) {
        return
      }

      try {
        // Check if user has any appointments or assessments
        const [appointmentsResponse, moodCheckins] = await Promise.all([
          schedulingService.getAppointments({ limit: 1 }),
          assessmentService.getMoodCheckins()
        ])

        const hasAppointments = appointmentsResponse.appointments?.length > 0
        const hasMoodCheckins = moodCheckins.length > 0
        
        // Consider user "new" if they have no appointments and no mood check-ins
        setIsNewUser(!hasAppointments && !hasMoodCheckins)
      } catch (error) {
        console.error('Failed to check user activity:', error)
        // If we can't check, assume they're not new to avoid showing welcome unnecessarily
        setIsNewUser(false)
      } finally {
        setLoading(false)
      }
    }

    checkUserActivity()
  }, [currentTenant]) // Add currentTenant as dependency

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  if (loading || !currentTenant) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome card for new users */}
      {isNewUser && (
        <motion.div variants={itemVariants}>
          <WelcomeCard />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Next Session - Full width on mobile, 2 cols on desktop */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <NextSessionCard />
        </motion.div>

        {/* Quick Actions - Takes right column */}
        <motion.div variants={itemVariants} className="space-y-6">
          <QuickActionsCard />
        </motion.div>

        {/* Patient Stats */}
        <motion.div variants={itemVariants}>
          <PatientStatsCard />
        </motion.div>

        {/* Mood Check-in */}
        <motion.div variants={itemVariants} data-testid="mood-checkin-card">
          <MoodCheckInCard />
        </motion.div>

        {/* Recent Activity - Full width */}
        <motion.div variants={itemVariants} className="xl:col-span-3 lg:col-span-2">
          <RecentActivityCard />
        </motion.div>
      </div>
    </motion.div>
  )
}
