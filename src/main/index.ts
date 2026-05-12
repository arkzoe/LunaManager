import { app, shell, BrowserWindow, ipcMain } from 'electron'
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
  ipcMain.handle('db:getGamesByCategory', (_, cat: string) => gameOps.getByCategory(cat))
  ipcMain.handle('db:getGamesByStatus', (_, status: string) => gameOps.getByStatus(status as any))

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

  // ===== Collections =====
  ipcMain.handle('col:getAll', () => collectionOps.getAll())
  ipcMain.handle('col:create', (_, name: string) => collectionOps.create(name))
  ipcMain.handle('col:rename', (_, id: string, name: string) => collectionOps.rename(id, name))
  ipcMain.handle('col:delete', (_, id: string) => collectionOps.delete(id))
  ipcMain.handle('col:addGame', (_, gameId: string, colId: string) => collectionOps.addGame(gameId, colId))
  ipcMain.handle('col:removeGame', (_, gameId: string, colId: string) => collectionOps.removeGame(gameId, colId))
  ipcMain.handle('col:getGameIds', (_, colId: string) => collectionOps.getGameIds(colId))
  ipcMain.handle('col:reorder', (_, ids: string[]) => collectionOps.reorder(ids))

  // ===== Save Snapshots =====
  ipcMain.handle('snap:getByGame', (_, gameId: string) => snapshotOps.getByGameId(gameId))
  ipcMain.handle('snap:create', (_, gameId: string, notes?: string) => snapshotOps.create(gameId, notes))
  ipcMain.handle('snap:delete', (_, id: string) => snapshotOps.delete(id))
}

import type { AppConfig } from './config/store'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
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
