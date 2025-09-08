import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400">
          404
        </h1>
        
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Page not found
        </h2>
        
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has been moved.
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
