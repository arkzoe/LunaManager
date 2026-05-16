import { ref, watch } from 'vue'

export function useSettings() {
  const autoStart = ref(false)
  const autoUpdate = ref(true)
  const downloadPath = ref('')
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  const vndbApiKey = ref('')
  const bangumiToken = ref('')
  const lePath = ref('')
  const magpiePath = ref('')
  const magpieScale = ref('2.0')
  const autoBackup = ref(false)
  const backupDir = ref('')
  const backupFrequency = ref<'daily' | 'weekly' | 'monthly'>('weekly')
  const backupMaxCopies = ref(5)
  const showGameCover = ref(true)
  const trackPlaytime = ref(true)
  const recordHistory = ref(true)
  const autoSyncMetadata = ref(false)
  const metadataSource = ref<'vndb' | 'bangumi'>('vndb')

  const loadConfig = async (): Promise<void> => {
    try {
      const cfg = await window.api.getAllConfig()
      autoStart.value = cfg.autoStart ?? false
      autoUpdate.value = cfg.autoUpdate ?? true
      downloadPath.value = cfg.downloadPath ?? ''
      language.value = cfg.language ?? 'zh-CN'
      vndbApiKey.value = cfg.vndbApiKey ?? ''
      bangumiToken.value = cfg.bangumiToken ?? ''
      lePath.value = cfg.lePath ?? ''
      magpiePath.value = cfg.magpiePath ?? ''
      magpieScale.value = cfg.magpieScale ?? '2.0'
      autoBackup.value = cfg.autoBackup ?? false
      backupDir.value = cfg.backupDir ?? ''
      backupFrequency.value = cfg.backupFrequency ?? 'weekly'
      backupMaxCopies.value = cfg.backupMaxCopies ?? 5
      showGameCover.value = cfg.showGameCover ?? true
      trackPlaytime.value = cfg.trackPlaytime ?? true
      recordHistory.value = cfg.recordHistory ?? true
      autoSyncMetadata.value = cfg.autoSyncMetadata ?? false
      metadataSource.value = cfg.metadataSource ?? 'vndb'
    } catch { /* use defaults */ }
  }

  const setupPersistence = (): void => {
    let saving = false
    watch(
      [autoStart, autoUpdate, downloadPath, language,
        vndbApiKey, bangumiToken, lePath, magpiePath, magpieScale,
        autoBackup, backupDir, backupFrequency, backupMaxCopies,
        showGameCover, trackPlaytime, recordHistory, autoSyncMetadata, metadataSource],
      () => {
        if (saving) return
        saving = true
        Promise.all([
          window.api.setConfig('autoStart' as const, autoStart.value),
          window.api.setConfig('autoUpdate' as const, autoUpdate.value),
          window.api.setConfig('downloadPath' as const, downloadPath.value),
          window.api.setConfig('language' as const, language.value),
          window.api.setConfig('vndbApiKey' as const, vndbApiKey.value),
          window.api.setConfig('bangumiToken' as const, bangumiToken.value),
          window.api.setConfig('lePath' as const, lePath.value),
          window.api.setConfig('magpiePath' as const, magpiePath.value),
          window.api.setConfig('magpieScale' as const, magpieScale.value),
          window.api.setConfig('autoBackup' as const, autoBackup.value),
          window.api.setConfig('backupDir' as const, backupDir.value),
          window.api.setConfig('backupFrequency' as const, backupFrequency.value),
          window.api.setConfig('backupMaxCopies' as const, backupMaxCopies.value),
          window.api.setConfig('showGameCover' as const, showGameCover.value),
          window.api.setConfig('trackPlaytime' as const, trackPlaytime.value),
          window.api.setConfig('recordHistory' as const, recordHistory.value),
          window.api.setConfig('autoSyncMetadata' as const, autoSyncMetadata.value),
          window.api.setConfig('metadataSource' as const, metadataSource.value)
        ]).finally(() => { saving = false })
      }
    )
  }

  const handleSelectLEPath = async (): Promise<void> => {
    const p = await window.api.pickFile([{ name: 'Executable', extensions: ['exe'] }])
    if (p) lePath.value = p
  }

  const handleSelectMagpiePath = async (): Promise<void> => {
    const p = await window.api.pickFile([{ name: 'Executable', extensions: ['exe'] }])
    if (p) magpiePath.value = p
  }

  const handleChangeDownloadPath = async (): Promise<void> => {
    const result = await window.api.pickFile()
    if (result) downloadPath.value = result
  }

  const handleSelectBackupDir = async (): Promise<void> => {
    const result = await window.api.pickFile()
    if (result) backupDir.value = result
  }

  return {
    autoStart, autoUpdate, downloadPath, language,
    vndbApiKey, bangumiToken, lePath, magpiePath, magpieScale,
    autoBackup, backupDir, backupFrequency, backupMaxCopies,
    showGameCover, trackPlaytime, recordHistory, autoSyncMetadata, metadataSource,
    loadConfig, setupPersistence,
    handleSelectLEPath, handleSelectMagpiePath, handleChangeDownloadPath, handleSelectBackupDir
  }
}
