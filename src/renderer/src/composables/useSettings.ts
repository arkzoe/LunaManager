import { reactive, watch, onUnmounted } from 'vue'

type SettingKey =
  | 'autoStart'
  | 'language'
  | 'vndbApiKey'
  | 'bangumiToken'
  | 'magpiePath'
  | 'magpieHotkey'
  | 'autoLaunchMagpie'
  | 'magpieDelay'
  | 'backupDir'
  | 'trackPlaytime'
  | 'recordHistory'
  | 'autoSyncMetadata'
  | 'metadataSource'

export function useSettings() {
  const settings = reactive({
    autoStart: false,
    language: 'zh-CN' as 'zh-CN' | 'en-US',
    vndbApiKey: '',
    bangumiToken: '',
    magpiePath: '',
    magpieHotkey: 'fullscreen' as 'fullscreen' | 'windowed',
    autoLaunchMagpie: true,
    magpieDelay: 5000,
    backupDir: '',
    trackPlaytime: true,
    recordHistory: true,
    autoSyncMetadata: false,
    metadataSource: 'bangumi' as 'vndb' | 'bangumi'
  })

  const loadConfig = async (): Promise<void> => {
    try {
      const cfg = await window.api.getAllConfig()
      settings.autoStart = cfg.autoStart ?? false
      settings.language = cfg.language ?? 'zh-CN'
      settings.vndbApiKey = cfg.vndbApiKey ?? ''
      settings.bangumiToken = cfg.bangumiToken ?? ''
      settings.magpiePath = cfg.magpiePath ?? ''
      settings.magpieHotkey = cfg.magpieHotkey ?? 'fullscreen'
      settings.autoLaunchMagpie = cfg.autoLaunchMagpie ?? true
      settings.magpieDelay = cfg.magpieDelay ?? 5000
      settings.backupDir = cfg.backupDir ?? ''
      settings.trackPlaytime = cfg.trackPlaytime ?? true
      settings.recordHistory = cfg.recordHistory ?? true
      settings.autoSyncMetadata = cfg.autoSyncMetadata ?? false
      settings.metadataSource = cfg.metadataSource ?? 'bangumi'
    } catch {
      /* use defaults */
    }
  }

  const setupPersistence = (): void => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const dirty = new Set<SettingKey>()
    const keyList: SettingKey[] = [
      'autoStart',
      'language',
      'vndbApiKey',
      'bangumiToken',
      'magpiePath',
      'magpieHotkey',
      'autoLaunchMagpie',
      'magpieDelay',
      'backupDir',
      'trackPlaytime',
      'recordHistory',
      'autoSyncMetadata',
      'metadataSource'
    ]
    watch(
      () => keyList.map((k) => settings[k]),
      (newVals, oldVals) => {
        if (!oldVals) return
        for (let i = 0; i < newVals.length; i++) {
          if (newVals[i] !== oldVals[i]) dirty.add(keyList[i])
        }
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          const tasks: Promise<void>[] = []
          for (const key of dirty) {
            tasks.push(window.api.setConfig(key, settings[key] as never))
          }
          dirty.clear()
          Promise.all(tasks).catch(() => {})
        }, 500)
      }
    )

    onUnmounted(() => {
      if (timer) clearTimeout(timer)
    })
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
