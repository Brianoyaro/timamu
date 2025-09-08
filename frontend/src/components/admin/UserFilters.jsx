import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const roles = ['admin', 'therapist', 'patient']
const statuses = ['active', 'inactive', 'suspended']
const tenants = ['mindlink-clinic', 'wellness-center', 'therapy-group']

export function UserFilters({ filters, onFiltersChange, onClear }) {
  const { t } = useTranslation()

  const handleRoleToggle = (role) => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role]
    
    onFiltersChange({ ...filters, roles: newRoles })
  }

  const hasActiveFilters = 
    filters.roles.length > 0 ||
    filters.status !== 'all' ||
    filters.tenant !== 'all'

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Filter Users
        </h3>
        
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Roles
          </label>
          <div className="space-y-2">
            {roles.map((role) => (
              <label key={role} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.roles.includes(role)}
                  onChange={() => handleRoleToggle(role)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {role}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="input text-sm"
          >
            <option value="all">All statuses</option>
            {statuses.map(status => (
              <option key={status} value={status} className="capitalize">
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Tenant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tenant
          </label>
          <select
            value={filters.tenant}
            onChange={(e) => onFiltersChange({ ...filters, tenant: e.target.value })}
            className="input text-sm"
          >
            <option value="all">All tenants</option>
            {tenants.map(tenant => (
              <option key={tenant} value={tenant}>
                {tenant}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
