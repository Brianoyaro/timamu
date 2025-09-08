import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LanguageSwitcher } from '../components/common/LanguageSwitcher'
import { ThemeToggle } from '../components/common/ThemeToggle'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-therapeutic-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4 lg:p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ML</span>
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">
            MindLink
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          © 2025 MindLink. Professional telepsychology platform.
        </p>
        <div className="mt-2 space-x-4">
          <a href="/privacy" className="hover:text-primary-600 transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-primary-600 transition-colors">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  )
}
