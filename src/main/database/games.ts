import type { GameRecord, GameStatus } from '../../shared/types'
import { getDatabase } from './init'

export const gameOps = {
  getAll: (): GameRecord[] => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games ORDER BY created_at DESC').all() as GameRecord[]
  },

  getById: (id: string): GameRecord | undefined => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM games WHERE id = ?').get(id) as GameRecord | undefined
  },

  create: (game: Omit<GameRecord, 'created_at' | 'updated_at'>): GameRecord => {
    const db = getDatabase()
    const now = Date.now()
    const record = { ...game, created_at: now, updated_at: now }
    db.prepare(`
      INSERT INTO games (id, title, title_cn, cover, category, rating, size, installed, favorite,
        status, personal_rating, last_played, description, developer, publisher, release_date,
        playtime, executable_path, save_path, vndb_id, bangumi_id, notes, custom_tags,
        last_launch_method, created_at, updated_at)
      VALUES (@id, @title, @title_cn, @cover, @category, @rating, @size, @installed, @favorite,
        @status, @personal_rating, @last_played, @description, @developer, @publisher, @release_date,
        @playtime, @executable_path, @save_path, @vndb_id, @bangumi_id, @notes, @custom_tags,
        @last_launch_method, @created_at, @updated_at)
    `).run(record)
    return record as GameRecord
  },

  update: (id: string, updates: Partial<Omit<GameRecord, 'id' | 'created_at'>>): void => {
    const db = getDatabase()
    const fields = Object.keys(updates).map(k => `${k} = @${k}`).join(', ')
    db.prepare(`UPDATE games SET ${fields}, updated_at = @updated_at WHERE id = @id`).run({
      ...updates, updated_at: Date.now(), id
    })
  },

  delete: (id: string): void => {
    getDatabase().prepare('DELETE FROM games WHERE id = ?').run(id)
  },

  search: (query: string): GameRecord[] => {
    const p = `%${query}%`
    return getDatabase().prepare(
      'SELECT * FROM games WHERE title LIKE ? OR developer LIKE ? ORDER BY title ASC'
    ).all(p, p) as GameRecord[]
  },

  getByCategory: (category: string): GameRecord[] => {
    return getDatabase().prepare(
      'SELECT * FROM games WHERE category = ? ORDER BY title ASC'
    ).all(category) as GameRecord[]
  },

  getByStatus: (status: GameStatus): GameRecord[] => {
    return getDatabase().prepare(
      'SELECT * FROM games WHERE status = ? ORDER BY title ASC'
    ).all(status) as GameRecord[]
  },

  getFavorites: (): GameRecord[] => {
    return getDatabase().prepare(
      'SELECT * FROM games WHERE favorite = 1 ORDER BY title ASC'
    ).all() as GameRecord[]
  },

  getInstalled: (): GameRecord[] => {
    return getDatabase().prepare(
      'SELECT * FROM games WHERE installed = 1 ORDER BY title ASC'
    ).all() as GameRecord[]
  }
}
