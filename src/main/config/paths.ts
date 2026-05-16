import { app } from 'electron'
import { join } from 'path'

export function getDataDir(): string {
  const basePath = app.isPackaged
    ? join(app.getAppPath(), '..', '..')
    : process.cwd()
  return join(basePath, 'data')
}

export function getCoverDir(): string {
  return join(getDataDir(), 'covers')
}

export function getDbPath(): string {
  return join(getDataDir(), 'lunamanager.db')
}

export function getSnapshotDir(gameId: string): string {
  return join(getDataDir(), 'snapshots', gameId)
}
