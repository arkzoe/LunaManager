import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { getCoverDir } from '../config/paths'

function ensureCoverDir(): string {
  const dir = getCoverDir()
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true })
    } catch {
      /* ok */
    }
  }
  return dir
}

export async function downloadCover(gameId: string, remoteUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(remoteUrl)
    if (!resp.ok) return null
    const buffer = Buffer.from(await resp.arrayBuffer())
    const urlPath = new URL(remoteUrl).pathname
    const ext = urlPath.endsWith('.png') ? 'png' : 'jpg'
    const filename = `${gameId}.${ext}`
    const localPath = join(ensureCoverDir(), filename)
    writeFileSync(localPath, buffer)
    // 返回自定义协议 URL，渲染进程通过 custom protocol 加载
    // 追加时间戳防止浏览器缓存旧封面
    return `cover://${filename}?t=${Date.now()}`
  } catch {
    return null
  }
}

/** 根据 cover:// URL 获取本地文件绝对路径 */
export function resolveCoverPath(coverUrl: string): string {
  const filename = basename(coverUrl.replace('cover://', '').split('?')[0])
  return join(ensureCoverDir(), filename)
}
