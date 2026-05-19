import { randomUUID } from 'node:crypto'
import type { SaveSnapshot } from '../../shared/types'
import { getDatabase } from './init'

export const snapshotOps = {
  getByGameId: (gameId: string): SaveSnapshot[] => {
    return getDatabase()
      .prepare('SELECT * FROM save_snapshots WHERE game_id = ? ORDER BY created_at DESC')
      .all(gameId) as SaveSnapshot[]
  },

  create: (gameId: string, notes = '', snapshotPath?: string, fileSize = 0): SaveSnapshot => {
    const snap: SaveSnapshot = {
      id: `snap-${randomUUID()}`,
      game_id: gameId,
      snapshot_path: snapshotPath || '',
      file_size: fileSize,
      notes,
      created_at: Date.now()
    }
    getDatabase()
      .prepare(
        'INSERT INTO save_snapshots (id, game_id, snapshot_path, file_size, notes, created_at) VALUES (@id, @game_id, @snapshot_path, @file_size, @notes, @created_at)'
      )
      .run(snap)
    return snap
  },

  getById: (id: string): SaveSnapshot | undefined => {
    return getDatabase().prepare('SELECT * FROM save_snapshots WHERE id = ?').get(id) as
      | SaveSnapshot
      | undefined
  },

  delete: (id: string): void => {
    getDatabase().prepare('DELETE FROM save_snapshots WHERE id = ?').run(id)
  }
}
