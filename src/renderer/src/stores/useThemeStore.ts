import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<Theme>('light')

  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')

  const applyTheme = (theme: Theme): void => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const initTheme = (): void => {
    const saved = localStorage.getItem('lunamanager-theme') as Theme | null
    currentTheme.value = saved || 'light'
    applyTheme(currentTheme.value)
  }

  const setTheme = (theme: Theme): void => {
    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem('lunamanager-theme', theme)
  }

  const toggleTheme = (): void => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  return { currentTheme, isDark, isLight, initTheme, setTheme, toggleTheme }
})
