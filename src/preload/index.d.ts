import { ElectronAPI } from '@electron-toolkit/preload'

export interface IElectronAPI {
  // 游戏数据操作
  getGames: () => Promise<GameRecord[]>
  getGameById: (id: string) => Promise<GameRecord | null>
  createGame: (game: Omit<GameRecord, 'created_at' | 'updated_at'>) => Promise<GameRecord>
  updateGame: (id: string, updates: Partial<GameRecord>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  searchGames: (query: string) => Promise<GameRecord[]>
  
  // 配置操作
  getConfig: <K extends keyof AppConfig>(key: K) => Promise<AppConfig[K]>
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  getAllConfig: () => Promise<AppConfig>
  setAllConfig: (config: Partial<AppConfig>) => Promise<void>
  
  // 游玩记录
  startPlaySession: (gameId: string) => Promise<PlaySession>
  endPlaySession: (sessionId: string) => Promise<void>
  getGamePlaytime: (gameId: string) => Promise<number>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IElectronAPI
  }
}

// 类型定义
export interface GameRecord {
  id: string
  title: string
  cover: string
  category: string
  rating: number
  size: string
  installed: number
  favorite: number
  last_played?: string
  description?: string
  developer?: string
  publisher?: string
  release_date?: string
  playtime?: string
  executable_path?: string
  save_path?: string
  created_at: number
  updated_at: number
}

export interface PlaySession {
  id: string
  game_id: string
  start_time: number
  end_time?: number
  duration?: number
}

export interface AppConfig {
  windowBounds: {
    width: number
    height: number
    x?: number
    y?: number
  }
  autoStart: boolean
  autoUpdate: boolean
  downloadPath: string
  metadataSource: 'steam' | 'igdb' | 'rawg'
  autoSyncMetadata: boolean
  theme: 'dark' | 'light'
  language: 'zh-CN' | 'en-US'
  sidebarCollapsed: boolean
  showGameCover: boolean
  trackPlaytime: boolean
  recordHistory: boolean
  dbPath: string
}
