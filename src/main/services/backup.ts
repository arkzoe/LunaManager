import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import { randomUUID } from 'node:crypto'
import { snapshotOps, gameOps } from '../database'
import { getSnapshotDir } from '../config/paths'

export async function backupSave(gameId: string, savePath: string): Promise<string> {
  try {
    await fsp.access(savePath)
  } catch {
    throw new Error('存档路径不存在')
  }

  const snapshotDir = getSnapshotDir(gameId)
  await fsp.mkdir(snapshotDir, { recursive: true })

  const snapshotId = `snap-${randomUUID()}`
  const zipPath = path.join(snapshotDir, `${snapshotId}.zip`)

  const { default: archiver } = await import('archiver')

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 6 } })

    output.on('close', () => {
      const fileSize = archive.pointer()
      snapshotOps.create(gameId, '', zipPath, fileSize)
      resolve(snapshotId)
    })

    output.on('error', (err) => {
      reject(err)
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.pipe(output)

    const stat = fs.statSync(savePath)
    if (stat.isDirectory()) {
      archive.directory(savePath, false)
    } else {
      archive.file(savePath, { name: path.basename(savePath) })
    }

    try {
      archive.finalize()
    } catch (err) {
      reject(err)
    }
  })
}

const restoreLocks = new Map<string, Promise<void>>()

export async function restoreSave(snapshotId: string): Promise<void> {
  // Serialize restore operations per snapshot
  if (restoreLocks.has(snapshotId)) {
    return restoreLocks.get(snapshotId)!
  }

  let resolveLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = () => resolve(undefined)
  })
  restoreLocks.set(snapshotId, lockPromise)

  const releaseLock = (): void => {
    restoreLocks.delete(snapshotId)
    resolveLock!()
  }

  try {
    const snap = snapshotOps.getById(snapshotId)

    if (!snap || !snap.snapshot_path) {
      releaseLock()
      throw new Error('快照文件不存在')
    }

    try {
      await fsp.access(snap.snapshot_path)
    } catch {
      releaseLock()
      throw new Error('快照文件不存在')
    }

    const game = gameOps.getById(snap.game_id)
    if (!game || !game.save_path) {
      releaseLock()
      throw new Error('游戏未设置存档路径')
    }

    const savePath = game.save_path
    const backupDir = savePath + '.backup'

    try {
      await fsp.rm(backupDir, { recursive: true })
    } catch {
      /* doesn't exist */
    }
    try {
      await fsp.rename(savePath, backupDir)
    } catch {
      /* doesn't exist */
    }

    const extractPath = savePath
    const result = new Promise<void>((resolve, reject) => {
      const unzip = spawn('powershell', [
        '-NoProfile',
        '-Command',
        '& Expand-Archive -LiteralPath',
        snap.snapshot_path,
        '-DestinationPath',
        extractPath,
        '-Force'
      ])
      void unzip.on('close', (code: number) => {
        if (code === 0) {
          fsp.rm(backupDir, { recursive: true }).catch(() => {})
          resolve()
        } else {
          fsp.rm(savePath, { recursive: true }).catch(() => {})
          fsp.rename(backupDir, savePath).catch(() => {})
          reject(new Error('解压失败'))
        }
      })
      void unzip.on('error', () => {
        fsp.rm(savePath, { recursive: true }).catch(() => {})
        fsp.rename(backupDir, savePath).catch(() => {})
        reject(new Error('解压失败'))
      })
    }).finally(releaseLock)
    return result
  } catch (err) {
    releaseLock()
    throw err
  }
}

export async function autoMatchSaveDir(executablePath: string): Promise<string | null> {
  if (!executablePath) return null
  const dir = path.dirname(executablePath)
  const candidates = ['save', 'savedata']
  for (const name of candidates) {
    const fullPath = path.join(dir, name)
    try {
      const s = await fsp.stat(fullPath)
      if (s.isDirectory()) return fullPath
    } catch {
      /* not found */
    }
  }
  return null
}

export async function getSnapshotDirPath(gameId: string): Promise<string> {
  const dir = getSnapshotDir(gameId)
  await fsp.mkdir(dir, { recursive: true })
  return dir
}
