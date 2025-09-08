import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Building,
  Users,
  Settings,
  MoreVertical,
  Globe
} from 'lucide-react'
import { Menu } from '@headlessui/react'
import { format } from 'date-fns'
import clsx from 'clsx'

export function TenantCard({ tenant, onUpdate }) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)

  const handleStatusToggle = async () => {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active'
    try {
      // Mock API call - replace with real implementation
      onUpdate({ ...tenant, status: newStatus })
    } catch (error) {
      console.error('Failed to update tenant status:', error)
    }
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {tenant.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {tenant.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              {tenant.domain}
            </p>
          </div>
        </div>

        <Menu as="div" className="relative">
          <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <MoreVertical className="h-4 w-4" />
          </Menu.Button>
          
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={clsx(
                      'group flex items-center w-full px-4 py-2 text-sm',
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    )}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleStatusToggle}
                    className={clsx(
                      'group flex items-center w-full px-4 py-2 text-sm',
                      active ? 'bg-gray-100 dark:bg-gray-700' : ''
                    )}
                  >
                    {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>

      {/* Status */}
      <div className="mb-4">
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          tenant.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        )}>
          {tenant.status}
        </span>
        
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          {tenant.plan} plan
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {tenant.userCount}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Users</p>
        </div>
        
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {tenant.therapistCount}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Therapists</p>
        </div>
        
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-lg font-bold text-therapeutic-600 dark:text-therapeutic-400">
            {tenant.patientCount}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Patients</p>
        </div>
      </div>

      {/* Created date */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Created {format(tenant.createdAt, 'MMM d, yyyy')}
      </p>
    </div>
  )
}
