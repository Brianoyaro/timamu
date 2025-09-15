import React from 'react'
import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  CogIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import Card from '../ui/Card'
import Button from '../ui/Button'

/**
 * Admin Dashboard component
 * Features:
 * - System overview
 * - User management
 * - Platform analytics
 * - System health
 * - Security monitoring
 */
const AdminDashboard = () => {
  const { user } = useAuthStore()

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage therapists and patients',
      icon: UsersIcon,
      color: 'bg-primary-500',
      href: '/admin/users'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: CogIcon,
      color: 'bg-secondary-500',
      href: '/admin/settings'
    },
    {
      title: 'Analytics',
      description: 'View platform insights',
      icon: ChartBarIcon,
      color: 'bg-success-500',
      href: '/admin/analytics'
    },
    {
      title: 'Security',
      description: 'Monitor security events',
      icon: ShieldCheckIcon,
      color: 'bg-error-500',
      href: '/admin/security'
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
        <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Admin Dashboard 🛡️
          </h1>
          <p className="text-secondary-100 text-lg">
            Welcome back, {user?.name}. Monitor and manage the Timamu platform.
          </p>
        </div>
      </motion.div>

      {/* System Health Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="w-5 h-5 text-success-600 mr-2" />
            <span className="text-success-800 font-medium">All systems operational</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
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

      {/* Platform Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary-50">
              <div className="text-2xl font-bold text-primary-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-success-50">
              <div className="text-2xl font-bold text-success-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Active Therapists</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-warning-50">
              <div className="text-2xl font-bold text-warning-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Active Patients</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-error-50">
              <div className="text-2xl font-bold text-error-600 mb-1">0</div>
              <p className="text-sm text-gray-600">Sessions Today</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                System Health
              </h3>
              <Button variant="ghost" size="sm">
                Details
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-success-50">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-success-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">Database</span>
                </div>
                <span className="text-sm text-success-600">Healthy</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-success-50">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-success-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">API Services</span>
                </div>
                <span className="text-sm text-success-600">Operational</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-success-50">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-success-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">File Storage</span>
                </div>
                <span className="text-sm text-success-600">Operational</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Security Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Security Monitoring
            </h3>
            <Button variant="ghost" size="sm">
              View logs
            </Button>
          </div>
          
          <div className="text-center py-8">
            <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-success-400" />
            <p className="text-gray-500 mb-2">No security alerts</p>
            <p className="text-sm text-gray-400">All systems secure</p>
          </div>
        </Card>
      </motion.div>

      {/* Management Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Management Tools
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <UsersIcon className="w-8 h-8 text-primary-600 mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">User Management</h4>
              <p className="text-sm text-gray-600 mb-3">Add, edit, or remove platform users</p>
              <Button variant="primary" size="sm">
                Manage Users
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <ServerIcon className="w-8 h-8 text-success-600 mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">System Config</h4>
              <p className="text-sm text-gray-600 mb-3">Configure platform settings and features</p>
              <Button variant="success" size="sm">
                Settings
              </Button>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <ExclamationTriangleIcon className="w-8 h-8 text-warning-600 mb-2" />
              <h4 className="font-medium text-gray-900 mb-1">Support</h4>
              <p className="text-sm text-gray-600 mb-3">Handle user reports and support tickets</p>
              <Button variant="secondary" size="sm">
                Support Queue
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default AdminDashboard
