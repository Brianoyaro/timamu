import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { AuditLogTable } from '../../components/admin/AuditLogTable'
import { AuditFilters } from '../../components/admin/AuditFilters'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { analyticsService } from '../../services/analyticsService'

export function AdminAuditPage() {
  const { t } = useTranslation()
  const [auditLogs, setAuditLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    actions: [],
    users: [],
    dateRange: 'week'
  })

  useEffect(() => {
    loadAuditLogs()
    analyticsService.page('Admin Audit')
  }, [])

  useEffect(() => {
    applyFilters()
  }, [auditLogs, searchQuery, filters])

  const loadAuditLogs = async () => {
    try {
      // Mock audit logs - replace with real API call
      const mockLogs = [
        {
          id: '1',
          action: 'user.login',
          user: { name: 'Dr. Sarah Johnson', email: 'sarah@example.com' },
          details: 'User logged in successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          tenant: 'mindlink-clinic'
        },
        {
          id: '2',
          action: 'session.created',
          user: { name: 'John Doe', email: 'john@example.com' },
          details: 'Video session created with Dr. Johnson',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          tenant: 'mindlink-clinic'
        },
        {
          id: '3',
          action: 'user.role_changed',
          user: { name: 'Admin User', email: 'admin@mindlink.com' },
          details: 'Changed user role from patient to therapist',
          ipAddress: '10.0.0.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          tenant: 'system'
        }
      ]
      
      setAuditLogs(mockLogs)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = auditLogs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Action filter
    if (filters.actions.length > 0) {
      filtered = filtered.filter(log =>
        filters.actions.some(action => log.action.startsWith(action))
      )
    }

    // Date range filter
    const now = new Date()
    const dateRanges = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }
    
    if (filters.dateRange !== 'all') {
      const cutoff = new Date(now.getTime() - dateRanges[filters.dateRange])
      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoff)
    }

    setFilteredLogs(filtered)
  }

  const handleExportLogs = () => {
    // Mock CSV export - replace with real implementation
    const csvContent = [
      ['Timestamp', 'Action', 'User', 'Details', 'IP Address', 'Tenant'],
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.action,
        log.user.name,
        log.details,
        log.ipAddress,
        log.tenant
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="card p-6">
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Log
        </h1>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={handleExportLogs}
            className="btn btn-secondary flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search audit logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <AuditFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters({
              actions: [],
              users: [],
              dateRange: 'week'
            })}
          />
        </motion.div>
      )}

      {/* Audit table */}
      <AuditLogTable logs={filteredLogs} />
    </div>
  )
}
