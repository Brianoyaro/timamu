import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDown, Building, Check } from 'lucide-react'
import { useTenantStore } from '../../store/tenantStore'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'

export function TenantSwitcher() {
  const { currentTenant, tenants, setCurrentTenant } = useTenantStore()
  const { hasRole } = useAuthStore()

  // Only show tenant switcher for admins or users with multiple tenants
  if (!hasRole('admin') || tenants.length <= 1) {
    return null
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
        <Building className="h-4 w-4" />
        <span className="hidden sm:block">
          {currentTenant?.name || 'Select Tenant'}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {tenants.map((tenant) => (
              <Menu.Item key={tenant.id}>
                {({ active }) => (
                  <button
                    onClick={() => setCurrentTenant(tenant)}
                    className={clsx(
                      'group flex items-center w-full px-4 py-2 text-sm',
                      active 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'text-gray-700 dark:text-gray-300',
                      currentTenant?.id === tenant.id && 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {tenant.logo ? (
                        <img
                          src={tenant.logo}
                          alt={tenant.name}
                          className="h-6 w-6 rounded object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 bg-primary-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {tenant.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{tenant.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tenant.domain}
                        </p>
                      </div>
                    </div>
                    
                    {currentTenant?.id === tenant.id && (
                      <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
