import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  Heart, 
  BookOpen,
  ArrowRight
} from 'lucide-react'

export function WelcomeCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { tenantId } = useParams()

  const welcomeSteps = [
    {
      title: 'Find Your Therapist',
      description: 'Browse our network of qualified mental health professionals',
      icon: Users,
      action: () => navigate(`/t/${tenantId}/therapists`),
      buttonText: 'Browse Therapists'
    },
    {
      title: 'Schedule Your First Session',
      description: 'Book a consultation or therapy session that fits your schedule',
      icon: Calendar,
      action: () => navigate(`/t/${tenantId}/schedule`),
      buttonText: 'Schedule Session'
    },
    {
      title: 'Check Your Mood',
      description: 'Start tracking your mental health journey with daily check-ins',
      icon: Heart,
      action: () => {
        // Scroll to mood check-in card if visible, or show a modal
        const moodCard = document.querySelector('[data-testid="mood-checkin-card"]')
        if (moodCard) {
          moodCard.scrollIntoView({ behavior: 'smooth' })
        }
      },
      buttonText: 'Start Check-in'
    },
    {
      title: 'Explore Resources',
      description: 'Access helpful articles, exercises, and coping strategies',
      icon: BookOpen,
      action: () => navigate(`/t/${tenantId}/resources`),
      buttonText: 'View Resources'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6 bg-gradient-to-br from-primary-50 to-therapeutic-50 dark:from-primary-900 dark:to-therapeutic-900 border-primary-200 dark:border-primary-700"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Your Mental Health Journey! 🌟
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Let's get you started with some important first steps
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {welcomeSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-lg flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {step.description}
                </p>
                
                <button
                  onClick={step.action}
                  className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {step.buttonText}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Need help getting started? 
          <button className="ml-1 text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium">
            Contact Support
          </button>
        </p>
      </div>
    </motion.div>
  )
}
