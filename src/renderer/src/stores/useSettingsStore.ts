import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AppConfig } from '../../../shared/types'

export interface AppSettings {
  autoStart: boolean
  autoUpdate: boolean
  vndbApiKey: string
  bangumiToken: string
  magpiePath: string
  magpieHotkey: 'fullscreen' | 'windowed'
  autoLaunchMagpie: boolean
  magpieDelay: number
  backupDir: string
  trackPlaytime: boolean
  recordHistory: boolean
  autoSyncMetadata: boolean
  metadataSource: 'vndb' | 'bangumi'
}

const defaultSettings: AppSettings = {
  autoStart: false,
  autoUpdate: true,
  vndbApiKey: '',
  bangumiToken: '',
  magpiePath: '',
  magpieHotkey: 'fullscreen',
  autoLaunchMagpie: true,
  magpieDelay: 5000,
  backupDir: '',
  trackPlaytime: true,
  recordHistory: true,
  autoSyncMetadata: false,
  metadataSource: 'bangumi'
}

const configKeyMap: Record<keyof AppSettings, keyof AppConfig> = {
  autoStart: 'autoStart',
  autoUpdate: 'autoUpdate',
  vndbApiKey: 'vndbApiKey',
  bangumiToken: 'bangumiToken',
  magpiePath: 'magpiePath',
  magpieHotkey: 'magpieHotkey',
  autoLaunchMagpie: 'autoLaunchMagpie',
  magpieDelay: 'magpieDelay',
  backupDir: 'backupDir',
  trackPlaytime: 'trackPlaytime',
  recordHistory: 'recordHistory',
  autoSyncMetadata: 'autoSyncMetadata',
  metadataSource: 'metadataSource'
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...defaultSettings })
  const isLoading = ref(false)

  const allSettings = computed(() => settings.value)

  const initSettings = async (): Promise<void> => {
    isLoading.value = true
    try {
      const config = await window.api.getAllConfig()
      for (const key of Object.keys(defaultSettings) as (keyof AppSettings)[]) {
        const val = config[configKeyMap[key] as keyof AppConfig]
        if (val !== undefined && val !== null) {
          ;(settings.value as Record<string, unknown>)[key] = val
        }
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

  return {
    settings,
    isLoading,
    allSettings,
    initSettings,
    updateSetting,
    updateSettings
  }
})
