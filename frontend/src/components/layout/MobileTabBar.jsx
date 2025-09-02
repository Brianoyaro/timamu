import React from 'react'
import { NavLink, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { mobileNavigationItems } from '../../config/navigation'
import clsx from 'clsx'

export function MobileTabBar() {
  const { t } = useTranslation()
  const { tenantId } = useParams()
  const { hasRole } = useAuthStore()

  const filteredNavItems = mobileNavigationItems.filter(item => {
    if (item.roles && item.roles.length > 0) {
      return item.roles.some(role => hasRole(role))
    }
    return true
  })

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
      <nav className="flex">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={`/t/${tenantId}${item.path}`}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center py-2 px-2 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={clsx(
                    'h-6 w-6 mb-1',
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                  )} 
                />
                <span className="truncate max-w-full">
                  {t(`navigation.${item.name}`)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
