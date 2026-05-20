import { randomUUID } from 'node:crypto'
import type { PlaySession } from '../../shared/types'
import { getDatabase } from './init'

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
