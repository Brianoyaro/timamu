import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const actionTypes = [
  'user', 'session', 'appointment', 'message', 'tenant', 'admin'
]

const dateRanges = [
  { value: 'day', label: 'Last 24 hours' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'all', label: 'All time' }
]

export function AuditFilters({ filters, onFiltersChange, onClear }) {
  const { t } = useTranslation()

  const handleActionToggle = (action) => {
    const newActions = filters.actions.includes(action)
      ? filters.actions.filter(a => a !== action)
      : [...filters.actions, action]
    
    onFiltersChange({ ...filters, actions: newActions })
  }

  const hasActiveFilters = 
    filters.actions.length > 0 ||
    filters.dateRange !== 'week'

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Filter Audit Logs
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Action Types
          </label>
          <div className="space-y-2">
            {actionTypes.map((action) => (
              <label key={action} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.actions.includes(action)}
                  onChange={() => handleActionToggle(action)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {action}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
            className="input text-sm"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
