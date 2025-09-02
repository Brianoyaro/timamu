import React from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { UserMenu } from './UserMenu'
import { TenantSwitcher } from './TenantSwitcher'
import { NotificationCenter } from '../notifications/NotificationCenter'
import { ThemeToggle } from '../common/ThemeToggle'
import { LanguageSwitcher } from '../common/LanguageSwitcher'

export function Header({ onMenuClick }) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={onMenuClick}
              aria-label="Open main menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-2 ml-2 lg:ml-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
                MindLink
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            <TenantSwitcher />
            <NotificationCenter />
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
