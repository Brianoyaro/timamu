import React, { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import { Languages, Check } from 'lucide-react'
import clsx from 'clsx'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  // { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode)
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <span className="sr-only">Change language</span>
        <Languages className="h-5 w-5" />
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {languages.map((lang) => (
              <Menu.Item key={lang.code}>
                {({ active }) => (
                  <button
                    onClick={() => handleLanguageChange(lang.code)}
                    className={clsx(
                      'group flex items-center w-full px-4 py-2 text-sm',
                      active 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'text-gray-700 dark:text-gray-300',
                      i18n.language === lang.code && 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    )}
                  >
                    <span className="mr-3 text-base">{lang.flag}</span>
                    {lang.name}
                    {i18n.language === lang.code && (
                      <Check className="ml-auto h-4 w-4 text-primary-600 dark:text-primary-400" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
