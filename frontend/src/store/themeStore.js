import { create } from 'zustand'

export const useThemeStore = create((set, get) => ({
  isDarkMode: false,
  
  toggleDarkMode: () => {
    const newMode = !get().isDarkMode
    set({ isDarkMode: newMode })
    localStorage.setItem('mindlink_dark_mode', newMode.toString())
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },

  initializeTheme: () => {
    const savedMode = localStorage.getItem('mindlink_dark_mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDarkMode = savedMode ? savedMode === 'true' : prefersDark
    
    set({ isDarkMode })
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }
}))

// Initialize theme on module load
if (typeof window !== 'undefined') {
  useThemeStore.getState().initializeTheme()
}
