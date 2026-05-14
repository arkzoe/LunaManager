import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { app } from 'electron'

export function getCoverDir(): string {
  const dir = app.isPackaged
    ? join(app.getPath('userData'), 'covers')
    : join(process.cwd(), 'data', 'covers')
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
    const ext = remoteUrl.includes('.png') ? 'png' : 'jpg'
    const filename = `${gameId}.${ext}`
    const localPath = join(getCoverDir(), filename)
    writeFileSync(localPath, buffer)
    // 返回自定义协议 URL，渲染进程通过 custom protocol 加载
    return `cover://${filename}`
  } catch {
    return null
  }
}

export function deleteCover(coverUrl: string): void {
  try {
    const filename = basename(coverUrl.replace('cover://', ''))
    const path = join(getCoverDir(), filename)
    if (existsSync(path)) {
      unlinkSync(path)
    }
  } catch { /* ok */ }
}

/** 根据 cover:// URL 获取本地文件绝对路径 */
export function resolveCoverPath(coverUrl: string): string {
  const filename = basename(coverUrl.replace('cover://', ''))
  return join(getCoverDir(), filename)
}
