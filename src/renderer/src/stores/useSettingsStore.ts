import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AppConfig } from '../../../shared/types'

export interface AppSettings {
  // 基础配置
  autoStart: boolean
  autoUpdate: boolean

  // 元数据设置
  metadataSource: 'vndb' | 'bangumi'
  autoSyncMetadata: boolean

  // 外观设置
  language: 'zh-CN' | 'en-US'

  // 游玩配置
  trackPlaytime: boolean
  recordHistory: boolean
}

const defaultSettings: AppSettings = {
  autoStart: false,
  autoUpdate: true,
  metadataSource: 'bangumi',
  autoSyncMetadata: true,
  language: 'zh-CN',
  trackPlaytime: true,
  recordHistory: true
}

// Electron Store 配置键名映射
const configKeyMap: Record<keyof AppSettings, keyof AppConfig> = {
  autoStart: 'autoStart',
  autoUpdate: 'autoUpdate',
  metadataSource: 'metadataSource',
  autoSyncMetadata: 'autoSyncMetadata',
  language: 'language',
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

  // Actions
  const initSettings = async (): Promise<void> => {
    isLoading.value = true
    try {
      const config = await window.api.getAllConfig()
      settings.value = {
        autoStart: config.autoStart ?? defaultSettings.autoStart,
        autoUpdate: config.autoUpdate ?? defaultSettings.autoUpdate,
        metadataSource: config.metadataSource ?? defaultSettings.metadataSource,
        autoSyncMetadata: config.autoSyncMetadata ?? defaultSettings.autoSyncMetadata,
        language: config.language ?? defaultSettings.language,
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
      await window.api.setConfig(configKey, value as unknown as AppConfig[typeof configKey])
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
          ;(configToSave as Record<string, unknown>)[configKey] = value
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
      await window.api.setAllConfig(defaultSettings as Partial<AppConfig>)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  return {
    // State
    settings,
    isLoading,
    // Getters
    allSettings,
    currentLanguage,
    // Actions
    initSettings,
    updateSetting,
    updateSettings,
    resetSettings
  }
})
