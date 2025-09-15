import React from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import Card from '../ui/Card'
import Button from '../ui/Button'

/**
 * Therapist Dashboard component
 * Features:
 * - Patient overview
 * - Upcoming sessions
 * - Recent messages
 * - Session notes
 * - Analytics
 */
const TherapistDashboard = () => {
  const { user } = useAuthStore()

  const quickActions = [
    {
      title: 'Today\'s Schedule',
      description: 'View your appointments for today',
      icon: CalendarIcon,
      color: 'bg-primary-500',
      href: '/schedule'
    },
    {
      title: 'Patient Messages',
      description: 'Respond to patient inquiries',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-success-500',
      href: '/messages'
    },
    {
      title: 'Patient Records',
      description: 'Access patient files and notes',
      icon: ClipboardDocumentListIcon,
      color: 'bg-warning-500',
      href: '/patients'
    },
    {
      title: 'Analytics',
      description: 'View practice insights',
      icon: ChartBarIcon,
      color: 'bg-error-500',
      href: '/analytics'
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
            Good morning, Dr. {user?.name?.split(' ').pop()}! 👩‍⚕️
          </h1>
          <p className="text-primary-100 text-lg">
            You have 6 appointments scheduled for today. Ready to make a difference?
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
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Today's Schedule
              </h3>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No appointments scheduled for today</p>
                <Button variant="primary" size="sm" className="mt-3">
                  Manage schedule
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Patient Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Messages
              </h3>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No new messages</p>
                <Button variant="primary" size="sm" className="mt-3">
                  Check messages
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Active Patients Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Patients
            </h3>
            <Button variant="ghost" size="sm">
              View all patients
            </Button>
          </div>
          
          <div className="text-center py-8">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">
              You currently have 0 active patients
            </p>
            <Button variant="primary" size="sm">
              Add new patient
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Practice Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Practice Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-primary-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Sessions This Week</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-success-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Active Patients</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-warning-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Pending Notes</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-error-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Unread Messages</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Professional Development */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Professional Development
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
              <h4 className="font-medium text-primary-900 mb-2">Continuing Education</h4>
              <p className="text-sm text-primary-700 mb-3">Stay updated with the latest therapy techniques and research.</p>
              <Button variant="primary" size="sm">
                Browse courses
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-success-50 border border-success-200">
              <h4 className="font-medium text-success-900 mb-2">Peer Consultation</h4>
              <p className="text-sm text-success-700 mb-3">Connect with other therapists for case discussions.</p>
              <Button variant="success" size="sm">
                Join community
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default TherapistDashboard
