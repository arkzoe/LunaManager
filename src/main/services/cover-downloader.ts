import { mkdir, writeFile, stat } from 'fs/promises'
import { join, basename } from 'path'
import { getCoverDir } from '../config/paths'

let coverDirInit = false
async function ensureCoverDirOnce(): Promise<string> {
  if (!coverDirInit) {
    const dir = getCoverDir()
    await mkdir(dir, { recursive: true }).catch(() => {})
    coverDirInit = true
  }
  return getCoverDir()
}

// 基于 gameId 的写入锁，避免 TOCTOU 竞态导致并发下载同一封面时相互覆盖
const writeLocks = new Map<string, Promise<unknown>>()

async function withWriteLock<T>(gameId: string, fn: () => Promise<T>): Promise<T> {
  const prev = writeLocks.get(gameId) ?? Promise.resolve()
  const next = prev.then(fn, fn) // 即使前一个失败也继续
  writeLocks.set(gameId, next)
  try {
    return (await next) as T
  } finally {
    if (writeLocks.get(gameId) === next) {
      writeLocks.delete(gameId)
    }
  }
}

export async function downloadCover(gameId: string, remoteUrl: string): Promise<string | null> {
  return withWriteLock(gameId, async () => {
    try {
      const dir = await ensureCoverDirOnce()
      const urlPath = new URL(remoteUrl).pathname
      const ext = urlPath.endsWith('.png') ? 'png' : urlPath.endsWith('.webp') ? 'webp' : 'jpg'
      const filename = `${gameId}.${ext}`
      const localPath = join(dir, filename)

      // 先检查缓存（在锁内，无竞态）
      const existing = await stat(localPath)
        .then((s) => s.mtimeMs)
        .catch(() => null)
      if (existing) {
        return `cover://${filename}?t=${existing}`
      }

      const resp = await fetch(remoteUrl, { signal: AbortSignal.timeout(15_000) })
      if (!resp.ok) return null
      await writeFile(localPath, Buffer.from(await resp.arrayBuffer()))
      return `cover://${filename}?t=${Date.now()}`
    } catch (err) {
      console.error('下载封面失败:', err, 'URL:', remoteUrl)
      return null
    }
  })
}

/** 根据 cover:// URL 获取本地文件绝对路径 */
export function resolveCoverPath(coverUrl: string): string {
  const dir = getCoverDir()
  const filename = basename(coverUrl.replace('cover://', '').split('?')[0])
  return join(dir, filename)
}
