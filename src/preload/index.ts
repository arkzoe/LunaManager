import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from '../shared/types'

const api: IElectronAPI = {
  getGames: () => ipcRenderer.invoke('db:getGames'),
  getGameById: (id) => ipcRenderer.invoke('db:getGameById', id),
  createGame: (game) => ipcRenderer.invoke('db:createGame', game),
  updateGame: (id, updates) => ipcRenderer.invoke('db:updateGame', id, updates),
  deleteGame: (id) => ipcRenderer.invoke('db:deleteGame', id),
  searchGames: (query) => ipcRenderer.invoke('db:searchGames', query),
  getGamesByStatus: (status) => ipcRenderer.invoke('db:getGamesByStatus', status),

  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),
  getAllConfig: () => ipcRenderer.invoke('config:getAll'),
  setAllConfig: (config) => ipcRenderer.invoke('config:setAll', config),

  startPlaySession: (gameId) => ipcRenderer.invoke('play:startSession', gameId),
  endPlaySession: (sessionId) => ipcRenderer.invoke('play:endSession', sessionId),
  getGamePlaytime: (gameId) => ipcRenderer.invoke('play:getTotalPlaytime', gameId),
  getSessionsByGame: (gameId) => ipcRenderer.invoke('play:getSessionsByGame', gameId),
  getRecentSessions: (limit) => ipcRenderer.invoke('play:getRecentSessions', limit),
  getAggregatedStats: (gameId) => ipcRenderer.invoke('play:getAggregatedStats', gameId),
  getTotalSessionCount: () => ipcRenderer.invoke('play:getTotalSessionCount'),
  getAllAggregatedStats: () => ipcRenderer.invoke('play:getAllAggregatedStats'),
  launchGame: (gameId, mode) => ipcRenderer.invoke('launch:game', gameId, mode),
  stopGame: (gameId) => ipcRenderer.invoke('launch:stop', gameId),
  isGameRunning: (gameId) => ipcRenderer.invoke('launch:isRunning', gameId),

  getCollections: () => ipcRenderer.invoke('col:getAll'),
  createCollection: (name) => ipcRenderer.invoke('col:create', name),
  renameCollection: (id, name) => ipcRenderer.invoke('col:rename', id, name),
  deleteCollection: (id) => ipcRenderer.invoke('col:delete', id),
  addGameToCollection: (gameId, colId) => ipcRenderer.invoke('col:addGame', gameId, colId),
  removeGameFromCollection: (gameId, colId) => ipcRenderer.invoke('col:removeGame', gameId, colId),
  getCollectionGames: (colId) => ipcRenderer.invoke('col:getCollectionGames', colId),
  reorderCollections: (ids) => ipcRenderer.invoke('col:reorder', ids),

  getSnapshots: (gameId) => ipcRenderer.invoke('snap:getByGame', gameId),
  createSnapshot: (gameId, notes) => ipcRenderer.invoke('snap:create', gameId, notes),
  deleteSnapshot: (id) => ipcRenderer.invoke('snap:delete', id),
  restoreSnapshot: (id) => ipcRenderer.invoke('snap:restore', id),
  detectSavePath: (gameId) => ipcRenderer.invoke('snap:detectSavePath', gameId),
  backupSnapshot: (gameId) => ipcRenderer.invoke('snap:backup', gameId),
  restoreSnapshotInPlace: (snapshotId) => ipcRenderer.invoke('snap:restoreInPlace', snapshotId),
  getBackupDir: (gameId) => ipcRenderer.invoke('snap:getBackupDir', gameId),

  getGameByExecutablePath: (path) => ipcRenderer.invoke('db:getGameByExecutablePath', path),

  pickImportFolder: () => ipcRenderer.invoke('import:pickFolder'),
  pickBatchImportFolder: () => ipcRenderer.invoke('import:pickBatchFolder'),

  pickFile: (filters) => ipcRenderer.invoke('import:pickFile', filters),

  pickDirectory: () => ipcRenderer.invoke('import:pickDirectory'),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),

  testApiConnection: (source, token?) => ipcRenderer.invoke('metadata:test', { source, token }),
  searchMetadata: (query, source, apiKey?) => ipcRenderer.invoke('metadata:search', { query, source, apiKey }),
  fetchMetadataDetail: (sourceId, source, apiKey?, gameId?) => ipcRenderer.invoke('metadata:fetch-detail', { sourceId, source, apiKey, gameId }),
  downloadCover: (gameId, url) => ipcRenderer.invoke('cover:download', { gameId, url })
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
