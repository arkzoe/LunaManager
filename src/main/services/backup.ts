import fs from 'fs'
import path from 'path'
import { snapshotOps, gameOps } from '../database'
import { getDatabase } from '../database/init'
import { getSnapshotDir } from '../config/paths'

export async function backupSave(gameId: string, savePath: string): Promise<string> {
  if (!savePath || !fs.existsSync(savePath)) {
    throw new Error('存档路径不存在')
  }

  const snapshotDir = getSnapshotDir(gameId)
  fs.mkdirSync(snapshotDir, { recursive: true })

  const snapshotId = `snap-${Date.now()}`
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

    archive.finalize()
  })
}

export async function restoreSave(snapshotId: string): Promise<void> {
  const snap = getDatabase().prepare(
    'SELECT * FROM save_snapshots WHERE id = ?'
  ).get(snapshotId) as { id: string; game_id: string; snapshot_path: string } | undefined

  if (!snap || !snap.snapshot_path || !fs.existsSync(snap.snapshot_path)) {
    throw new Error('快照文件不存在')
  }

  const game = gameOps.getById(snap.game_id)
  if (!game || !game.save_path) {
    throw new Error('游戏未设置存档路径')
  }

  const savePath = game.save_path
  const backupDir = savePath + '.backup'

  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true })
  }
  if (fs.existsSync(savePath)) {
    fs.renameSync(savePath, backupDir)
  }

  const extractPath = savePath
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process')
    const unzip = spawn('powershell', [
      '-NoProfile', '-Command',
      `Expand-Archive -Path '${snap.snapshot_path}' -DestinationPath '${extractPath}' -Force`
    ])
    unzip.on('close', (code: number) => {
      if (code === 0) {
        if (fs.existsSync(backupDir)) {
          fs.rmSync(backupDir, { recursive: true })
        }
        resolve()
      } else {
        if (fs.existsSync(backupDir)) {
          if (fs.existsSync(savePath)) {
            fs.rmSync(savePath, { recursive: true })
          }
          fs.renameSync(backupDir, savePath)
        }
        reject(new Error('解压失败'))
      }
    })
    unzip.on('error', () => {
      if (fs.existsSync(backupDir)) {
        if (fs.existsSync(savePath)) {
          fs.rmSync(savePath, { recursive: true })
        }
        fs.renameSync(backupDir, savePath)
      }
      reject(new Error('解压失败'))
    })
  })
}

export function getSnapshotDirPath(gameId: string): string {
  const dir = getSnapshotDir(gameId)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}
