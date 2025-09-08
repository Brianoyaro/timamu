import React from 'react'
import { motion } from 'framer-motion'

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 ${className}`}
    >
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
      )}
      
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      
      {description && (
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-6">
          <button
            onClick={action.onClick}
            className="btn btn-primary"
          >
            {action.label}
          </button>
        </div>
      )}
    </motion.div>
  )
}
