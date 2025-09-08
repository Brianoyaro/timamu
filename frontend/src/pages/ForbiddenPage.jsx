import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, Home } from 'lucide-react'

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Access Denied
        </h1>
        
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
        
        <Link
          to="/"
          className="mt-6 inline-flex items-center btn btn-primary"
        >
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Link>
      </motion.div>
    </div>
  )
}
