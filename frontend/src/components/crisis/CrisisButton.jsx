import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { analyticsService } from '../../services/analyticsService'
import crisisConfig from '../../config/crisis.json'

export function CrisisButton() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCrisisClick = () => {
    setIsModalOpen(true)
    analyticsService.trackCrisisResourceAccessed('crisis_button')
  }

  const handleHotlineClick = (hotline) => {
    analyticsService.trackCrisisResourceAccessed(`hotline_${hotline.name}`)
    window.open(`tel:${hotline.phone}`, '_self')
  }

  return (
    <>
      {/* Crisis button - always visible */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCrisisClick}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label={t('crisis.needHelp')}
      >
        <ExclamationTriangleIcon className="h-6 w-6" />
      </motion.button>

      {/* Crisis resources modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsModalOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
              >
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      {t('crisis.crisisTitle')}
                    </h3>
                    
                    <div className="mt-2">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {t('crisis.emergencyNotice')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {t('crisis.hotlines')}
                  </h4>
                  
                  <div className="space-y-2">
                    {crisisConfig.hotlines.map((hotline) => (
                      <button
                        key={hotline.name}
                        onClick={() => handleHotlineClick(hotline)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <PhoneIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {hotline.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {hotline.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          {hotline.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> MindLink is not intended for emergency situations. 
                    If you are in immediate danger, please contact emergency services (911) 
                    or go to your nearest emergency room.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
