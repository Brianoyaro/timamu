import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  HomeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import Button from '../ui/Button'

/**
 * Main layout component with sidebar navigation
 * Features:
 * - Responsive design with mobile drawer
 * - Role-based navigation items
 * - User profile dropdown
 * - Sign out functionality
 */
const MainLayout = ({ children }) => {
  const navigate = useNavigate()
  const { user, signOut, hasRole } = useAuthStore()
  const { addToast } = useToastStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut()
      addToast({
        type: 'success',
        message: 'Signed out successfully'
      })
      navigate('/auth/sign-in')
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Sign out failed'
      })
    }
  }

  /**
   * Get navigation items based on user role
   */
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: location.pathname === '/dashboard'
      }
    ]

    if (hasRole('patient')) {
      return [
        ...baseItems,
        {
          name: 'Schedule',
          href: '/schedule',
          icon: CalendarIcon,
          current: location.pathname.startsWith('/schedule')
        },
        {
          name: 'Messages',
          href: '/messages',
          icon: ChatBubbleLeftRightIcon,
          current: location.pathname.startsWith('/messages')
        },
        {
          name: 'Mood Tracking',
          href: '/mood',
          icon: HeartIcon,
          current: location.pathname.startsWith('/mood')
        },
        {
          name: 'Resources',
          href: '/resources',
          icon: UsersIcon,
          current: location.pathname.startsWith('/resources')
        }
      ]
    }

    if (hasRole('therapist')) {
      return [
        ...baseItems,
        {
          name: 'Schedule',
          href: '/schedule',
          icon: CalendarIcon,
          current: location.pathname.startsWith('/schedule')
        },
        {
          name: 'Patients',
          href: '/patients',
          icon: UsersIcon,
          current: location.pathname.startsWith('/patients')
        },
        {
          name: 'Messages',
          href: '/messages',
          icon: ChatBubbleLeftRightIcon,
          current: location.pathname.startsWith('/messages')
        },
        {
          name: 'Analytics',
          href: '/analytics',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/analytics')
        }
      ]
    }

    if (hasRole('admin')) {
      return [
        ...baseItems,
        {
          name: 'Users',
          href: '/admin/users',
          icon: UsersIcon,
          current: location.pathname.startsWith('/admin/users')
        },
        {
          name: 'Analytics',
          href: '/admin/analytics',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/admin/analytics')
        },
        {
          name: 'Settings',
          href: '/admin/settings',
          icon: Cog6ToothIcon,
          current: location.pathname.startsWith('/admin/settings')
        }
      ]
    }

    return baseItems
  }

  const navigation = getNavigationItems()

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? 'bg-white' : 'bg-gray-50'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">Timamu</span>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={mobile ? () => setSidebarOpen(false) : undefined}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              item.current
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.roles?.[0]}
            </p>
          </div>
        </div>
        
        <div className="mt-3 space-y-1">
          <Link
            to="/profile"
            onClick={mobile ? () => setSidebarOpen(false) : undefined}
            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </Link>
          <Link
            to="/settings"
            onClick={mobile ? () => setSidebarOpen(false) : undefined}
            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-2" />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 md:hidden"
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex flex-col w-full max-w-xs bg-white"
          >
            <Sidebar mobile />
          </motion.div>
        </motion.div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 md:hidden"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome back, {user?.name?.split(' ')[0]}!
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
