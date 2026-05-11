import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface AppSettings {
  // 基础配置
  autoStart: boolean
  autoUpdate: boolean
  downloadPath: string

  // 元数据设置
  metadataSource: 'steam' | 'igdb' | 'rawg'
  autoSyncMetadata: boolean

  // 外观设置
  language: 'zh-CN' | 'en-US'
  sidebarCollapsed: boolean
  showGameCover: boolean

  // 游玩配置
  trackPlaytime: boolean
  recordHistory: boolean
}

// AppConfig 类型（与主进程一致）
interface AppConfig {
  windowBounds: {
    width: number
    height: number
    x?: number
    y?: number
  }
  autoStart: boolean
  autoUpdate: boolean
  downloadPath: string
  metadataSource: 'steam' | 'igdb' | 'rawg'
  autoSyncMetadata: boolean
  theme: 'dark' | 'light'
  language: 'zh-CN' | 'en-US'
  sidebarCollapsed: boolean
  showGameCover: boolean
  trackPlaytime: boolean
  recordHistory: boolean
  dbPath: string
}

const defaultSettings: AppSettings = {
  autoStart: false,
  autoUpdate: true,
  downloadPath: '',
  metadataSource: 'steam',
  autoSyncMetadata: true,
  language: 'zh-CN',
  sidebarCollapsed: false,
  showGameCover: true,
  trackPlaytime: true,
  recordHistory: true
}

// Electron Store 配置键名映射
const configKeyMap: Record<keyof AppSettings, keyof AppConfig> = {
  autoStart: 'autoStart',
  autoUpdate: 'autoUpdate',
  downloadPath: 'downloadPath',
  metadataSource: 'metadataSource',
  autoSyncMetadata: 'autoSyncMetadata',
  language: 'language',
  sidebarCollapsed: 'sidebarCollapsed',
  showGameCover: 'showGameCover',
  trackPlaytime: 'trackPlaytime',
  recordHistory: 'recordHistory'
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<AppSettings>({ ...defaultSettings })
  const isLoading = ref(false)

  // Getters
  const allSettings = computed(() => settings.value)

  const currentLanguage = computed(() => settings.value.language)

  const isSidebarCollapsed = computed(() => settings.value.sidebarCollapsed)

  // Actions
  const initSettings = async (): Promise<void> => {
    isLoading.value = true
    try {
      const config = await window.api.getAllConfig()
      settings.value = {
        autoStart: config.autoStart ?? defaultSettings.autoStart,
        autoUpdate: config.autoUpdate ?? defaultSettings.autoUpdate,
        downloadPath: config.downloadPath ?? defaultSettings.downloadPath,
        metadataSource: config.metadataSource ?? defaultSettings.metadataSource,
        autoSyncMetadata: config.autoSyncMetadata ?? defaultSettings.autoSyncMetadata,
        language: config.language ?? defaultSettings.language,
        sidebarCollapsed: config.sidebarCollapsed ?? defaultSettings.sidebarCollapsed,
        showGameCover: config.showGameCover ?? defaultSettings.showGameCover,
        trackPlaytime: config.trackPlaytime ?? defaultSettings.trackPlaytime,
        recordHistory: config.recordHistory ?? defaultSettings.recordHistory
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> => {
    settings.value[key] = value

    try {
      const configKey = configKeyMap[key]
      await window.api.setConfig(configKey, value as AppConfig[typeof configKey])
    } catch (error) {
      console.error('Failed to save setting:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    settings.value = { ...settings.value, ...newSettings }

    try {
      const configToSave: Partial<AppConfig> = {}
      for (const [key, value] of Object.entries(newSettings)) {
        const configKey = configKeyMap[key as keyof AppSettings]
        if (configKey) {
          configToSave[configKey] = value as AppConfig[typeof configKey]
        }
      }
      await window.api.setAllConfig(configToSave)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const resetSettings = async (): Promise<void> => {
    settings.value = { ...defaultSettings }

    try {
      await window.api.setAllConfig(defaultSettings)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  const toggleSidebar = async (): Promise<void> => {
    await updateSetting('sidebarCollapsed', !settings.value.sidebarCollapsed)
  }

  return {
    // State
    settings,
    isLoading,
    // Getters
    allSettings,
    currentLanguage,
    isSidebarCollapsed,
    // Actions
    initSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    toggleSidebar
  }
})
