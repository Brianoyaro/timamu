import React from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  HeartIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import Card from '../ui/Card'
import Button from '../ui/Button'

/**
 * Patient Dashboard component
 * Features:
 * - Quick action cards
 * - Upcoming appointments
 * - Recent messages
 * - Mood tracking
 * - Resource access
 */
const PatientDashboard = () => {
  const { user } = useAuthStore()

  const quickActions = [
    {
      title: 'Schedule Appointment',
      description: 'Book a session with your therapist',
      icon: CalendarIcon,
      color: 'bg-primary-500',
      href: '/schedule'
    },
    {
      title: 'Messages',
      description: 'Chat with your care team',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-success-500',
      href: '/messages'
    },
    {
      title: 'Mood Check-in',
      description: 'Track your daily mood',
      icon: HeartIcon,
      color: 'bg-error-500',
      href: '/mood'
    },
    {
      title: 'Resources',
      description: 'Access helpful materials',
      icon: UserGroupIcon,
      color: 'bg-warning-500',
      href: '/resources'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-primary-100 text-lg">
            How are you feeling today? Remember, you're not alone on this journey.
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card 
                hover 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => {
                  // Navigation would be handled here
                  console.log(`Navigate to ${action.href}`)
                }}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-3`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upcoming Appointments
              </h3>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming appointments</p>
                <Button variant="primary" size="sm" className="mt-3">
                  Schedule your first session
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Messages
              </h3>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent messages</p>
                <Button variant="primary" size="sm" className="mt-3">
                  Start a conversation
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Mood Tracking Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Mood Tracking
            </h3>
            <Button variant="ghost" size="sm">
              View history
            </Button>
          </div>
          
          <div className="text-center py-8">
            <HeartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">
              How are you feeling today?
            </p>
            <div className="flex justify-center space-x-3">
              {['😔', '😐', '🙂', '😊', '😄'].map((emoji, index) => (
                <button
                  key={index}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-primary-300 transition-colors duration-200 text-2xl"
                  onClick={() => console.log(`Mood selected: ${index + 1}`)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Helpful Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Helpful Resources
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-10 h-10 bg-primary-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-primary-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Self-Assessment</h4>
              <p className="text-sm text-gray-600">Track your mental health progress</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-10 h-10 bg-success-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-success-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Support Groups</h4>
              <p className="text-sm text-gray-600">Connect with others on similar journeys</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="w-10 h-10 bg-warning-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-warning-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Crisis Support</h4>
              <p className="text-sm text-gray-600">24/7 emergency mental health support</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PatientDashboard
