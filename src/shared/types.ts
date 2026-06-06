export interface GameRecord {
  id: string
  title: string
  title_cn: string
  cover: string
  size: string
  favorite: number
  status: GameStatus
  personal_rating: number
  last_played: string | null
  description: string
  developer: string
  release_date: string
  playtime_seconds: number
  executable_path: string
  save_path: string
  vndb_id: string
  bangumi_id: string
  notes: string
  custom_tags: string
  last_launch_method: string
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
  sort_order: number
  created_at: number
  updated_at: number
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
  developer: string
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

export interface SearchResponse {
  results: SearchResult[]
  bestMatchId?: string
  warning?: string
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

// 统计排行（从 renderer/composables/useStats.ts 迁移至 shared）
export interface RankingItem {
  rank: number
  gameId: string
  title: string
  playtime: string
  cover: string
}

export interface ChartDataResult {
  labels: string[]
  values: number[]
}

export interface HomeData {
  totalGames: number
  totalHours: number
  completedGames: number
  avgPerDay: number
  monthlyHours: number
  recentGames: GameRecord[]
  recentAdded: GameRecord[]
}

// 服务端过滤排序
export interface GameQuery {
  status?: GameStatus | 'all'
  search?: string
  sortKey?: 'name' | 'playtime' | 'rating' | 'last_played'
  sortDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  hasMore: boolean
}

// 批量匹配
export interface BatchMatchRequest {
  rows: { query: string; title?: string; folderName?: string }[]
  source: string
  vndbToken?: string
  bangumiToken?: string
}

export interface MatchedRow {
  query: string
  title: string
  bangumiId?: string
  vndbId?: string
  cover?: string
  releaseDate?: string
  developer?: string
  description?: string
  customTags?: string
}

export interface AppConfig {
  windowBounds: { width: number; height: number; x?: number; y?: number }
  autoStart: boolean
  autoUpdate: boolean
  minimizeToTray: boolean
  metadataSource: 'vndb' | 'bangumi' | 'mixed'
  theme: Theme
  trackPlaytime: boolean
  recordHistory: boolean
  dbPath: string
  magpiePath: string
  magpieHotkey: 'fullscreen' | 'windowed'
  autoLaunchMagpie: boolean
  magpieDelay: number
  bangumiToken: string
  vndbApiKey: string
  backupDir: string
  lastUpdateCheckDate: string
}

export interface IElectronAPI {
  getGames: () => Promise<GameRecord[]>
  getGameById: (id: string) => Promise<GameRecord | null>
  createGame: (game: Omit<GameRecord, 'created_at' | 'updated_at'>) => Promise<GameRecord>
  updateGame: (id: string, updates: Partial<GameRecord>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  searchGames: (query: string) => Promise<GameRecord[]>

  getConfig: <K extends keyof AppConfig>(key: K) => Promise<AppConfig[K]>
  setConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => Promise<void>
  getAllConfig: () => Promise<AppConfig>
  setAllConfig: (config: Partial<AppConfig>) => Promise<void>

  startPlaySession: (gameId: string) => Promise<PlaySession>
  endPlaySession: (sessionId: string) => Promise<void>
  getGamePlaytime: (gameId: string) => Promise<number>
  getSessionsByGame: (gameId: string) => Promise<PlaySession[]>
  getAllSessions: () => Promise<PlaySession[]>
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
  launchGame: (gameId: string, modes: LaunchMode[]) => Promise<void>
  stopGame: (gameId: string) => Promise<void>
  isGameRunning: (gameId: string) => Promise<boolean>

  getCollections: () => Promise<Collection[]>
  createCollection: (name: string) => Promise<Collection>
  renameCollection: (id: string, name: string) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  addGameToCollection: (gameId: string, collectionId: string) => Promise<void>
  removeGameFromCollection: (gameId: string, collectionId: string) => Promise<void>
  getCollectionGames: (collectionId: string) => Promise<GameRecord[]>
  getAllCollectionGamesMap: () => Promise<Record<string, string[]>>

  getSnapshots: (gameId: string) => Promise<SaveSnapshot[]>
  deleteSnapshot: (id: string) => Promise<void>
  backupSnapshot: (gameId: string) => Promise<string>
  restoreSnapshotInPlace: (snapshotId: string) => Promise<void>
  getBackupDir: (gameId: string) => Promise<string>
  autoMatchSaveDir: (executablePath: string) => Promise<string[]>

  pickImportFolder: (options?: ScanOptions) => Promise<ScanResult | null>
  pickBatchImportFolder: (options?: ScanOptions) => Promise<BatchScanResult | null>
  getDirSizes: (dirPaths: string[]) => Promise<Record<string, string>>

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
    source: 'vndb' | 'bangumi' | 'mixed',
    apiKey?: string,
    options?: { pickBest?: boolean; threshold?: number; bangumiToken?: string }
  ) => Promise<SearchResponse>
  fetchMetadataDetail: (
    sourceId: string,
    source: 'vndb' | 'bangumi',
    apiKey?: string,
    gameId?: string
  ) => Promise<Partial<GameRecord>>
  downloadCover: (gameId: string, url: string) => Promise<string | null>
  openExternal: (url: string) => Promise<void>
  checkForUpdates: () => Promise<{
    updateAvailable: boolean
    version?: string
    releaseNotes?: string
    error?: string
  }>
  downloadUpdate: () => Promise<void>
  cancelDownload: () => Promise<void>
  quitAndInstall: () => Promise<void>
  onUpdateStatus: (callback: (status: string, data?: unknown) => void) => () => void
  getAppVersion: () => Promise<string>

  onGameUpdated: (callback: (game: GameRecord) => void) => () => void
  onGameRunningStarted: (callback: (gameId: string) => void) => () => void

  minimizeWindow: () => Promise<void>
  toggleMaximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (callback: (maximized: boolean) => void) => () => void

  requestQuit: () => Promise<{
    hasActiveGames: boolean
    games: { gameId: string; title: string; startTime: number }[]
  }>
  confirmQuit: () => Promise<void>
  cancelQuit: () => Promise<void>
  minimizeToTray: () => Promise<void>
  onQuitDialog: (callback: (games: { gameId: string; title: string; startTime: number }[]) => void) => void
  onRequestQuitFlow: (callback: () => void) => void

  // 统计排行
  getRankings: (params: { cutoff?: number; limit?: number }) => Promise<RankingItem[]>
  getChartData: (params: { gameId?: string; range: TimeRange }) => Promise<ChartDataResult>
  getHomeData: () => Promise<HomeData>

  // 批量匹配
  batchMatch: (request: BatchMatchRequest) => Promise<MatchedRow[]>

  // 服务端过滤排序
  getFilteredGames: (query: GameQuery) => Promise<PaginatedResult<GameRecord>>
}
