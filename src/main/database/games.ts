import { randomUUID } from 'node:crypto'
import type { GameRecord, GameStatus } from '../../shared/types'
import { getDatabase } from './init'

export const gameOps = {
  getAll: (): GameRecord[] => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games ORDER BY created_at DESC').all() as GameRecord[]
  },

  /** Lightweight list query without large text columns */
  getList: (): GameRecord[] => {
    const db = getDatabase()
    return db
      .prepare(
        'SELECT id, title, title_cn, cover, rating, size, installed, favorite, status, personal_rating, last_played, developer, publisher, release_date, playtime, playtime_seconds, executable_path, save_path, vndb_id, bangumi_id, last_launch_method, created_at, updated_at FROM games ORDER BY created_at DESC'
      )
      .all() as GameRecord[]
  },

  getById: (id: string): GameRecord | undefined => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games WHERE id = ?').get(id) as GameRecord | undefined
  },

  create: (game: Omit<GameRecord, 'created_at' | 'updated_at'>): GameRecord => {
    if (!game.title || !game.title.trim()) throw new Error('游戏名称不能为空')
    const db = getDatabase()
    const now = Date.now()
    const record = {
      ...game,
      id: game.id || `id-${randomUUID()}`,
      created_at: now,
      updated_at: now
    }
    db.prepare(
      `
      INSERT INTO games (id, title, title_cn, cover, size, favorite,
        status, personal_rating, last_played, description, developer, release_date,
        playtime_seconds, executable_path, save_path, vndb_id, bangumi_id, notes, custom_tags,
        last_launch_method, created_at, updated_at)
      VALUES (@id, @title, @title_cn, @cover, @size, @favorite,
        @status, @personal_rating, @last_played, @description, @developer, @release_date,
        @playtime_seconds, @executable_path, @save_path, @vndb_id, @bangumi_id, @notes, @custom_tags,
        @last_launch_method, @created_at, @updated_at)
    `
    ).run(record)
    return record as GameRecord
  },

  update: (id: string, updates: Partial<Omit<GameRecord, 'id' | 'created_at'>>): void => {
    const keys = Object.keys(updates)
    if (keys.length === 0) return
    const db = getDatabase()
    const fields = keys.map((k) => `${k} = @${k}`).join(', ')
    db.prepare(`UPDATE games SET ${fields}, updated_at = @updated_at WHERE id = @id`).run({
      ...updates,
      updated_at: Date.now(),
      id
    })
  },

  delete: (id: string): void => {
    getDatabase().prepare('DELETE FROM games WHERE id = ?').run(id)
  },

  search: (query: string): GameRecord[] => {
    // Fall back to LIKE if FTS returns no results (e.g. during migration)
    const db = getDatabase()
    const ftsQuery = query.replace(/[^\w一-鿿]/g, ' ').trim()
    if (ftsQuery) {
      const ftsResults = db
        .prepare(
          `SELECT g.* FROM games g
         INNER JOIN games_fts fts ON g.rowid = fts.rowid
         WHERE games_fts MATCH ? ORDER BY rank LIMIT 50`
        )
        .all(
          ftsQuery
            .split(/\s+/)
            .map((w) => `"${w}"`)
            .join(' ')
        ) as GameRecord[]
      if (ftsResults.length > 0) return ftsResults
    }
    // Fallback: LIKE search with escape
    const escaped = query.replace(/[%_]/g, '\\$&')
    const p = `%${escaped}%`
    return db
      .prepare(
        "SELECT * FROM games WHERE title LIKE ? ESCAPE '\\' OR title_cn LIKE ? ESCAPE '\\' OR developer LIKE ? ESCAPE '\\' ORDER BY title ASC"
      )
      .all(p, p, p) as GameRecord[]
  },

  getByStatus: (status: GameStatus): GameRecord[] => {
    return getDatabase()
      .prepare('SELECT * FROM games WHERE status = ? ORDER BY title ASC')
      .all(status) as GameRecord[]
  },

  getByExecutablePath: (path: string): GameRecord | undefined => {
    return getDatabase().prepare('SELECT * FROM games WHERE executable_path = ?').get(path) as
      | GameRecord
      | undefined
  }
}
