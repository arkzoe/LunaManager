import { randomUUID } from 'node:crypto'
import type { GameRecord, GameStatus, GameQuery, PaginatedResult } from '../../shared/types'
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
        'SELECT id, title, title_cn, cover, size, favorite, status, personal_rating, last_played, developer, release_date, playtime_seconds, executable_path, save_path, vndb_id, bangumi_id, last_launch_method, created_at, updated_at FROM games ORDER BY created_at DESC'
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

/** SQL ORDER BY 映射：将前端排序键转为 SQL 列名 */
function mapSortKey(key: GameQuery['sortKey']): string {
  switch (key) {
    case 'name':
      return "COALESCE(NULLIF(title_cn, ''), title) COLLATE NOCASE"
    case 'playtime':
      return 'playtime_seconds'
    case 'rating':
      return 'personal_rating'
    case 'last_played':
      return 'last_played'
    default:
      return 'title ASC'
  }
}

export function getFilteredGames(query: GameQuery): PaginatedResult<GameRecord> {
  const db = getDatabase()
  const conditions: string[] = []
  const params: (string | number)[] = []

  // 状态过滤
  if (query.status && query.status !== 'all') {
    conditions.push('status = ?')
    params.push(query.status)
  }

  // 文本搜索
  if (query.search && query.search.trim()) {
    const q = `%${query.search.trim().replace(/[%_]/g, '\\$&')}%`
    conditions.push("(title LIKE ? ESCAPE '\\' OR title_cn LIKE ? ESCAPE '\\')")
    params.push(q, q)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 排序
  const sortCol = mapSortKey(query.sortKey || 'name')
  const dir = query.sortDir === 'desc' ? 'DESC' : 'ASC'
  const orderClause = `ORDER BY ${sortCol} ${dir}`

  // 分页
  const limit = query.limit ?? 50
  const offset = query.offset ?? 0

  // 总数
  const countRow = db
    .prepare(`SELECT COUNT(*) as c FROM games ${whereClause}`)
    .get(...params) as { c: number }
  const total = countRow.c

  // 数据
  const items = db
    .prepare(`SELECT * FROM games ${whereClause} ${orderClause} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as GameRecord[]

  return {
    items,
    total,
    hasMore: offset + limit < total
  }
}
