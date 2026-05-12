import type { SaveSnapshot } from '../../shared/types'
import { getDatabase } from './init'

export const snapshotOps = {
  getByGameId: (gameId: string): SaveSnapshot[] => {
    return getDatabase().prepare(
      'SELECT * FROM save_snapshots WHERE game_id = ? ORDER BY created_at DESC'
    ).all(gameId) as SaveSnapshot[]
  },

  create: (gameId: string, notes = ''): SaveSnapshot => {
    const snap: SaveSnapshot = {
      id: `snap-${Date.now()}`,
      game_id: gameId,
      snapshot_path: '',
      file_size: 0,
      notes,
      created_at: Date.now()
    }
    getDatabase().prepare(
      'INSERT INTO save_snapshots (id, game_id, snapshot_path, file_size, notes, created_at) VALUES (@id, @game_id, @snapshot_path, @file_size, @notes, @created_at)'
    ).run(snap)
    return snap
  },

  updatePath: (id: string, path: string, fileSize: number): void => {
    getDatabase().prepare(
      'UPDATE save_snapshots SET snapshot_path = @path, file_size = @size WHERE id = @id'
    ).run({ id, path, size: fileSize })
  },

  delete: (id: string): void => {
    getDatabase().prepare('DELETE FROM save_snapshots WHERE id = ?').run(id)
  }
}
