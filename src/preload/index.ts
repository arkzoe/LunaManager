import { contextBridge, ipcRenderer } from 'electron'
import type { IElectronAPI } from '../shared/types'

const api: IElectronAPI = {
  getGames: () => ipcRenderer.invoke('db:getGames'),
  getGameById: (id) => ipcRenderer.invoke('db:getGameById', id),
  createGame: (game) => ipcRenderer.invoke('db:createGame', game),
  updateGame: (id, updates) => ipcRenderer.invoke('db:updateGame', id, updates),
  deleteGame: (id) => ipcRenderer.invoke('db:deleteGame', id),
  searchGames: (query) => ipcRenderer.invoke('db:searchGames', query),
  getGamesByCategory: (cat) => ipcRenderer.invoke('db:getGamesByCategory', cat),
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

  getCollections: () => ipcRenderer.invoke('col:getAll'),
  createCollection: (name) => ipcRenderer.invoke('col:create', name),
  renameCollection: (id, name) => ipcRenderer.invoke('col:rename', id, name),
  deleteCollection: (id) => ipcRenderer.invoke('col:delete', id),
  addGameToCollection: (gameId, colId) => ipcRenderer.invoke('col:addGame', gameId, colId),
  removeGameFromCollection: (gameId, colId) => ipcRenderer.invoke('col:removeGame', gameId, colId),
  getCollectionGames: (colId) => ipcRenderer.invoke('col:getGameIds', colId),
  reorderCollections: (ids) => ipcRenderer.invoke('col:reorder', ids),

  getSnapshots: (gameId) => ipcRenderer.invoke('snap:getByGame', gameId),
  createSnapshot: (gameId, notes) => ipcRenderer.invoke('snap:create', gameId, notes),
  deleteSnapshot: (id) => ipcRenderer.invoke('snap:delete', id),
  restoreSnapshot: () => Promise.reject(new Error('Not implemented')),
  detectSavePath: () => Promise.resolve(null)
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
