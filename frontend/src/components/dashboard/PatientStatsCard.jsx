import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  TrendingUp, 
  Calendar, 
  Heart, 
  Award,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { schedulingService } from '../../services/schedulingService'
import { assessmentService } from '../../services/assessmentService'
import { useToastStore } from '../../store/toastStore'

export function PatientStatsCard() {
  const { t } = useTranslation()
  const { addToast } = useToastStore()
  const [stats, setStats] = useState({
    totalSessions: 0,
    weeklyMoodAverage: 0,
    daysStreak: 0,
    nextGoal: 'Complete initial assessment'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Get completed sessions count
        const sessionsResponse = await schedulingService.getAppointments({
          status: 'completed',
          limit: 100
        })
        
        // Get recent mood check-ins for average
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const moodCheckins = await assessmentService.getMoodCheckins(
          startDate.toISOString(),
          endDate.toISOString()
        )
        
        const totalSessions = sessionsResponse.appointments?.length || 0
        
        // Calculate weekly mood average
        const weeklyMoodAverage = moodCheckins.length > 0 
          ? moodCheckins.reduce((sum, checkin) => sum + checkin.mood, 0) / moodCheckins.length
          : 0
        
        // Calculate streak (simplified - days with mood check-ins)
        const daysStreak = Math.min(moodCheckins.length, 7)
        
        setStats({
          totalSessions,
          weeklyMoodAverage: Math.round(weeklyMoodAverage * 10) / 10,
          daysStreak,
          nextGoal: totalSessions === 0 ? 'Schedule your first session' : 
                   totalSessions < 5 ? 'Complete 5 therapy sessions' :
                   'Maintain consistent progress'
        })
        
      } catch (error) {
        console.error('Failed to fetch patient stats:', error)
        addToast({
          type: 'error',
          message: 'Failed to load progress statistics'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [addToast])

  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Progress
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const statItems = [
    {
      label: 'Total Sessions',
      value: stats.totalSessions,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900'
    },
    {
      label: 'Weekly Mood Avg',
      value: stats.weeklyMoodAverage > 0 ? `${stats.weeklyMoodAverage}/5` : 'No data',
      icon: Heart,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900'
    },
    {
      label: 'Check-in Streak',
      value: `${stats.daysStreak} days`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Your Progress
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="text-center"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 ${item.bgColor} rounded-lg mb-2`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.label}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Next Goal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.nextGoal}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
