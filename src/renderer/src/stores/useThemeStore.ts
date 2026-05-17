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
    if (saved === 'light' || saved === 'dark') {
      currentTheme.value = saved
      applyTheme(currentTheme.value)
    } else {
      window.api.getConfig('theme').then((t) => {
        currentTheme.value = t || 'light'
        applyTheme(currentTheme.value)
        localStorage.setItem('lunamanager-theme', currentTheme.value)
      }).catch(() => {
        currentTheme.value = 'light'
        applyTheme(currentTheme.value)
      })
    }
  }

  const setTheme = async (theme: Theme): Promise<void> => {
    currentTheme.value = theme
    applyTheme(theme)
    localStorage.setItem('lunamanager-theme', theme)
    try {
      await window.api.setConfig('theme', theme)
    } catch { /* ignore */ }
  }

  const toggleTheme = (): void => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  return { currentTheme, isDark, isLight, initTheme, setTheme, toggleTheme }
})
