import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Server,
  Signal,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export function SystemHealthCard() {
  const { t } = useTranslation()

  // Mock system health data - replace with real API call
  const systemHealth = {
    status: 'healthy', // healthy, warning, critical
    uptime: '99.9%',
    responseTime: '120ms',
    activeConnections: 1247,
    services: [
      { name: 'API Server', status: 'healthy' },
      { name: 'Database', status: 'healthy' },
      { name: 'Video Service', status: 'healthy' },
      { name: 'File Storage', status: 'warning' },
      { name: 'Email Service', status: 'healthy' }
    ]
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Server className="h-5 w-5 mr-2" />
        System Health
      </h2>

      {/* Overall status */}
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            All systems operational
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {systemHealth.uptime}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
        </div>
        
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {systemHealth.responseTime}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Response Time</p>
        </div>
      </div>

      {/* Service status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Service Status
        </h4>
        
        {systemHealth.services.map((service) => (
          <div key={service.name} className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {service.name}
            </span>
            <div className="flex items-center space-x-1">
              {getStatusIcon(service.status)}
              <span className={`text-xs capitalize ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
