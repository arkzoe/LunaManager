import { app, shell, BrowserWindow, ipcMain, protocol, net, dialog, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { existsSync, createReadStream, rmSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import iconPath from '../../resources/icon.png?asset'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debounceSetBounds(mainWindow: BrowserWindow): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const b = mainWindow.getBounds()
    setConfig('windowBounds', { width: b.width, height: b.height, x: b.x, y: b.y })
    debounceTimer = null
  }, 200)
}
import {
  initDatabase,
  closeDatabase,
  gameOps,
  sessionOps,
  collectionOps,
  snapshotOps
} from './database'
import { getConfig, setConfig, getAllConfig, setAllConfig } from './config/store'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function createWindow(): void {
  const bounds = getConfig('windowBounds')
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon: iconPath } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow!.on('ready-to-show', () => mainWindow!.show())

  mainWindow!.on('close', (event) => {
    if (isQuitting) return
    if (getConfig('minimizeToTray')) {
      event.preventDefault()
      mainWindow!.hide()
      return
    }
    event.preventDefault()
    mainWindow!.webContents.send('app:request-quit-flow')
  })

  mainWindow!.on('resize', () => debounceSetBounds(mainWindow!))
  mainWindow!.on('move', () => debounceSetBounds(mainWindow!))

  mainWindow!.on('maximize', () => mainWindow!.webContents.send('window:maximize-change', true))
  mainWindow!.on('unmaximize', () => mainWindow!.webContents.send('window:maximize-change', false))

  mainWindow!.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow!.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow!.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(mainWindow: BrowserWindow): void {
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('LunaManager')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => handleQuit(mainWindow)
    }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
    mainWindow.focus()
  })
}

async function handleQuit(win: BrowserWindow): Promise<void> {
  try {
    const result = await win.webContents.executeJavaScript(
      'window.api.requestQuit()',
      true
    )
    if (result.hasActiveGames) {
      win.webContents.send('app:show-quit-dialog', result.games)
    } else {
      await endAllActiveSessionsAndQuit()
    }
  } catch {
    await endAllActiveSessionsAndQuit()
  }
}

async function endAllActiveSessionsAndQuit(): Promise<void> {
  isQuitting = true
  await endAllActiveSessions()
  await killMagpieIfLaunched()
  closeDatabase()
  app.quit()
}

function setupIpcHandlers(): void {
  // ===== Games =====
  ipcMain.handle('db:getGames', () => gameOps.getList())
  ipcMain.handle('db:getGameById', (_, id: string) => gameOps.getById(id) || null)
  ipcMain.handle('db:createGame', (_, game) => gameOps.create(game))
  ipcMain.handle('db:updateGame', (_, id: string, updates) => gameOps.update(id, updates))
  ipcMain.handle('db:deleteGame', (_, id: string) => {
    const game = gameOps.getById(id)
    if (game) {
      if (game.cover && game.cover.startsWith('cover://')) {
        const coverPath = resolveCoverPath(game.cover)
        if (existsSync(coverPath)) rmSync(coverPath)
      }
      const snapDir = getSnapshotDir(id)
      if (existsSync(snapDir)) rmSync(snapDir, { recursive: true })
    }
    return gameOps.delete(id)
  })
  ipcMain.handle('db:searchGames', (_, q: string) => gameOps.search(q))

  // ===== Config =====
  ipcMain.handle(
    'config:get',
    <K extends keyof AppConfig>(_e: Electron.IpcMainInvokeEvent, key: K) => getConfig(key)
  )
  ipcMain.handle(
    'config:set',
    <K extends keyof AppConfig>(_e: Electron.IpcMainInvokeEvent, key: K, value: AppConfig[K]) => {
      setConfig(key, value)
      if (key === 'autoStart') {
        app.setLoginItemSettings({ openAtLogin: value as boolean })
      }
    }
  )
  ipcMain.handle('config:getAll', () => getAllConfig())
  ipcMain.handle('config:setAll', (_, config) => setAllConfig(config))

  // ===== Play Sessions =====
  ipcMain.handle('play:startSession', (_, gameId: string) => sessionOps.start(gameId))
  ipcMain.handle('play:endSession', (_, sessionId: string) => sessionOps.end(sessionId))
  ipcMain.handle('play:getTotalPlaytime', (_, gameId: string) =>
    sessionOps.getTotalPlaytime(gameId)
  )
  ipcMain.handle('play:getSessionsByGame', (_, gameId: string) => sessionOps.getByGameId(gameId))
  ipcMain.handle('play:getAllSessions', () => sessionOps.getAll())
  ipcMain.handle('play:getAggregatedStats', (_, gameId: string) =>
    sessionOps.getAggregatedStats(gameId)
  )
  ipcMain.handle('play:getAllAggregatedStats', () => sessionOps.getAllAggregatedStats())

  // ===== Game Launch =====
  ipcMain.handle('launch:game', async (_, gameId: string, modes: LaunchMode[]) => {
    return launchGame(gameId, modes)
  })
  ipcMain.handle('launch:stop', (_, gameId: string) => {
    return stopGame(gameId)
  })
  ipcMain.handle('launch:isRunning', (_, gameId: string) => {
    return isGameRunning(gameId)
  })

  // ===== Collections =====
  ipcMain.handle('col:getAll', () => collectionOps.getAll())
  ipcMain.handle('col:create', (_, name: string) => collectionOps.create(name))
  ipcMain.handle('col:rename', (_, id: string, name: string) => collectionOps.rename(id, name))
  ipcMain.handle('col:delete', (_, id: string) => collectionOps.delete(id))
  ipcMain.handle('col:addGame', (_, gameId: string, colId: string) =>
    collectionOps.addGame(gameId, colId)
  )
  ipcMain.handle('col:removeGame', (_, gameId: string, colId: string) =>
    collectionOps.removeGame(gameId, colId)
  )
  ipcMain.handle('col:getCollectionGames', (_, colId: string) =>
    collectionOps.getCollectionGames(colId)
  )
  ipcMain.handle('col:getAllCollectionGamesMap', () => collectionOps.getAllCollectionGamesMap())

  // ===== Save Snapshots =====
  ipcMain.handle('snap:getByGame', (_, gameId: string) => snapshotOps.getByGameId(gameId))
  ipcMain.handle('snap:delete', (_, id: string) => snapshotOps.delete(id))
  ipcMain.handle('snap:backup', async (_e, gameId: string) => {
    const game = gameOps.getById(gameId)
    if (!game || !game.save_path) throw new Error('未设置存档路径')
    return backupSave(gameId, game.save_path)
  })
  ipcMain.handle('snap:restoreInPlace', async (_e, snapshotId: string) => {
    return restoreSave(snapshotId)
  })
  ipcMain.handle('snap:getBackupDir', async (_e, gameId: string) => {
    return getSnapshotDirPath(gameId)
  })
  ipcMain.handle('snap:autoMatchSaveDir', async (_e, executablePath: string) => {
    return autoMatchSaveDir(executablePath)
  })

  // ===== Import =====
  ipcMain.handle('import:pickFolder', (_e, options?) => pickFolderAndScan(options))
  ipcMain.handle('import:pickBatchFolder', (_e, options?) => pickBatchFolderAndScan(options))

  // ===== File Picker =====
  ipcMain.handle(
    'import:pickFile',
    async (_e, filters?: { name: string; extensions: string[] }[]) => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: filters ?? [{ name: 'Executable', extensions: ['exe'] }]
      })
      return result.canceled ? null : result.filePaths[0]
    }
  )

  ipcMain.handle('import:pickDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('shell:openPath', async (_e, dirPath: string) => {
    return shell.openPath(dirPath)
  })

  // ===== Metadata Scraping =====
  ipcMain.handle('metadata:test', async (_e, { source, token }) => {
    return testApiConnection(source, token)
  })

  ipcMain.handle('metadata:search', async (_e, { query, source, apiKey }) => {
    try {
      return await searchMetadata(query, source, apiKey)
    } catch (err: unknown) {
      throw new Error((err instanceof Error ? err.message : String(err)) || '搜索失败')
    }
  })

  ipcMain.handle('metadata:fetch-detail', async (_e, { sourceId, source, apiKey }) => {
    try {
      return await fetchMetadataDetail(sourceId, source, apiKey)
    } catch (err: unknown) {
      throw new Error((err instanceof Error ? err.message : String(err)) || '获取元数据失败')
    }
  })

  // ===== Cover Download =====
  ipcMain.handle('cover:download', async (_e, { gameId, url }) => {
    return downloadCover(gameId, url)
  })

  // ===== External Links =====
  ipcMain.handle('shell:openExternal', async (_e, url: string) => {
    return shell.openExternal(url)
  })

  // ===== Updates =====
  ipcMain.handle('update:check', async () => checkForUpdates(true))
  ipcMain.handle('update:download', async () => downloadUpdate())
  ipcMain.handle('update:cancelDownload', async () => cancelDownload())
  ipcMain.handle('update:install', async () => quitAndInstall())

  // ===== App Info =====
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // ===== Window Controls =====
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  // ===== Tray / Quit =====
  ipcMain.handle('app:minimizeToTray', () => {
    mainWindow?.hide()
  })

  ipcMain.handle('app:requestQuit', () => {
    const activeSessionsData = sessionOps.getActiveSessions()
    if (activeSessionsData.length === 0) {
      return { hasActiveGames: false, games: [] }
    }
    const games = activeSessionsData.map((s) => {
      const game = gameOps.getById(s.game_id)
      return {
        gameId: s.game_id,
        title: game?.title || '未知游戏',
        startTime: s.start_time
      }
    })
    return { hasActiveGames: true, games }
  })

  ipcMain.handle('app:confirmQuit', async () => {
    isQuitting = true
    await endAllActiveSessions()
    await killMagpieIfLaunched()
    closeDatabase()
    app.quit()
  })

  ipcMain.handle('app:cancelQuit', () => {})
}

import type { AppConfig } from '../shared/types'
import type { LaunchMode } from '../shared/types'
import { pickFolderAndScan, pickBatchFolderAndScan } from './services/importer'
import { testApiConnection, searchMetadata, fetchMetadataDetail } from './services/metadata-scraper'
import { downloadCover, resolveCoverPath } from './services/cover-downloader'
import { getSnapshotDir } from './config/paths'
import { launchGame, stopGame, isGameRunning, endAllActiveSessions, killMagpieIfLaunched } from './services/game-launcher'
import { backupSave, restoreSave, getSnapshotDirPath, autoMatchSaveDir } from './services/backup'
import {
  setupUpdater,
  checkForUpdates,
  downloadUpdate,
  cancelDownload,
  quitAndInstall
} from './services/updater'

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      if (!win.isVisible()) win.show()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron')

    // 注册 cover:// 自定义协议，用于在渲染进程加载本地封面图片
    protocol.handle('cover', (request) => {
      const filePath = resolveCoverPath(request.url)
      try {
        const mimeType = filePath.endsWith('.png')
          ? 'image/png'
          : filePath.endsWith('.webp')
            ? 'image/webp'
            : filePath.endsWith('.gif')
              ? 'image/gif'
              : 'image/jpeg'
        return new Response(createReadStream(filePath) as unknown as ReadableStream, {
          headers: { 'content-type': mimeType }
        })
      } catch {
        return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`)
      }
    })

    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
    initDatabase()
    setupIpcHandlers()
    setupUpdater()
    app.setLoginItemSettings({ openAtLogin: getConfig('autoStart') })
    createWindow()
    if (mainWindow) {
      createTray(mainWindow)
    }
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !getConfig('minimizeToTray')) {
      closeDatabase()
    }
  })

  app.on('before-quit', () => {
    closeDatabase()
    if (tray) {
      tray.destroy()
      tray = null
    }
  })
}
