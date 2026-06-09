import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join } from 'path'
import { createReadStream } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import iconPath from '../../resources/icon.png?asset'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debounceSetBounds(win: BrowserWindow): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (win.isDestroyed()) {
      debounceTimer = null
      return
    }
    const b = win.getBounds()
    setConfig('windowBounds', { width: b.width, height: b.height, x: b.x, y: b.y })
    debounceTimer = null
  }, 200)
}
import {
  initDatabase,
  closeDatabase,
  gameOps,
  sessionOps
} from './database'
import { getConfig, setConfig } from './config/store'

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
      hideToTray(mainWindow!)
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
    try {
      const url = new URL(details.url)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        shell.openExternal(details.url)
      }
    } catch {
      /* invalid URL */
    }
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow!.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow!.loadFile(join(__dirname, '../renderer/index.html'))
  }

  createTray()
}

function hideToTray(win: BrowserWindow): void {
  const bounds = win.getBounds()
  setConfig('windowBounds', {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y
  })
  win.hide()
}

function showFromTray(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
    return
  }
  createWindow()
}

function createTray(): void {
  if (tray) return
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  tray.setToolTip('LunaManager')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => showFromTray()
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => handleQuit()
    }
  ])
  tray.setContextMenu(contextMenu)

  tray.on('click', () => showFromTray())
}

async function handleQuit(): Promise<void> {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const result = await mainWindow.webContents.executeJavaScript(
        'window.api.requestQuit()',
        true
      )
      if (result.hasActiveGames) {
        mainWindow.webContents.send('app:show-quit-dialog', result.games)
      } else {
        await endAllActiveSessionsAndQuit()
      }
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
  registerIpcHandlers()

  // ===== Update: install (needs session cleanup first) =====
  ipcMain.handle('update:install', async () => {
    await endAllActiveSessions()
    await killMagpieIfLaunched()
    quitAndInstall()
  })

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

  // ===== App Info =====
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // ===== Tray / Quit =====
  ipcMain.handle('app:minimizeToTray', () => {
    if (mainWindow && !mainWindow.isDestroyed()) hideToTray(mainWindow)
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

import { registerIpcHandlers } from './ipc/handlers'
import { resolveCoverPath } from './services/cover-downloader'
import {
  endAllActiveSessions,
  killMagpieIfLaunched
} from './services/game-launcher'
import {
  setupUpdater,
  quitAndInstall
} from './services/updater'

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showFromTray()
  })

  app.commandLine.appendSwitch('disable-background-networking')

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
        const stream = createReadStream(filePath)
        stream.on('error', () => {})
        request.signal.addEventListener('abort', () => {
          stream.destroy()
        })
        return new Response(stream as unknown as ReadableStream, {
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
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) showFromTray()
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
