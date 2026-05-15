import { dialog } from 'electron'
import { readdir, stat } from 'fs/promises'
import { join, basename } from 'path'
import type { ScanResult, BatchScanResult, ScanOptions } from '../../shared/types'

const IO_CONCURRENCY = 50

/** 并发控制：同时最多执行 limit 个异步任务 */
async function limitedPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let cursor = 0
  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const i = cursor++
      results[i] = await tasks[i]()
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function getDirSize(dirPath: string): Promise<number> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const sizes = await limitedPool(entries.map((entry) => async () => {
      const fullPath = join(dirPath, entry.name)
      try {
        if (entry.isDirectory()) return await getDirSize(fullPath)
        if (entry.isFile()) return (await stat(fullPath)).size
      } catch { /* skip inaccessible */ }
      return 0
    }), IO_CONCURRENCY)
    return sizes.reduce((sum, s) => sum + s, 0)
  } catch {
    return 0
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

async function scanExeFiles(dirPath: string, depth = 0, maxDepth = 3): Promise<string[]> {
  if (depth > maxDepth) return []
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const results = await limitedPool(entries.map((entry) => async () => {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory() && depth < maxDepth) {
        return scanExeFiles(fullPath, depth + 1, maxDepth)
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
        return [fullPath]
      }
      return []
    }), IO_CONCURRENCY)
    return results.flat()
  } catch {
    return []
  }
}

const EXACT_EXCLUDES = new Set([
  'unins000.exe', 'unins001.exe', 'dxwebsetup.exe', 'oalinst.exe',
  'winrar.exe', 'steam.exe', 'setup.exe', 'install.exe',
  'crashhandler.exe', 'unitycrashhandler.exe'
])

const PREFIX_EXCLUDES = ['uninst', 'vcredist', 'dotnet', 'directx']

function isSystemExe(name: string): boolean {
  const lower = name.toLowerCase()
  if (EXACT_EXCLUDES.has(lower)) return true
  return PREFIX_EXCLUDES.some((prefix) => lower.startsWith(prefix))
}

export async function scanDirectory(folderPath: string, options: ScanOptions = {}): Promise<ScanResult> {
  const { maxDepth = 3, skipSize = false } = options
  const folderName = basename(folderPath)
  const [rawExes, dirSize] = await Promise.all([
    scanExeFiles(folderPath, 0, maxDepth),
    skipSize ? Promise.resolve(0) : getDirSize(folderPath)
  ])

  const executables = rawExes
    .map((fullPath) => ({ name: basename(fullPath), fullPath }))
    .filter((e) => !isSystemExe(e.name))
    .sort((a, b) => {
      const aDepth = a.fullPath.split('\\').length
      const bDepth = b.fullPath.split('\\').length
      if (aDepth !== bDepth) return aDepth - bDepth
      return a.name.localeCompare(b.name)
    })

  const seen = new Set<string>()
  const deduped = executables.filter((e) => {
    if (seen.has(e.name)) return false
    seen.add(e.name)
    return true
  })

  return {
    folderPath,
    folderName,
    executables: deduped,
    totalSize: formatSize(dirSize)
  }
}

export async function pickFolderAndScan(options?: ScanOptions): Promise<ScanResult | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择游戏文件夹'
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return scanDirectory(result.filePaths[0], options)
}

export async function scanBatchDirectory(parentPath: string, options?: ScanOptions): Promise<BatchScanResult> {
  try {
    const entries = await readdir(parentPath, { withFileTypes: true })
    const dirs = entries.filter((e) => e.isDirectory())
    const results = await Promise.all(
      dirs.map(async (entry) => {
        const folderPath = join(parentPath, entry.name)
        const result = await scanDirectory(folderPath, options)
        return {
          folderPath: result.folderPath,
          folderName: result.folderName,
          executables: result.executables,
          totalSize: result.totalSize
        }
      })
    )
    return { items: results }
  } catch {
    return { items: [] }
  }
}

export async function pickBatchFolderAndScan(options?: ScanOptions): Promise<BatchScanResult | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择包含多个游戏的根文件夹'
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return scanBatchDirectory(result.filePaths[0], options)
}
