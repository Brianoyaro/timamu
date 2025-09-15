import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToastStore } from '../../store/toastStore'

/**
 * Toast notification component for user feedback
 * Displays success, error, warning, and info messages
 */
const Toast = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircleIcon className="w-5 h-5" />,
    error: <XCircleIcon className="w-5 h-5" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5" />,
    info: <InformationCircleIcon className="w-5 h-5" />,
  }

  const colorClasses = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  }

  const iconColorClasses = {
    success: 'text-success-400',
    error: 'text-error-400',
    warning: 'text-warning-400',
    info: 'text-primary-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.3 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center w-full max-w-xs p-4 mb-4 border rounded-lg shadow-lg ${colorClasses[toast.type]}`}
    >
      <div className={`mr-3 ${iconColorClasses[toast.type]}`}>
        {icons[toast.type]}
      </div>
      
      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>
      
      <button
        onClick={() => onClose(toast.id)}
        className={`ml-3 p-1 rounded-md transition-colors duration-200 hover:bg-black hover:bg-opacity-10 ${iconColorClasses[toast.type]}`}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

/**
 * Toast container that manages all active toasts
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer
