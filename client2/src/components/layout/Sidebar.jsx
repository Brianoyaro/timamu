import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { navigationItems } from '../../config/navigation'
import clsx from 'clsx'

export function Sidebar({ onClose }) {
  const { t } = useTranslation()
  const { tenantId } = useParams()
  const { user, hasRole } = useAuthStore()

  const filteredNavItems = navigationItems.filter(item => {
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(role => hasRole(role))
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Mobile header */}
      {onClose && (
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={`/t/${tenantId}${item.path}`}
            className={({ isActive }) => 
              clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              )
            }
            onClick={onClose}
          >
            <item.icon 
              className="mr-3 h-5 w-5 flex-shrink-0" 
              aria-hidden="true" 
            />
            {t(`navigation.${item.name}`)}
            {item.badge && (
              <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img
              className="h-8 w-8 rounded-full"
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff`}
              alt={user?.name || 'User'}
            />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
