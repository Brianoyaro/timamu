import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { 
  ChevronDown,
  ChevronRightIcon,
  Monitor,
  Globe
} from 'lucide-react'
import clsx from 'clsx'

export function AuditLogTable({ logs }) {
  const { t } = useTranslation()
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleRowExpansion = (logId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  const sortedLogs = [...logs].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getActionColor = (action) => {
    if (action.includes('login') || action.includes('logout')) {
      return 'text-blue-600 dark:text-blue-400'
    } else if (action.includes('created') || action.includes('updated')) {
      return 'text-green-600 dark:text-green-400'
    } else if (action.includes('deleted') || action.includes('failed')) {
      return 'text-red-600 dark:text-red-400'
    } else {
      return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (logs.length === 0) {
    return (
      <div className="card p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          No audit logs found
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-8 px-6 py-3"></th>
              
              <th
                onClick={() => handleSort('timestamp')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Timestamp
                {sortField === 'timestamp' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              
              <th
                onClick={() => handleSort('action')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Action
                {sortField === 'action' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Details
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tenant
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedLogs.map((log) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRowExpansion(log.id)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {expandedRows.has(log.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(log.timestamp, 'MMM d, yyyy HH:mm:ss')}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'text-sm font-medium',
                      getActionColor(log.action)
                    )}>
                      {log.action}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {log.user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {log.user.email}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.details}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.tenant}
                  </td>
                </tr>
                
                {/* Expanded row details */}
                {expandedRows.has(log.id) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">IP Address:</span>
                          <span className="text-gray-900 dark:text-white font-mono">
                            {log.ipAddress}
                          </span>
                        </div>
                        
                        <div className="flex items-start space-x-2">
                          <Monitor className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">User Agent:</span>
                            <p className="text-gray-900 dark:text-white text-xs mt-1 break-all">
                              {log.userAgent}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
