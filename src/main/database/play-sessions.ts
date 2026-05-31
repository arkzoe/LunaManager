import { randomUUID } from 'node:crypto'
import type { PlaySession, RankingItem, ChartDataResult } from '../../shared/types'
import { getDatabase } from './init'
import { gameOps } from './games'

type AggregatedStats = {
  game_id: string
  total_sessions: number
  total_duration: number
  last_played: number | null
}

let statsCache: AggregatedStats[] | null = null

function invalidateStatsCache(): void {
  statsCache = null
}

export const sessionOps = {
  start: (gameId: string): PlaySession => {
    invalidateStatsCache()
    const db = getDatabase()
    const session: PlaySession = {
      id: `session-${randomUUID()}`,
      game_id: gameId,
      start_time: Date.now(),
      end_time: 0,
      duration: 0
    }
    db.prepare(
      'INSERT INTO play_sessions (id, game_id, start_time) VALUES (@id, @game_id, @start_time)'
    ).run(session)
    return session
  },

  end: (sessionId: string): void => {
    invalidateStatsCache()
    const now = Date.now()
    getDatabase()
      .prepare(
        'UPDATE play_sessions SET end_time = @end_time, duration = @end_time - start_time WHERE id = @id'
      )
      .run({ id: sessionId, end_time: now })
  },

  getByGameId: (gameId: string): PlaySession[] => {
    return getDatabase()
      .prepare('SELECT * FROM play_sessions WHERE game_id = ? ORDER BY start_time DESC')
      .all(gameId) as PlaySession[]
  },

  getAll: (limit = 5000): PlaySession[] => {
    return getDatabase()
      .prepare('SELECT * FROM play_sessions ORDER BY start_time ASC LIMIT ?')
      .all(limit) as PlaySession[]
  },

  getRecent: (limit = 10): PlaySession[] => {
    return getDatabase()
      .prepare('SELECT * FROM play_sessions ORDER BY start_time DESC LIMIT ?')
      .all(limit) as PlaySession[]
  },

  getTotalPlaytime: (gameId: string): number => {
    const r = getDatabase()
      .prepare(
        'SELECT COALESCE(SUM(duration), 0) as total FROM play_sessions WHERE game_id = ? AND duration IS NOT NULL'
      )
      .get(gameId) as { total: number }
    return r.total
  },

  endActiveSessionsForGame: (gameId: string): void => {
    invalidateStatsCache()
    const now = Date.now()
    getDatabase()
      .prepare(
        'UPDATE play_sessions SET end_time = ?, duration = ? - start_time WHERE game_id = ? AND (end_time IS NULL OR end_time = 0)'
      )
      .run(now, now, gameId)
  },

  getTotalCount: (): number => {
    const r = getDatabase().prepare('SELECT COUNT(*) as count FROM play_sessions').get() as {
      count: number
    }
    return r.count
  },

  getAllAggregatedStats: (): AggregatedStats[] => {
    if (statsCache) return statsCache
    statsCache = getDatabase()
      .prepare(
        `
      SELECT game_id, COUNT(*) as total_sessions,
        COALESCE(SUM(duration), 0) as total_duration,
        MAX(start_time) as last_played
      FROM play_sessions
      GROUP BY game_id
      ORDER BY total_duration DESC
    `
      )
      .all() as AggregatedStats[]
    return statsCache
  },

  getActiveSessions: (): { id: string; game_id: string; start_time: number }[] => {
    return getDatabase()
      .prepare(
        'SELECT id, game_id, start_time FROM play_sessions WHERE end_time IS NULL OR end_time = 0'
      )
      .all() as { id: string; game_id: string; start_time: number }[]
  },

  endAllActiveSessions: (): void => {
    invalidateStatsCache()
    const now = Date.now()
    getDatabase()
      .prepare(
        'UPDATE play_sessions SET end_time = ?, duration = ? - start_time WHERE end_time = 0'
      )
      .run(now, now)
  },

  getAggregatedStats: (
    gameId: string
  ): { total_sessions: number; total_duration: number; last_played: number | null } => {
    const r = getDatabase()
      .prepare(
        `
      SELECT COUNT(*) as total_sessions, COALESCE(SUM(duration), 0) as total_duration,
        MAX(start_time) as last_played FROM play_sessions WHERE game_id = ?
    `
      )
      .get(gameId) as { total_sessions: number; total_duration: number; last_played: number | null }
    return r
  }
}

// ===== 统计排行（Phase 1 后端迁移） =====

// 内存缓存：减少重复 SQL 查询
interface CacheEntry<T> {
  data: T
  expiry: number
}
const rankingsCache = new Map<string, CacheEntry<ReturnType<typeof getRankings>>>()
const chartCache = new Map<string, CacheEntry<ReturnType<typeof getChartData>>>()
const CACHE_TTL = 30_000 // 30s

function formatPlaytime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

export function getRankings(cutoff?: number, limit = 10): RankingItem[] {
  const cacheKey = `${cutoff ?? 'all'}:${limit}`
  const cached = rankingsCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.data

  const db = getDatabase()
  let rows: { game_id: string; total_duration: number }[]

  if (cutoff) {
    rows = db
      .prepare(
        `SELECT game_id, COALESCE(SUM(duration), 0) as total_duration
         FROM play_sessions
         WHERE start_time >= ?
         GROUP BY game_id
         ORDER BY total_duration DESC
         LIMIT ?`
      )
      .all(cutoff, limit) as { game_id: string; total_duration: number }[]
  } else {
    rows = db
      .prepare(
        `SELECT game_id, COALESCE(SUM(duration), 0) as total_duration
         FROM play_sessions
         GROUP BY game_id
         ORDER BY total_duration DESC
         LIMIT ?`
      )
      .all(limit) as { game_id: string; total_duration: number }[]
  }

  const ranked = rows
    .map((s, idx) => {
      const game = gameOps.getById(s.game_id)
      return {
        rank: idx + 1,
        gameId: s.game_id,
        title: game ? game.title_cn || game.title : s.game_id,
        playtime: formatPlaytime(Math.floor(s.total_duration / 1000)),
        cover: game?.cover || ''
      }
    })
    .filter((item) => item.title)

  if (ranked.length === 0) {
    const empty = [
      { rank: 1, gameId: '', title: '-', playtime: '-', cover: '' },
      { rank: 2, gameId: '', title: '-', playtime: '-', cover: '' }
    ] as RankingItem[]
    rankingsCache.set(cacheKey, { data: empty, expiry: Date.now() + CACHE_TTL })
    return empty
  }
  rankingsCache.set(cacheKey, { data: ranked, expiry: Date.now() + CACHE_TTL })
  return ranked
}

const RANGE_MS: Record<string, number> = {
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000
}

export function getChartData(gameId: string | undefined, range: string): ChartDataResult {
  const cacheKey = `${gameId ?? 'all'}:${range}`
  const cached = chartCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.data

  const db = getDatabase()
  const rangeMs = RANGE_MS[range]
  const cutoff = rangeMs ? Date.now() - rangeMs : 0

  let query: string
  let params: (string | number)[]

  if (gameId) {
    if (range === 'all') {
      query = `SELECT (start_time / 86400000) as day_key,
                      SUM(duration) as total_duration
               FROM play_sessions
               WHERE game_id = ?
               GROUP BY strftime('%Y/%m', start_time / 1000, 'unixepoch')
               ORDER BY day_key ASC`
    } else {
      query = `SELECT (start_time / 86400000) as day_key,
                      SUM(duration) as total_duration
               FROM play_sessions
               WHERE game_id = ? AND start_time >= ?
               GROUP BY day_key
               ORDER BY day_key ASC`
    }
    params = range === 'all' ? [gameId] : [gameId, cutoff]
  } else {
    if (range === 'all') {
      query = `SELECT (start_time / 86400000) as day_key,
                      SUM(duration) as total_duration
               FROM play_sessions
               GROUP BY strftime('%Y/%m', start_time / 1000, 'unixepoch')
               ORDER BY day_key ASC`
    } else {
      query = `SELECT (start_time / 86400000) as day_key,
                      SUM(duration) as total_duration
               FROM play_sessions
               WHERE start_time >= ?
               GROUP BY day_key
               ORDER BY day_key ASC`
    }
    params = range === 'all' ? [] : [cutoff]
  }

  const rows = db.prepare(query).all(...params) as {
    day_key: number
    total_duration: number
  }[]

  if (rows.length === 0) {
    const empty: ChartDataResult = { labels: [], values: [] }
    chartCache.set(cacheKey, { data: empty, expiry: Date.now() + CACHE_TTL })
    return empty
  }

  const labels: string[] = []
  const values: number[] = []

  for (const row of rows) {
    const d = new Date(row.day_key * 86400000)
    if (range === 'all') {
      labels.push(`${d.getFullYear()}/${d.getMonth() + 1}`)
    } else {
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
    }
    values.push(Math.round(((row.total_duration || 0) / 3600000) * 10) / 10)
  }

  const result: ChartDataResult = { labels, values }
  chartCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL })
  return result
}
