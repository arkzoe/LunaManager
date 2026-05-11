import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

type Theme = 'dark' | 'light'

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<Theme>('dark')

  // Getters
  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')

  // Actions
  const initTheme = (): void => {
    const saved = localStorage.getItem('lunamanager-theme') as Theme | null
    if (saved) {
      currentTheme.value = saved
    } else {
      currentTheme.value = 'dark'
    }
    applyTheme(currentTheme.value)
  }

  const applyTheme = (theme: Theme): void => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }

  const setTheme = (theme: Theme): void => {
    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem('lunamanager-theme', theme)
  }

  const toggleTheme = (): void => {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return {
    // State
    currentTheme,
    // Getters
    isDark,
    isLight,
    // Actions
    initTheme,
    setTheme,
    toggleTheme
  }
})
