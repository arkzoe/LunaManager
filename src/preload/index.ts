import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from '../shared/types'

const api: IElectronAPI = {
  getGames: () => ipcRenderer.invoke('db:getGames'),
  getGameById: (id) => ipcRenderer.invoke('db:getGameById', id),
  createGame: (game) => ipcRenderer.invoke('db:createGame', game),
  updateGame: (id, updates) => ipcRenderer.invoke('db:updateGame', id, updates),
  deleteGame: (id) => ipcRenderer.invoke('db:deleteGame', id),
  searchGames: (query) => ipcRenderer.invoke('db:searchGames', query),

  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),
  getAllConfig: () => ipcRenderer.invoke('config:getAll'),
  setAllConfig: (config) => ipcRenderer.invoke('config:setAll', config),

  startPlaySession: (gameId) => ipcRenderer.invoke('play:startSession', gameId),
  endPlaySession: (sessionId) => ipcRenderer.invoke('play:endSession', sessionId),
  getGamePlaytime: (gameId) => ipcRenderer.invoke('play:getTotalPlaytime', gameId),
  getSessionsByGame: (gameId) => ipcRenderer.invoke('play:getSessionsByGame', gameId),
  getAllSessions: () => ipcRenderer.invoke('play:getAllSessions'),
  getAggregatedStats: (gameId) => ipcRenderer.invoke('play:getAggregatedStats', gameId),
  getAllAggregatedStats: () => ipcRenderer.invoke('play:getAllAggregatedStats'),
  launchGame: (gameId, modes) => ipcRenderer.invoke('launch:game', gameId, modes),
  stopGame: (gameId) => ipcRenderer.invoke('launch:stop', gameId),
  isGameRunning: (gameId) => ipcRenderer.invoke('launch:isRunning', gameId),

  getCollections: () => ipcRenderer.invoke('col:getAll'),
  createCollection: (name) => ipcRenderer.invoke('col:create', name),
  renameCollection: (id, name) => ipcRenderer.invoke('col:rename', id, name),
  deleteCollection: (id) => ipcRenderer.invoke('col:delete', id),
  addGameToCollection: (gameId, colId) => ipcRenderer.invoke('col:addGame', gameId, colId),
  removeGameFromCollection: (gameId, colId) => ipcRenderer.invoke('col:removeGame', gameId, colId),
  getCollectionGames: (colId) => ipcRenderer.invoke('col:getCollectionGames', colId),
  getAllCollectionGamesMap: () => ipcRenderer.invoke('col:getAllCollectionGamesMap'),

  getSnapshots: (gameId) => ipcRenderer.invoke('snap:getByGame', gameId),
  deleteSnapshot: (id) => ipcRenderer.invoke('snap:delete', id),
  backupSnapshot: (gameId) => ipcRenderer.invoke('snap:backup', gameId),
  restoreSnapshotInPlace: (snapshotId) => ipcRenderer.invoke('snap:restoreInPlace', snapshotId),
  getBackupDir: (gameId) => ipcRenderer.invoke('snap:getBackupDir', gameId),
  autoMatchSaveDir: (executablePath) => ipcRenderer.invoke('snap:autoMatchSaveDir', executablePath),

  pickImportFolder: (options?) => ipcRenderer.invoke('import:pickFolder', options),
  getDirSizes: (dirPaths) => ipcRenderer.invoke('import:getDirSizes', dirPaths),
  pickBatchImportFolder: (options?) => ipcRenderer.invoke('import:pickBatchFolder', options),

  pickFile: (filters) => ipcRenderer.invoke('import:pickFile', filters),

  pickDirectory: () => ipcRenderer.invoke('import:pickDirectory'),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),

  testApiConnection: (source, token?) => ipcRenderer.invoke('metadata:test', { source, token }),
  searchMetadata: (query, source, apiKey?) =>
    ipcRenderer.invoke('metadata:search', { query, source, apiKey }),
  fetchMetadataDetail: (sourceId, source, apiKey?, gameId?) =>
    ipcRenderer.invoke('metadata:fetch-detail', { sourceId, source, apiKey, gameId }),
  downloadCover: (gameId, url) => ipcRenderer.invoke('cover:download', { gameId, url }),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  cancelDownload: () => ipcRenderer.invoke('update:cancelDownload'),
  quitAndInstall: () => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (callback) => {
    const handler = (_e, status, data) => callback(status, data)
    ipcRenderer.on('update:status', handler)
    return () => ipcRenderer.removeListener('update:status', handler)
  },
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback) => {
    const handler = (_e, maximized) => callback(maximized)
    ipcRenderer.on('window:maximize-change', handler)
    return () => ipcRenderer.removeListener('window:maximize-change', handler)
  },
  onGameUpdated: (callback) => {
    const handler = (_e, game) => callback(game)
    ipcRenderer.on('game:updated', handler)
    return () => ipcRenderer.removeListener('game:updated', handler)
  },
  onGameRunningStarted: (callback) => {
    const handler = (_e, gameId) => callback(gameId)
    ipcRenderer.on('game:running-started', handler)
    return () => ipcRenderer.removeListener('game:running-started', handler)
  },

  requestQuit: () => ipcRenderer.invoke('app:requestQuit'),
  confirmQuit: () => ipcRenderer.invoke('app:confirmQuit'),
  cancelQuit: () => ipcRenderer.invoke('app:cancelQuit'),
  minimizeToTray: () => ipcRenderer.invoke('app:minimizeToTray'),
  onQuitDialog: (callback) => {
    ipcRenderer.on('app:show-quit-dialog', (_e, games) => callback(games))
  },
  onRequestQuitFlow: (callback) => {
    ipcRenderer.on('app:request-quit-flow', () => callback())
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as any).api = api
}
