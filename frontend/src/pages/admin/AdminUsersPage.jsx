import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { UserTable } from '../../components/admin/UserTable'
import { UserFilters } from '../../components/admin/UserFilters'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { analyticsService } from '../../services/analyticsService'

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    roles: [],
    status: 'all',
    tenant: 'all'
  })

  useEffect(() => {
    loadUsers()
    analyticsService.page('Admin Users')
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, filters])

  const loadUsers = async () => {
    try {
      // Mock users data - replace with real API call
      const mockUsers = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@example.com',
          roles: ['therapist'],
          status: 'active',
          tenant: 'mindlink-clinic',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdAt: new Date('2024-01-15'),
          sessionCount: 245
        },
        {
          id: '2',
          name: 'John Doe',
          email: 'john.doe@example.com',
          roles: ['patient'],
          status: 'active',
          tenant: 'mindlink-clinic',
          lastActive: new Date(Date.now() - 30 * 60 * 1000),
          createdAt: new Date('2024-02-01'),
          sessionCount: 12
        },
        {
          id: '3',
          name: 'Admin User',
          email: 'admin@mindlink.com',
          roles: ['admin'],
          status: 'active',
          tenant: 'system',
          lastActive: new Date(Date.now() - 5 * 60 * 1000),
          createdAt: new Date('2023-12-01'),
          sessionCount: 0
        }
      ]
      
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (filters.roles.length > 0) {
      filtered = filtered.filter(user =>
        user.roles.some(role => filters.roles.includes(role))
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status)
    }

    // Tenant filter
    if (filters.tenant !== 'all') {
      filtered = filtered.filter(user => user.tenant === filters.tenant)
    }

    setFilteredUsers(filtered)
  }

  const handleUserUpdate = (updatedUser) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    )
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
          User Management
        </h1>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <button className="btn btn-primary flex items-center">
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name or email..."
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
          <UserFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => setFilters({
              roles: [],
              status: 'all',
              tenant: 'all'
            })}
          />
        </motion.div>
      )}

      {/* User table */}
      <UserTable
        users={filteredUsers}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  )
}
