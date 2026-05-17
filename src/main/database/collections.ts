import type { Collection, GameRecord } from '../../shared/types'
import { getDatabase } from './init'

export const collectionOps = {
  getAll: (): Collection[] => {
    return getDatabase().prepare(
      'SELECT * FROM collections ORDER BY sort_order ASC, created_at ASC'
    ).all() as Collection[]
  },

  getById: (id: string): Collection | undefined => {
    return getDatabase().prepare('SELECT * FROM collections WHERE id = ?').get(id) as Collection | undefined
  },

  create: (name: string): Collection => {
    const db = getDatabase()
    const now = Date.now()
    const c: Collection = {
      id: `col-${now}`,
      name,
      parent_id: null,
      sort_order: (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM collections').get() as { n: number }).n,
      created_at: now,
      updated_at: now
    }
    db.prepare('INSERT INTO collections (id, name, parent_id, sort_order, created_at, updated_at) VALUES (@id, @name, @parent_id, @sort_order, @created_at, @updated_at)').run(c)
    return c
  },

  rename: (id: string, name: string): void => {
    getDatabase().prepare('UPDATE collections SET name = @name, updated_at = @now WHERE id = @id').run({ id, name, now: Date.now() })
  },

  delete: (id: string): void => {
    getDatabase().prepare('DELETE FROM collections WHERE id = ?').run(id)
  },

  reorder: (ids: string[]): void => {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE collections SET sort_order = @order WHERE id = @id')
    const txn = db.transaction(() => {
      ids.forEach((id, i) => stmt.run({ id, order: i }))
    })
    txn()
  },

  addGame: (gameId: string, collectionId: string): void => {
    getDatabase().prepare(
      'INSERT OR IGNORE INTO game_collections (game_id, collection_id) VALUES (@g, @c)'
    ).run({ g: gameId, c: collectionId })
  },

  removeGame: (gameId: string, collectionId: string): void => {
    getDatabase().prepare(
      'DELETE FROM game_collections WHERE game_id = @g AND collection_id = @c'
    ).run({ g: gameId, c: collectionId })
  },

  getCollectionGames: (collectionId: string): GameRecord[] => {
    return getDatabase().prepare(`
      SELECT g.* FROM games g
      INNER JOIN game_collections gc ON g.id = gc.game_id
      WHERE gc.collection_id = ?
      ORDER BY g.title ASC
    `).all(collectionId) as GameRecord[]
  },

  getAllCollectionGamesMap: (): Record<string, string[]> => {
    const rows = getDatabase().prepare(`
      SELECT gc.collection_id, g.id AS game_id FROM game_collections gc
      INNER JOIN games g ON g.id = gc.game_id
      ORDER BY g.title ASC
    `).all() as { collection_id: string; game_id: string }[]
    const map: Record<string, string[]> = {}
    for (const r of rows) {
      if (!map[r.collection_id]) map[r.collection_id] = []
      map[r.collection_id].push(r.game_id)
    }
    return map
  },
}
