import { ref, watch, onUnmounted } from 'vue'

type SettingKey =
  | 'autoStart'
  | 'language'
  | 'vndbApiKey'
  | 'bangumiToken'
  | 'lePath'
  | 'magpiePath'
  | 'magpieScale'
  | 'backupDir'
  | 'trackPlaytime'
  | 'recordHistory'
  | 'autoSyncMetadata'
  | 'metadataSource'

export function useSettings() {
  const autoStart = ref(false)
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  const vndbApiKey = ref('')
  const bangumiToken = ref('')
  const lePath = ref('')
  const magpiePath = ref('')
  const magpieScale = ref('2.0')
  const backupDir = ref('')
  const trackPlaytime = ref(true)
  const recordHistory = ref(true)
  const autoSyncMetadata = ref(false)
  const metadataSource = ref<'vndb' | 'bangumi'>('bangumi')

  const loadConfig = async (): Promise<void> => {
    try {
      const cfg = await window.api.getAllConfig()
      autoStart.value = cfg.autoStart ?? false
      language.value = cfg.language ?? 'zh-CN'
      vndbApiKey.value = cfg.vndbApiKey ?? ''
      bangumiToken.value = cfg.bangumiToken ?? ''
      lePath.value = cfg.lePath ?? ''
      magpiePath.value = cfg.magpiePath ?? ''
      magpieScale.value = cfg.magpieScale ?? '2.0'
      backupDir.value = cfg.backupDir ?? ''
      trackPlaytime.value = cfg.trackPlaytime ?? true
      recordHistory.value = cfg.recordHistory ?? true
      autoSyncMetadata.value = cfg.autoSyncMetadata ?? false
      metadataSource.value = cfg.metadataSource ?? 'bangumi'
    } catch {
      /* use defaults */
    }
  }

  const setupPersistence = (): void => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const dirty = new Set<SettingKey>()
    const allRefs = [
      autoStart,
      language,
      vndbApiKey,
      bangumiToken,
      lePath,
      magpiePath,
      magpieScale,
      backupDir,
      trackPlaytime,
      recordHistory,
      autoSyncMetadata,
      metadataSource
    ] as const
    const keyList: SettingKey[] = [
      'autoStart',
      'language',
      'vndbApiKey',
      'bangumiToken',
      'lePath',
      'magpiePath',
      'magpieScale',
      'backupDir',
      'trackPlaytime',
      'recordHistory',
      'autoSyncMetadata',
      'metadataSource'
    ]
    watch(allRefs, (newVals, oldVals) => {
      for (let i = 0; i < newVals.length; i++) {
        if (newVals[i] !== oldVals[i]) dirty.add(keyList[i])
      }
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const tasks: Promise<void>[] = []
        for (const key of dirty) {
          const idx = keyList.indexOf(key)
          tasks.push(window.api.setConfig(key, allRefs[idx].value as never))
        }
        dirty.clear()
        Promise.all(tasks).catch(() => {})
      }, 500)
    })

    onUnmounted(() => {
      if (timer) clearTimeout(timer)
    })
  }

  const handleSelectLEPath = async (): Promise<void> => {
    const p = await window.api.pickFile([{ name: 'Executable', extensions: ['exe'] }])
    if (p) lePath.value = p
  }

  const handleSelectMagpiePath = async (): Promise<void> => {
    const p = await window.api.pickFile([{ name: 'Executable', extensions: ['exe'] }])
    if (p) magpiePath.value = p
  }

  const handleSelectBackupDir = async (): Promise<void> => {
    const result = await window.api.pickDirectory()
    if (result) backupDir.value = result
  }

  return {
    autoStart,
    language,
    vndbApiKey,
    bangumiToken,
    lePath,
    magpiePath,
    magpieScale,
    backupDir,
    trackPlaytime,
    recordHistory,
    autoSyncMetadata,
    metadataSource,
    loadConfig,
    setupPersistence,
    handleSelectLEPath,
    handleSelectMagpiePath,
    handleSelectBackupDir
  }
}
