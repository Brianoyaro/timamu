import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { 
  Bell,
  ShieldCheck,
  Globe,
  Palette,
  Smartphone
} from 'lucide-react'
import { NotificationSettings } from '../components/settings/NotificationSettings'
import { PrivacySettings } from '../components/settings/PrivacySettings'
import { AppearanceSettings } from '../components/settings/AppearanceSettings'
import { analyticsService } from '../services/analyticsService'

const settingsSections = [
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    component: NotificationSettings
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    icon: ShieldCheck,
    component: PrivacySettings
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: Palette,
    component: AppearanceSettings
  }
]

export function SettingsPage() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState('notifications')

  React.useEffect(() => {
    analyticsService.page('Settings')
  }, [])

  const ActiveComponent = settingsSections.find(s => s.id === activeSection)?.component

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('navigation.settings')}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left',
                  activeSection === section.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <section.icon className="h-5 w-5 mr-3" />
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
