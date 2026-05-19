import { autoUpdater } from 'electron-updater'
import { BrowserWindow, Notification, app } from 'electron'
import { join } from 'path'
import { existsSync, rmSync } from 'fs'
import { getConfig, setConfig } from '../config/store'

export function checkAutoUpdateCheckedToday(): boolean {
  const last = getConfig('lastUpdateCheckDate')
  if (!last) return false
  const today = new Date().toISOString().slice(0, 10)
  return last === today
}

export function markAutoUpdateCheckedToday(): void {
  const today = new Date().toISOString().slice(0, 10)
  setConfig('lastUpdateCheckDate', today)
}

function cleanupUpdateCache(): void {
  const cacheDir = join(app.getPath('userData'), 'lunamanager-updater')
  if (existsSync(cacheDir)) {
    rmSync(cacheDir, { recursive: true, force: true })
  }
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  const wins = BrowserWindow.getAllWindows()
  for (const win of wins) {
    win.webContents.send(channel, ...args)
  }
}

export function setupUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update:status', 'checking')
  })

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('update:status', 'available', {
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('update:status', 'not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update:status', 'downloading', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('update:status', 'downloaded')

    const notification = new Notification({
      title: '更新完成',
      body: `v${info.version} 已下载完成，重启应用以安装更新`
    })
    notification.on('click', () => {
      const wins = BrowserWindow.getAllWindows()
      if (wins.length > 0) {
        const win = wins[0]
        if (win.isMinimized()) win.restore()
        win.focus()
        win.webContents.send('update:status', 'downloaded')
      }
    })
    notification.show()
  })

  autoUpdater.on('error', (err) => {
    sendToRenderer('update:status', 'error', { message: err.message })
  })
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

export async function checkForUpdates(skipDailyCheck = false): Promise<{
  updateAvailable: boolean
  version?: string
  releaseNotes?: string
  error?: string
}> {
  if (!skipDailyCheck && checkAutoUpdateCheckedToday()) {
    return { updateAvailable: false }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    if (result?.updateInfo) {
      markAutoUpdateCheckedToday()
      const currentVersion = app.getVersion()
      const remoteVersion = result.updateInfo.version
      if (compareVersions(remoteVersion, currentVersion) > 0) {
        return {
          updateAvailable: true,
          version: remoteVersion,
          releaseNotes: result.updateInfo.releaseNotes as string | undefined
        }
      }
      return { updateAvailable: false }
    }
    markAutoUpdateCheckedToday()
    return { updateAvailable: false }
  } catch (err) {
    return {
      updateAvailable: false,
      error: err instanceof Error ? err.message : '检查更新失败'
    }
  }
}

let cancellationToken: { cancel: () => void } | null = null

export async function downloadUpdate(): Promise<void> {
  const { CancellationToken } = await import('builder-util-runtime')
  const token = new CancellationToken()
  cancellationToken = token
  await autoUpdater.downloadUpdate(token)
}

export function cancelDownload(): void {
  cancellationToken?.cancel()
  cancellationToken = null
}

export async function quitAndInstall(): Promise<void> {
  cleanupUpdateCache()
  autoUpdater.quitAndInstall()
}
