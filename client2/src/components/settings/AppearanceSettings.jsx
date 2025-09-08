import React from 'react'
import { useTranslation } from 'react-i18next'
import { PaintBrushIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useThemeStore } from '../../store/themeStore'

export function AppearanceSettings() {
  const { t } = useTranslation()
  const { isDarkMode, toggleDarkMode } = useThemeStore()

  const themeOptions = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: SunIcon,
      active: !isDarkMode
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: MoonIcon,
      active: isDarkMode
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follow your device settings',
      icon: ComputerDesktopIcon,
      active: false // TODO: Implement system theme detection
    }
  ]

  const handleThemeChange = (themeId) => {
    if (themeId === 'light' && isDarkMode) {
      toggleDarkMode()
    } else if (themeId === 'dark' && !isDarkMode) {
      toggleDarkMode()
    }
    // TODO: Implement system theme option
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <PaintBrushIcon className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Theme
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                theme.active
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <theme.icon className={`h-6 w-6 ${
                  theme.active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                }`} />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {theme.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {theme.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Accessibility
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Reduce Motion
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Minimize animations and transitions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                High Contrast
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Increase color contrast for better visibility
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Large Text
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Increase text size for better readability
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Data & Privacy
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Export My Data
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download a copy of your personal data
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="btn btn-secondary flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                Delete Account
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            />

            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Delete Account
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This will permanently delete your account and all associated data. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="w-full btn bg-red-600 hover:bg-red-700 text-white border-red-600 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 w-full btn btn-secondary sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
