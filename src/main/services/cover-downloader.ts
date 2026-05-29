import { existsSync } from 'fs'
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

export async function downloadCover(gameId: string, remoteUrl: string): Promise<string | null> {
  try {
    const dir = await ensureCoverDirOnce()
    const urlPath = new URL(remoteUrl).pathname
    const ext = urlPath.endsWith('.png') ? 'png'
      : urlPath.endsWith('.webp') ? 'webp'
      : 'jpg'
    const filename = `${gameId}.${ext}`
    const localPath = join(dir, filename)

    if (existsSync(localPath)) {
      const mtime = await stat(localPath).then((s) => s.mtimeMs).catch(() => Date.now())
      return `cover://${filename}?t=${mtime}`
    }

    const resp = await fetch(remoteUrl)
    if (!resp.ok) return null
    await writeFile(localPath, Buffer.from(await resp.arrayBuffer()))
    return `cover://${filename}?t=${Date.now()}`
  } catch (err) {
    console.error('下载封面失败:', err, 'URL:', remoteUrl)
    return null
  }
}

/** 根据 cover:// URL 获取本地文件绝对路径 */
export function resolveCoverPath(coverUrl: string): string {
  const dir = getCoverDir()
  const filename = basename(coverUrl.replace('cover://', '').split('?')[0])
  return join(dir, filename)
}
