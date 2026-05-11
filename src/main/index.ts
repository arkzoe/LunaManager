import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, closeDatabase, gameOperations, playSessionOperations } from './db/database'
import { getConfig, setConfig, getAllConfig, setAllConfig } from './config/store'

function createWindow(): void {
  // 获取保存的窗口大小
  const windowBounds = getConfig('windowBounds')
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 保存窗口大小
  mainWindow.on('resize', () => {
    const bounds = mainWindow.getBounds()
    setConfig('windowBounds', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    })
  })

  mainWindow.on('move', () => {
    const bounds = mainWindow.getBounds()
    setConfig('windowBounds', {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 设置 IPC 处理器
function setupIpcHandlers(): void {
  // 数据库操作
  ipcMain.handle('db:getGames', () => {
    return gameOperations.getAll()
  })

  ipcMain.handle('db:getGameById', (_, id: string) => {
    return gameOperations.getById(id) || null
  })

  ipcMain.handle('db:createGame', (_, game) => {
    return gameOperations.create(game)
  })

  ipcMain.handle('db:updateGame', (_, id: string, updates) => {
    gameOperations.update(id, updates)
  })

  ipcMain.handle('db:deleteGame', (_, id: string) => {
    gameOperations.delete(id)
  })

  ipcMain.handle('db:searchGames', (_, query: string) => {
    return gameOperations.search(query)
  })

  // 配置操作
  ipcMain.handle('config:get', <K extends keyof AppConfig>(_event: Electron.IpcMainInvokeEvent, key: K) => {
    return getConfig(key)
  })

  ipcMain.handle('config:set', <K extends keyof AppConfig>(_event: Electron.IpcMainInvokeEvent, key: K, value: AppConfig[K]) => {
    setConfig(key, value)
  })

  ipcMain.handle('config:getAll', () => {
    return getAllConfig()
  })

  ipcMain.handle('config:setAll', (_, config) => {
    setAllConfig(config)
  })

  // 游玩记录
  ipcMain.handle('play:startSession', (_, gameId: string) => {
    return playSessionOperations.start(gameId)
  })

  ipcMain.handle('play:endSession', (_, sessionId: string) => {
    playSessionOperations.end(sessionId)
  })

  ipcMain.handle('play:getTotalPlaytime', (_, gameId: string) => {
    return playSessionOperations.getTotalPlaytime(gameId)
  })
}

// 类型导入
import type { AppConfig } from './config/store'

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化数据库
  initDatabase()
  
  // 设置 IPC 处理器
  setupIpcHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for the application and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 关闭数据库连接
    closeDatabase()
    app.quit()
  }
})

app.on('before-quit', () => {
  // 确保在退出前关闭数据库
  closeDatabase()
})
