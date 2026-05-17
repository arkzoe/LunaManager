import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { getCoverDir as getSharedCoverDir } from '../config/paths'

export function getCoverDir(): string {
  const dir = getSharedCoverDir()
  if (!existsSync(dir)) {
    try { mkdirSync(dir, { recursive: true }) } catch { /* ok */ }
  }
  return dir
}

export async function downloadCover(
  gameId: string,
  remoteUrl: string
): Promise<string | null> {
  try {
    const resp = await fetch(remoteUrl)
    if (!resp.ok) return null
    const buffer = Buffer.from(await resp.arrayBuffer())
    const urlPath = new URL(remoteUrl).pathname
    const ext = urlPath.endsWith('.png') ? 'png' : 'jpg'
    const filename = `${gameId}.${ext}`
    const localPath = join(getCoverDir(), filename)
    writeFileSync(localPath, buffer)
    // 返回自定义协议 URL，渲染进程通过 custom protocol 加载
    return `cover://${filename}`
  } catch {
    return null
  }
}

/** 根据 cover:// URL 获取本地文件绝对路径 */
export function resolveCoverPath(coverUrl: string): string {
  const filename = basename(coverUrl.replace('cover://', ''))
  return join(getCoverDir(), filename)
}
