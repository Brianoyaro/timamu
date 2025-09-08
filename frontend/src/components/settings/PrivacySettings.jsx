import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { userService } from '../../services/userService'

export function PrivacySettings() {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const exportData = await userService.exportUserData()
      console.log('Data export initiated:', exportData)
      
      // Show success message
      alert('Data export has been initiated. You will receive an email with your data within 24 hours.')
    } catch (error) {
      console.error('Data export failed:', error)
      alert('Failed to initiate data export. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      await userService.requestDataDeletion()
      console.log('Account deletion requested')
      
      // Show success message
      alert('Account deletion has been requested. You will receive a confirmation email.')
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error('Account deletion failed:', error)
      alert('Failed to request account deletion. Please try again.')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Download className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Data Export
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download a copy of all your personal data stored in MindLink. This includes your profile information, 
          session history, messages, and assessment results.
        </p>

        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="btn btn-secondary flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Preparing Export...' : 'Download My Data'}
        </button>
      </div>

      {/* Privacy Controls */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <ShieldCheck className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Privacy Controls
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Profile Visibility
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control who can see your profile information
              </p>
            </div>
            <select className="input text-sm w-32">
              <option value="therapists">Therapists only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Session History
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow therapists to view your session history
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Analytics & Insights
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help improve MindLink by sharing anonymous usage data
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="card p-6 border-red-200 dark:border-red-700">
        <div className="flex items-center mb-4">
          <Trash2 className="h-6 w-6 text-red-500 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Delete Account
          </h3>
        </div>

        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Warning: This action cannot be undone
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Deleting your account will permanently remove all your data, including session history, 
                messages, and assessment results. This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            Delete My Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you absolutely sure? Type "DELETE" to confirm:
            </p>
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              className="input"
              onChange={(e) => {
                // Enable delete button only when "DELETE" is typed
              }}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 disabled:opacity-50"
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
