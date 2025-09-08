import { create } from 'zustand'

export const useThemeStore = create((set, get) => ({
  isDarkMode: false,
  isInitialized: false,
  
  toggleDarkMode: () => {
    const newMode = !get().isDarkMode
    set({ isDarkMode: newMode })
    localStorage.setItem('mindlink_dark_mode', newMode.toString())
    
    // Apply to document root
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },

  initializeTheme: () => {
    if (get().isInitialized) return
    
    const savedMode = localStorage.getItem('mindlink_dark_mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDarkMode = savedMode ? savedMode === 'true' : prefersDark
    
    set({ isDarkMode, isInitialized: true })
    
    // Apply to document root
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}))
