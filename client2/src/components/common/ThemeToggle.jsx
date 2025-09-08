import React from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useThemeStore()

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}
