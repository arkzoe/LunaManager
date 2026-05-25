import { reactive, watch, onUnmounted } from 'vue'
import type { AppSettings } from '../stores/useSettingsStore'
import { useSettingsStore } from '../stores/useSettingsStore'

export function useSettings() {
  const store = useSettingsStore()
  let persistTimer: ReturnType<typeof setTimeout> | null = null

  onUnmounted(() => {
    if (persistTimer) clearTimeout(persistTimer)
  })

  const settings = reactive<AppSettings>({
    autoStart: false,
    autoUpdate: true,
    minimizeToTray: false,
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
  })

  const loadConfig = async (): Promise<void> => {
    await store.initSettings()
    // Sync store values into the reactive proxy
    const stored = store.settings
    for (const key of Object.keys(settings) as (keyof AppSettings)[]) {
      ;(settings as Record<string, unknown>)[key] = stored[key]
    }
  }

  const setupPersistence = (): void => {
    const dirty = new Set<keyof AppSettings>()

    const watchedKeys = [
      'autoStart', 'autoUpdate', 'minimizeToTray', 'vndbApiKey', 'bangumiToken',
      'magpiePath', 'magpieHotkey', 'autoLaunchMagpie', 'magpieDelay',
      'backupDir', 'trackPlaytime', 'recordHistory', 'autoSyncMetadata', 'metadataSource'
    ] as const

    watch(
      () => watchedKeys.map((k) => settings[k]),
      (newVals, oldVals) => {
        if (!oldVals) return
        for (let i = 0; i < watchedKeys.length; i++) {
          if (newVals[i] !== oldVals[i]) {
            const key = watchedKeys[i]
            dirty.add(key)
            ;(store.settings as Record<string, unknown>)[key] = newVals[i]
          }
        }
        if (persistTimer) clearTimeout(persistTimer)
        persistTimer = setTimeout(async () => {
          const tasks: Promise<void>[] = []
          for (const k of dirty) {
            tasks.push(store.updateSetting(k, settings[k] as never))
          }
          dirty.clear()
          await Promise.allSettled(tasks)
        }, 500)
      }
    )
  }

  const handleSelectMagpiePath = async (): Promise<void> => {
    const p = await window.api.pickFile([{ name: 'Executable', extensions: ['exe'] }])
    if (p) settings.magpiePath = p
  }

  const handleSelectBackupDir = async (): Promise<void> => {
    const result = await window.api.pickDirectory()
    if (result) settings.backupDir = result
  }

  return {
    settings,
    loadConfig,
    setupPersistence,
    handleSelectMagpiePath,
    handleSelectBackupDir
  }
}
