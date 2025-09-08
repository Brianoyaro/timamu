import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  MoreVertical,
  Edit,
  Trash2,
  ShieldCheck
} from 'lucide-react'
import { Menu } from '@headlessui/react'
import { format } from 'date-fns'
import clsx from 'clsx'

export function UserTable({ users, onUserUpdate }) {
  const { t } = useTranslation()
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleRoleChange = async (userId, newRoles) => {
    try {
      // Mock API call - replace with real implementation
      const updatedUser = users.find(u => u.id === userId)
      if (updatedUser) {
        onUserUpdate({ ...updatedUser, roles: newRoles })
      }
    } catch (error) {
      console.error('Failed to update user roles:', error)
    }
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      // Mock API call - replace with real implementation
      const updatedUser = users.find(u => u.id === userId)
      if (updatedUser) {
        onUserUpdate({ ...updatedUser, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'therapist':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
      case 'patient':
        return 'bg-therapeutic-100 text-therapeutic-800 dark:bg-therapeutic-900 dark:text-therapeutic-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                User
                {sortField === 'name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Roles
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort('lastActive')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Last Active
                {sortField === 'lastActive' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sessions
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
                      alt={user.name}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getRoleBadgeColor(role)
                        )}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  )}>
                    {user.status}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(user.lastActive, 'MMM d, h:mm a')}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.sessionCount}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreVertical className="h-4 w-4" />
                    </Menu.Button>
                    
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={clsx(
                                'group flex items-center w-full px-4 py-2 text-sm',
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              )}
                            >
                              <Edit className="mr-3 h-4 w-4" />
                              Edit User
                            </button>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={clsx(
                                'group flex items-center w-full px-4 py-2 text-sm',
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              )}
                            >
                              <ShieldCheck className="mr-3 h-4 w-4" />
                              Manage Roles
                            </button>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={clsx(
                                'group flex items-center w-full px-4 py-2 text-sm text-red-600',
                                active ? 'bg-gray-100 dark:bg-gray-700' : ''
                              )}
                            >
                              <Trash2 className="mr-3 h-4 w-4" />
                              Delete User
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Menu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
