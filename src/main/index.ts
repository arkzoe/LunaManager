import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  dialog,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join } from 'path'
import { existsSync, createReadStream } from 'fs'
import { rm } from 'fs/promises'
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
  sessionOps,
  collectionOps,
  snapshotOps
} from './database'
import { getRankings, getChartData } from './database/play-sessions'
import { getFilteredGames } from './database/games'
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
  win.destroy()
  mainWindow = null
}

function showFromTray(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
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
  // ===== Games =====
  ipcMain.handle('db:getGames', () => gameOps.getList())
  ipcMain.handle('db:getGameById', (_, id: string) => gameOps.getById(id) || null)
  ipcMain.handle('db:createGame', (_, game) => gameOps.create(game))
  ipcMain.handle('db:updateGame', (_, id: string, updates) => gameOps.update(id, updates))
  ipcMain.handle('db:deleteGame', async (_, id: string) => {
    const game = gameOps.getById(id)
    if (game) {
      if (game.cover && game.cover.startsWith('cover://')) {
        const coverPath = resolveCoverPath(game.cover)
        if (existsSync(coverPath)) await rm(coverPath).catch(() => {})
      }
      const snapDir = getSnapshotDir(id)
      if (existsSync(snapDir)) await rm(snapDir, { recursive: true }).catch(() => {})
    }
    return gameOps.delete(id)
  })
  ipcMain.handle('db:searchGames', (_, q: string) => gameOps.search(q))

  // 服务端过滤排序
  ipcMain.handle('db:getFilteredGames', (_e, query: GameQuery): PaginatedResult<GameRecord> => {
    return getFilteredGames(query)
  })

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

  ipcMain.handle(
    'stats:getRankings',
    (_, params: { cutoff?: number; limit?: number }): RankingItem[] => {
      return getRankings(params.cutoff, params.limit ?? 10)
    }
  )

  ipcMain.handle(
    'stats:getChartData',
    (_, params: { gameId?: string; range: string }): ChartDataResult => {
      return getChartData(params.gameId, params.range)
    }
  )

  ipcMain.handle('stats:getHomeData', (): HomeData => {
    const allGames = gameOps.getList()
    const total = allGames.length
    const totalDuration = (
      sessionOps.getAllAggregatedStats() as { total_duration: number }[]
    ).reduce((sum, s) => sum + s.total_duration, 0)
    const totalHours = Math.floor(totalDuration / 3600000) || 0
    const completedGames = allGames.filter((g: GameRecord) => g.status === 'played').length
    const avgPerDay = total > 0 ? Math.round((totalHours / Math.max(total, 1)) * 10) / 10 : 0

    const withPlayed = allGames.filter((g: GameRecord) => g.last_played)
    const recentGames = [...withPlayed]
      .sort((a: GameRecord, b: GameRecord) =>
        (b.last_played || '').localeCompare(a.last_played || '')
      )
      .slice(0, 10)
    const recentAdded = [...allGames]
      .sort((a: GameRecord, b: GameRecord) => (b.created_at || 0) - (a.created_at || 0))
      .slice(0, 10)

    return { totalGames: total, totalHours, completedGames, avgPerDay, recentGames, recentAdded }
  })

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
  ipcMain.handle('import:getDirSizes', (_e, dirPaths: string[]) => getDirectorySizes(dirPaths))

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

  ipcMain.handle(
    'metadata:search',
    async (
      _e,
      {
        query,
        source,
        apiKey,
        pickBest,
        threshold,
        bangumiToken
      }: {
        query: string
        source: string
        apiKey?: string
        pickBest?: boolean
        threshold?: number
        bangumiToken?: string
      }
    ): Promise<SearchResponse> => {
      try {
        let allResults: SearchResult[] = []
        let warning: string | undefined

        if (source === 'mixed') {
          const tasks: Promise<SearchResult[]>[] = []
          const sourceNames: string[] = []
          if (apiKey) {
            tasks.push(searchMetadata(query, 'vndb', apiKey))
            sourceNames.push('VNDB')
          }
          if (bangumiToken) {
            tasks.push(searchMetadata(query, 'bangumi', bangumiToken))
            sourceNames.push('Bangumi')
          }
          if (tasks.length === 0) {
            throw new Error('请先在「设置 → 数据源」中配置至少一个数据源的 Token')
          }
          const settled = await Promise.allSettled(tasks)
          const failedSources: string[] = []
          settled.forEach((r, i) => {
            if (r.status === 'fulfilled') {
              allResults.push(...r.value)
            } else {
              failedSources.push(sourceNames[i])
            }
          })
          if (failedSources.length > 0 && failedSources.length < sourceNames.length) {
            warning = `${failedSources.join('、')} 搜索失败，已使用其他源的结果`
          }
        } else {
          allResults = await searchMetadata(query, source as 'vndb' | 'bangumi', apiKey)
        }

        let bestMatchId: string | undefined
        if (pickBest && allResults.length > 0) {
          const best = pickBestMatch(query, allResults, threshold)
          if (best) bestMatchId = best.id
        }

        return { results: allResults, bestMatchId, warning }
      } catch (err: unknown) {
        throw new Error((err instanceof Error ? err.message : String(err)) || '搜索失败')
      }
    }
  )

  ipcMain.handle('metadata:fetch-detail', async (_e, { sourceId, source, apiKey }) => {
    try {
      return await fetchMetadataDetail(sourceId, source, apiKey)
    } catch (err: unknown) {
      throw new Error((err instanceof Error ? err.message : String(err)) || '获取元数据失败')
    }
  })

  // 批量匹配（单次 IPC 完成搜索 + 模糊匹配 + 详情获取）
  ipcMain.handle(
    'metadata:batchMatch',
    async (_e, request: BatchMatchRequest): Promise<MatchedRow[]> => {
      return batchMatch(request)
    }
  )

  // ===== Cover Download =====
  ipcMain.handle('cover:download', async (_e, { gameId, url }) => {
    return downloadCover(gameId, url)
  })

  // ===== External Links =====
  ipcMain.handle('shell:openExternal', async (_e, url: string) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return
      await shell.openExternal(url)
    } catch {
      /* invalid URL, silently ignore */
    }
  })

  // ===== Updates =====
  ipcMain.handle('update:check', async () => checkForUpdates(true))
  ipcMain.handle('update:download', async () => downloadUpdate())
  ipcMain.handle('update:cancelDownload', async () => cancelDownload())
  ipcMain.handle('update:install', async () => {
    await endAllActiveSessions()
    await killMagpieIfLaunched()
    quitAndInstall()
  })

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

import type { AppConfig } from '../shared/types'
import type { LaunchMode } from '../shared/types'
import type {
  RankingItem,
  ChartDataResult,
  HomeData,
  GameRecord,
  SearchResult,
  SearchResponse,
  BatchMatchRequest,
  MatchedRow,
  GameQuery,
  PaginatedResult
} from '../shared/types'
import { pickFolderAndScan, pickBatchFolderAndScan, getDirectorySizes } from './services/importer'
import {
  testApiConnection,
  searchMetadata,
  pickBestMatch,
  fetchMetadataDetail,
  batchMatch
} from './services/metadata-scraper'
import { downloadCover, resolveCoverPath } from './services/cover-downloader'
import { getSnapshotDir } from './config/paths'
import {
  launchGame,
  stopGame,
  isGameRunning,
  endAllActiveSessions,
  killMagpieIfLaunched
} from './services/game-launcher'
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
