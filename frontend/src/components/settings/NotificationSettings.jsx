import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BellIcon } from '@heroicons/react/24/outline'

export function NotificationSettings() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    appointmentReminders: true,
    messageNotifications: true,
    sessionRecordings: true,
    marketingEmails: false
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      // Mock API call - replace with real implementation
      console.log('Saving notification settings:', settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const notificationOptions = [
    {
      key: 'emailNotifications',
      title: 'Email Notifications',
      description: 'Receive notifications via email'
    },
    {
      key: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Receive browser push notifications'
    },
    {
      key: 'smsNotifications',
      title: 'SMS Notifications',
      description: 'Receive notifications via text message'
    },
    {
      key: 'appointmentReminders',
      title: 'Appointment Reminders',
      description: 'Get reminded about upcoming sessions'
    },
    {
      key: 'messageNotifications',
      title: 'New Messages',
      description: 'Notifications for new messages from your therapist'
    },
    {
      key: 'sessionRecordings',
      title: 'Session Recording Alerts',
      description: 'Notifications about session recordings'
    },
    {
      key: 'marketingEmails',
      title: 'Marketing Emails',
      description: 'Receive updates about new features and resources'
    }
  ]

  return (
    <div className="card p-6">
      <div className="flex items-center mb-6">
        <BellIcon className="h-6 w-6 text-gray-400 mr-3" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Notification Preferences
        </h2>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {option.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {option.description}
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[option.key]}
                onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
