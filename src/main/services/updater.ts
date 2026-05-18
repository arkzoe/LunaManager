import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export function setupUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  function sendToRenderer(channel: string, ...args: unknown[]): void {
    const wins = BrowserWindow.getAllWindows()
    for (const win of wins) {
      win.webContents.send(channel, ...args)
    }
  }

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

  autoUpdater.on('update-downloaded', () => {
    sendToRenderer('update:status', 'downloaded')
  })

  autoUpdater.on('error', (err) => {
    sendToRenderer('update:status', 'error', { message: err.message })
  })
}

export async function checkForUpdates(): Promise<{
  updateAvailable: boolean
  version?: string
  releaseNotes?: string
  error?: string
}> {
  try {
    const result = await autoUpdater.checkForUpdates()
    if (result?.updateInfo) {
      return {
        updateAvailable: true,
        version: result.updateInfo.version,
        releaseNotes: result.updateInfo.releaseNotes as string | undefined
      }
    }
    return { updateAvailable: false }
  } catch (err) {
    return {
      updateAvailable: false,
      error: err instanceof Error ? err.message : '检查更新失败'
    }
  }
}

export async function downloadUpdate(): Promise<void> {
  autoUpdater.downloadUpdate()
}

export async function quitAndInstall(): Promise<void> {
  autoUpdater.quitAndInstall()
}
