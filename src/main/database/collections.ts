import type { Collection } from '../../shared/types'
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
    const c: Collection = {
      id: `col-${Date.now()}`,
      name,
      parent_id: '',
      sort_order: (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 as n FROM collections').get() as { n: number }).n,
      created_at: Date.now()
    }
    db.prepare('INSERT INTO collections (id, name, parent_id, sort_order, created_at) VALUES (@id, @name, @parent_id, @sort_order, @created_at)').run(c)
    return c
  },

  rename: (id: string, name: string): void => {
    getDatabase().prepare('UPDATE collections SET name = @name WHERE id = @id').run({ id, name })
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

  getGameIds: (collectionId: string): string[] => {
    const rows = getDatabase().prepare(
      'SELECT game_id FROM game_collections WHERE collection_id = ?'
    ).all(collectionId) as { game_id: string }[]
    return rows.map(r => r.game_id)
  }
}
