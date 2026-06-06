import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { pipeline } from 'stream/promises'
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
      snapshotOps.create(gameId, zipPath, fileSize)
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
    } catch (renameErr) {
      throw new Error(`无法备份当前存档: ${savePath} (${(renameErr as Error).message})`)
    }

    const extractPath = savePath
    try {
      const { Parse } = await import('unzipper')
      const zipStream = fs.createReadStream(snap.snapshot_path)
      const parser = zipStream.pipe(Parse({ forceStream: true }))

      for await (const entry of parser) {
        const entryPath = entry.path as string
        const outputPath = path.join(extractPath, entryPath)
        if (entry.type === 'Directory') {
          await fsp.mkdir(outputPath, { recursive: true })
        } else {
          await fsp.mkdir(path.dirname(outputPath), { recursive: true })
          await pipeline(entry, fs.createWriteStream(outputPath))
        }
      }

      await fsp.rm(backupDir, { recursive: true }).catch(() => {})
    } catch {
      await fsp.rm(savePath, { recursive: true }).catch(() => {})
      await fsp.rename(backupDir, savePath).catch(() => {})
      releaseLock()
      throw new Error('解压失败')
    }
    releaseLock()
  } catch (err) {
    releaseLock()
    throw err
  }
}

export async function autoMatchSaveDir(executablePath: string): Promise<string[]> {
  if (!executablePath) return []
  const dir = path.dirname(executablePath)
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  const matched: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory() && /save/i.test(entry.name)) {
      matched.push(path.join(dir, entry.name))
    }
  }
  return matched
}

export async function getSnapshotDirPath(gameId: string): Promise<string> {
  const dir = getSnapshotDir(gameId)
  await fsp.mkdir(dir, { recursive: true })
  return dir
}
