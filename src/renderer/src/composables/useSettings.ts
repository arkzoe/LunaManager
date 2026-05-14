import { ref, watch } from 'vue'
import type { AppConfig } from '../../../shared/types'

const persist = <K extends keyof AppConfig>(
  key: K,
  r: ReturnType<typeof ref<AppConfig[K]>>
): void => {
  watch(r, (v) => {
    if (v !== undefined) window.api.setConfig(key, v)
  })
}

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
    persist('autoStart', autoStart)
    persist('autoUpdate', autoUpdate)
    persist('downloadPath', downloadPath)
    persist('language', language)
    persist('vndbApiKey', vndbApiKey)
    persist('bangumiToken', bangumiToken)
    persist('lePath', lePath)
    persist('magpiePath', magpiePath)
    persist('magpieScale', magpieScale)
    persist('autoBackup', autoBackup)
    persist('backupDir', backupDir)
    persist('backupFrequency', backupFrequency)
    persist('backupMaxCopies', backupMaxCopies)
    persist('showGameCover', showGameCover)
    persist('trackPlaytime', trackPlaytime)
    persist('recordHistory', recordHistory)
    persist('autoSyncMetadata', autoSyncMetadata)
    persist('metadataSource', metadataSource)
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
