import { app, shell, BrowserWindow, ipcMain, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase, gameOps, sessionOps, collectionOps, snapshotOps } from './database'
import { getConfig, setConfig, getAllConfig, setAllConfig } from './config/store'

function createWindow(): void {
  const bounds = getConfig('windowBounds')
  const mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.on('resize', () => {
    const b = mainWindow.getBounds()
    setConfig('windowBounds', { width: b.width, height: b.height, x: b.x, y: b.y })
  })
  mainWindow.on('move', () => {
    const b = mainWindow.getBounds()
    setConfig('windowBounds', { width: b.width, height: b.height, x: b.x, y: b.y })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function setupIpcHandlers(): void {
  // ===== Games =====
  ipcMain.handle('db:getGames', () => gameOps.getAll())
  ipcMain.handle('db:getGameById', (_, id: string) => gameOps.getById(id) || null)
  ipcMain.handle('db:createGame', (_, game) => gameOps.create(game))
  ipcMain.handle('db:updateGame', (_, id: string, updates) => gameOps.update(id, updates))
  ipcMain.handle('db:deleteGame', (_, id: string) => gameOps.delete(id))
  ipcMain.handle('db:searchGames', (_, q: string) => gameOps.search(q))
  ipcMain.handle('db:getGamesByStatus', (_, status: string) => gameOps.getByStatus(status as GameStatus))
  ipcMain.handle('db:getGameByExecutablePath', (_, path: string) => gameOps.getByExecutablePath(path) || null)

  // ===== Config =====
  ipcMain.handle('config:get', <K extends keyof AppConfig>(_e: Electron.IpcMainInvokeEvent, key: K) => getConfig(key))
  ipcMain.handle('config:set', <K extends keyof AppConfig>(_e: Electron.IpcMainInvokeEvent, key: K, value: AppConfig[K]) => setConfig(key, value))
  ipcMain.handle('config:getAll', () => getAllConfig())
  ipcMain.handle('config:setAll', (_, config) => setAllConfig(config))

  // ===== Play Sessions =====
  ipcMain.handle('play:startSession', (_, gameId: string) => sessionOps.start(gameId))
  ipcMain.handle('play:endSession', (_, sessionId: string) => sessionOps.end(sessionId))
  ipcMain.handle('play:getTotalPlaytime', (_, gameId: string) => sessionOps.getTotalPlaytime(gameId))
  ipcMain.handle('play:getSessionsByGame', (_, gameId: string) => sessionOps.getByGameId(gameId))
  ipcMain.handle('play:getRecentSessions', (_, limit?: number) => sessionOps.getRecent(limit))
  ipcMain.handle('play:getAggregatedStats', (_, gameId: string) => sessionOps.getAggregatedStats(gameId))
  ipcMain.handle('play:getTotalSessionCount', () => sessionOps.getTotalCount())
  ipcMain.handle('play:getAllAggregatedStats', () => sessionOps.getAllAggregatedStats())

  // ===== Game Launch =====
  ipcMain.handle('launch:game', (_, gameId: string, mode: string) => {
    launchGame(gameId, mode as LaunchMode)
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
  ipcMain.handle('col:addGame', (_, gameId: string, colId: string) => collectionOps.addGame(gameId, colId))
  ipcMain.handle('col:removeGame', (_, gameId: string, colId: string) => collectionOps.removeGame(gameId, colId))
  ipcMain.handle('col:getCollectionGames', (_, colId: string) => collectionOps.getCollectionGames(colId))
  ipcMain.handle('col:reorder', (_, ids: string[]) => collectionOps.reorder(ids))

  // ===== Save Snapshots =====
  ipcMain.handle('snap:getByGame', (_, gameId: string) => snapshotOps.getByGameId(gameId))
  ipcMain.handle('snap:create', (_, gameId: string, notes?: string) => snapshotOps.create(gameId, notes))
  ipcMain.handle('snap:delete', (_, id: string) => snapshotOps.delete(id))
  ipcMain.handle('snap:restore', (_, _id: string) => {
    throw new Error('Not implemented')
  })
  ipcMain.handle('snap:detectSavePath', (_, _gameId: string) => null)
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

  // ===== Import =====
  ipcMain.handle('import:pickFolder', () => pickFolderAndScan())
  ipcMain.handle('import:pickBatchFolder', () => pickBatchFolderAndScan())

  // ===== File Picker =====
  ipcMain.handle('import:pickFile', async (_e, filters?: { name: string; extensions: string[] }[]) => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters ?? [{ name: 'Executable', extensions: ['exe'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('import:pickDirectory', async () => {
    const { dialog } = await import('electron')
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
    } catch (err: any) {
      throw new Error(err.message || '搜索失败')
    }
  })

  ipcMain.handle('metadata:fetch-detail', async (_e, { sourceId, source, apiKey, gameId }) => {
    try {
      return await fetchMetadataDetail(sourceId, source, apiKey, gameId)
    } catch (err: any) {
      throw new Error(err.message || '获取元数据失败')
    }
  })

  // ===== Cover Download =====
  ipcMain.handle('cover:download', async (_e, { gameId, url }) => {
    return downloadCover(gameId, url)
  })
}

import type { AppConfig } from './config/store'
import type { GameStatus, LaunchMode } from '../shared/types'
import { pickFolderAndScan, pickBatchFolderAndScan } from './services/importer'
import { testApiConnection, searchMetadata, fetchMetadataDetail } from './services/metadata-scraper'
import { downloadCover, resolveCoverPath } from './services/cover-downloader'
import { launchGame, stopGame, isGameRunning } from './services/game-launcher'
import { backupSave, restoreSave, deleteSnapshotFiles, getSnapshotDirPath } from './services/backup'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // 注册 cover:// 自定义协议，用于在渲染进程加载本地封面图片
  protocol.handle('cover', (request) => {
    const filePath = resolveCoverPath(request.url)
    const normalizedPath = filePath.replace(/\\/g, '/')
    return net.fetch(`file:///${normalizedPath}`)
  })

  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  initDatabase()
  setupIpcHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') { closeDatabase(); app.quit() }
})

app.on('before-quit', () => closeDatabase())
