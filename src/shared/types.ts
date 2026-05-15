export interface GameRecord {
  id: string
  title: string
  title_cn: string
  cover: string
  rating: number
  size: string
  installed: number
  favorite: number
  status: GameStatus
  personal_rating: number
  last_played: string
  description: string
  developer: string
  publisher: string
  release_date: string
  playtime: string
  executable_path: string
  save_path: string
  vndb_id: string
  bangumi_id: string
  notes: string
  custom_tags: string
  last_launch_method: LaunchMode
  created_at: number
  updated_at: number
}

export interface PlaySession {
  id: string
  game_id: string
  start_time: number
  end_time: number
  duration: number
}

export interface Collection {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: number
}

export interface GameCollection {
  game_id: string
  collection_id: string
}

export interface ScanOptions {
  maxDepth?: number
  skipSize?: boolean
}

export interface ScanResult {
  folderPath: string
  folderName: string
  executables: { name: string; fullPath: string }[]
  totalSize: string
}

export interface BatchScanResult {
  items: ScanResult[]
}

export type RowMatchStatus = 'idle' | 'searching' | 'matched' | 'noresult'
export type RowImportStatus = 'idle' | 'importing' | 'success' | 'failed' | 'skipped'

export interface ImportRowState extends ScanResult {
  selected: boolean
  title: string
  selectedExe: string
  isDuplicate: boolean
  vndbId: string
  bangumiId: string
  cover: string
  rating: number
  developer: string
  publisher: string
  releaseDate: string
  description: string
  customTags: string
  savePath: string
  matchStatus?: RowMatchStatus
  importStatus?: RowImportStatus
  importMessage?: string
}

export interface ImportResultItem {
  title: string
  id: string
  status: 'success' | 'skipped' | 'failed'
  reason?: string
}

export interface ImportResult {
  items: ImportResultItem[]
  successCount: number
  skippedCount: number
  failedCount: number
  totalDuration: number
}

export interface SaveSnapshot {
  id: string
  game_id: string
  snapshot_path: string
  file_size: number
  notes: string
  created_at: number
}

export interface SearchResult {
  id: string
  title: string
  titleCn: string
  cover: string
  date: string
  rating: number
  source: 'vndb' | 'bangumi'
}

export interface ApiError {
  code:
    | 'NETWORK'
    | 'TIMEOUT'
    | 'AUTH_FAILED'
    | 'RATE_LIMITED'
    | 'NOT_FOUND'
    | 'SERVER_ERROR'
    | 'PARSE_ERROR'
  message: string
}

export type GameStatus = 'want' | 'playing' | 'played' | 'shelved' | 'abandoned'
export type LaunchMode = 'normal' | 'le' | 'magpie'
export type ViewMode = 'grid' | 'list'
export type TimeRange = 'week' | 'month' | 'year' | 'all'
export type Theme = 'light' | 'dark'

export interface AppConfig {
  windowBounds: { width: number; height: number; x?: number; y?: number }
  autoStart: boolean
  autoUpdate: boolean
  downloadPath: string
  metadataSource: 'vndb' | 'bangumi'
  autoSyncMetadata: boolean
  theme: Theme
  language: 'zh-CN' | 'en-US'
  sidebarCollapsed: boolean
  showGameCover: boolean
  trackPlaytime: boolean
  recordHistory: boolean
  dbPath: string
  lePath: string
  magpiePath: string
  magpieScale: string
  bangumiToken: string
  vndbApiKey: string
  backupDir: string
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  backupMaxCopies: number
}

export interface IElectronAPI {
  getGames: () => Promise<GameRecord[]>
  getGameById: (id: string) => Promise<GameRecord | null>
  createGame: (game: Omit<GameRecord, 'created_at' | 'updated_at'>) => Promise<GameRecord>
  updateGame: (id: string, updates: Partial<GameRecord>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  searchGames: (query: string) => Promise<GameRecord[]>
  getGamesByStatus: (status: GameStatus) => Promise<GameRecord[]>

  getConfig: <K extends keyof AppConfig>(key: K) => Promise<AppConfig[K]>
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  getAllConfig: () => Promise<AppConfig>
  setAllConfig: (config: Partial<AppConfig>) => Promise<void>

  startPlaySession: (gameId: string) => Promise<PlaySession>
  endPlaySession: (sessionId: string) => Promise<void>
  getGamePlaytime: (gameId: string) => Promise<number>
  getSessionsByGame: (gameId: string) => Promise<PlaySession[]>
  getAllSessions: () => Promise<PlaySession[]>
  getRecentSessions: (limit?: number) => Promise<PlaySession[]>
  getAggregatedStats: (
    gameId: string
  ) => Promise<{ total_sessions: number; total_duration: number; last_played: number | null }>
  getAllAggregatedStats: () => Promise<
    {
      game_id: string
      total_sessions: number
      total_duration: number
      last_played: number | null
    }[]
  >
  getTotalSessionCount: () => Promise<number>
  launchGame: (gameId: string, mode: LaunchMode) => Promise<void>
  stopGame: (gameId: string) => Promise<void>
  isGameRunning: (gameId: string) => Promise<boolean>

  getCollections: () => Promise<Collection[]>
  createCollection: (name: string) => Promise<Collection>
  renameCollection: (id: string, name: string) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  addGameToCollection: (gameId: string, collectionId: string) => Promise<void>
  removeGameFromCollection: (gameId: string, collectionId: string) => Promise<void>
  getCollectionGames: (collectionId: string) => Promise<GameRecord[]>
  reorderCollections: (ids: string[]) => Promise<void>

  getSnapshots: (gameId: string) => Promise<SaveSnapshot[]>
  createSnapshot: (gameId: string, notes?: string) => Promise<SaveSnapshot>
  deleteSnapshot: (id: string) => Promise<void>
  restoreSnapshot: (id: string) => Promise<void>
  detectSavePath: (gameId: string) => Promise<string | null>
  backupSnapshot: (gameId: string) => Promise<string>
  restoreSnapshotInPlace: (snapshotId: string) => Promise<void>
  getBackupDir: (gameId: string) => Promise<string>

  getGameByExecutablePath: (path: string) => Promise<GameRecord | null>

  pickImportFolder: (options?: ScanOptions) => Promise<ScanResult | null>
  pickBatchImportFolder: (options?: ScanOptions) => Promise<BatchScanResult | null>

  pickFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  pickDirectory: () => Promise<string | null>
  openPath: (path: string) => Promise<string>

  // 元数据刮擦
  testApiConnection: (
    source: 'vndb' | 'bangumi',
    token?: string
  ) => Promise<{ ok: boolean; message: string }>
  searchMetadata: (
    query: string,
    source: 'vndb' | 'bangumi',
    apiKey?: string
  ) => Promise<SearchResult[]>
  fetchMetadataDetail: (
    sourceId: string,
    source: 'vndb' | 'bangumi',
    apiKey?: string,
    gameId?: string
  ) => Promise<Partial<GameRecord>>
  downloadCover: (gameId: string, url: string) => Promise<string | null>
}
