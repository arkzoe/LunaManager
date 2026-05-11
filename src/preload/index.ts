import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { GameRecord, PlaySession, AppConfig } from './index.d'

// Custom APIs for renderer
const api = {
  // 游戏数据操作
  getGames: (): Promise<GameRecord[]> => ipcRenderer.invoke('db:getGames'),
  getGameById: (id: string): Promise<GameRecord | null> => ipcRenderer.invoke('db:getGameById', id),
  createGame: (game: Omit<GameRecord, 'created_at' | 'updated_at'>): Promise<GameRecord> => 
    ipcRenderer.invoke('db:createGame', game),
  updateGame: (id: string, updates: Partial<GameRecord>): Promise<void> => 
    ipcRenderer.invoke('db:updateGame', id, updates),
  deleteGame: (id: string): Promise<void> => ipcRenderer.invoke('db:deleteGame', id),
  searchGames: (query: string): Promise<GameRecord[]> => ipcRenderer.invoke('db:searchGames', query),
  
  // 配置操作
  getConfig: <K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> => 
    ipcRenderer.invoke('config:get', key),
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]): Promise<void> => 
    ipcRenderer.invoke('config:set', key, value),
  getAllConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:getAll'),
  setAllConfig: (config: Partial<AppConfig>): Promise<void> => 
    ipcRenderer.invoke('config:setAll', config),
  
  // 游玩记录
  startPlaySession: (gameId: string): Promise<PlaySession> => 
    ipcRenderer.invoke('play:startSession', gameId),
  endPlaySession: (sessionId: string): Promise<void> => 
    ipcRenderer.invoke('play:endSession', sessionId),
  getGamePlaytime: (gameId: string): Promise<number> => 
    ipcRenderer.invoke('play:getTotalPlaytime', gameId)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
