import { dialog } from 'electron'
import { readdir, stat } from 'fs/promises'
import { join, basename, sep } from 'path'
import type { ScanResult, BatchScanResult, ScanOptions } from '../../shared/types'

const IO_CONCURRENCY = 50

// 基于 Promise 等待队列的信号量，避免自旋轮询
let activeOps = 0
const MAX_TOTAL_OPS = 200
const waitQueue: (() => void)[] = []

async function withGlobalLimit<T>(fn: () => Promise<T>): Promise<T> {
  while (activeOps >= MAX_TOTAL_OPS) {
    await new Promise<void>((resolve) => {
      waitQueue.push(resolve)
    })
  }
  activeOps++
  try {
    return await fn()
  } finally {
    activeOps--
    waitQueue.shift()?.()
  }
}

/** 并发控制：同时最多执行 limit 个异步任务 */
async function limitedPool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let cursor = 0
  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const i = cursor++
      results[i] = await withGlobalLimit(tasks[i])
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function getDirSize(dirPath: string): Promise<number> {
  let totalSize = 0
  let currentDirs: string[] = [dirPath]

  // BFS 按层遍历，避免递归创建大量 worker 导致全局信号量耗尽
  while (currentDirs.length > 0) {
    const tasks = currentDirs.map((path) => async () => {
      try {
        const entries = await readdir(path, { withFileTypes: true })
        let size = 0
        const subdirs: string[] = []
        for (const entry of entries) {
          const fullPath = join(path, entry.name)
          try {
            if (entry.isDirectory()) {
              subdirs.push(fullPath)
            } else if (entry.isFile()) {
              size += (await stat(fullPath)).size
            }
          } catch {
            /* skip inaccessible file/dir */
          }
        }
        return { size, subdirs }
      } catch {
        return { size: 0, subdirs: [] as string[] }
      }
    })

    const results = await limitedPool(tasks, IO_CONCURRENCY)
    currentDirs = []
    for (const r of results) {
      totalSize += r.size
      currentDirs.push(...r.subdirs)
    }
  }

  return totalSize
}

const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB']
const SIZE_DIVISORS = [1, 1024, 1048576, 1073741824, 1099511627776]

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  let i = 0
  while (i < SIZE_DIVISORS.length - 1 && bytes >= SIZE_DIVISORS[i + 1]) i++
  const size = (bytes / SIZE_DIVISORS[i]).toFixed(i > 0 ? 1 : 0)
  return `${size} ${SIZE_UNITS[i]}`
}

async function scanExeFiles(dirPath: string, maxDepth = 3): Promise<string[]> {
  const result: string[] = []
  type WorkItem = { path: string; depth: number }
  let currentBatch: WorkItem[] = [{ path: dirPath, depth: 0 }]

  // BFS 按层遍历，每层共享一个 limitedPool，避免递归创建大量 worker
  while (currentBatch.length > 0) {
    const tasks = currentBatch.map(({ path, depth }) => async () => {
      try {
        const entries = await readdir(path, { withFileTypes: true })
        const exes: string[] = []
        const subdirs: WorkItem[] = []
        for (const entry of entries) {
          const fullPath = join(path, entry.name)
          if (entry.isDirectory() && depth < maxDepth) {
            subdirs.push({ path: fullPath, depth: depth + 1 })
          } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
            exes.push(fullPath)
          }
        }
        return { exes, subdirs }
      } catch {
        return { exes: [] as string[], subdirs: [] as WorkItem[] }
      }
    })

    const results = await limitedPool(tasks, IO_CONCURRENCY)
    currentBatch = []
    for (const r of results) {
      result.push(...r.exes)
      currentBatch.push(...r.subdirs)
    }
  }

  return result
}

const EXACT_EXCLUDES = new Set([
  'unins000.exe',
  'unins001.exe',
  'dxwebsetup.exe',
  'oalinst.exe',
  'winrar.exe',
  'steam.exe',
  'setup.exe',
  'install.exe',
  'crashhandler.exe',
  'unitycrashhandler.exe'
])

const PREFIX_EXCLUDES = ['uninst', 'vcredist', 'dotnet', 'directx']

function isSystemExe(name: string): boolean {
  const lower = name.toLowerCase()
  if (EXACT_EXCLUDES.has(lower)) return true
  return PREFIX_EXCLUDES.some((prefix) => lower.startsWith(prefix))
}

export async function scanDirectory(
  folderPath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const { maxDepth = 3, skipSize = false } = options
  const folderName = basename(folderPath)
  const [rawExes, dirSize] = await Promise.all([
    scanExeFiles(folderPath, maxDepth),
    skipSize ? Promise.resolve(0) : getDirSize(folderPath)
  ])

  const executables = rawExes
    .map((fullPath) => ({ name: basename(fullPath), fullPath }))
    .filter((e) => !isSystemExe(e.name))
    .sort((a, b) => {
      const aDepth = a.fullPath.split(sep).length
      const bDepth = b.fullPath.split(sep).length
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

const BATCH_CONCURRENCY = 8

export async function scanBatchDirectory(
  parentPath: string,
  options?: ScanOptions
): Promise<BatchScanResult> {
  try {
    const entries = await readdir(parentPath, { withFileTypes: true })
    const dirs = entries.filter((e) => e.isDirectory())
    // 跳过 size 计算，大幅加快扫描速度
    const scanOptions: ScanOptions = { ...options }

    const tasks = dirs.map((entry) => async () => {
      const folderPath = join(parentPath, entry.name)
      try {
        const result = await scanDirectory(folderPath, scanOptions)
        return {
          folderPath: result.folderPath,
          folderName: result.folderName,
          executables: result.executables,
          totalSize: result.totalSize
        }
      } catch {
        return {
          folderPath,
          folderName: entry.name,
          executables: [] as { name: string; fullPath: string }[],
          totalSize: '未知'
        }
      }
    })

    const results = await limitedPool(tasks, BATCH_CONCURRENCY)
    return { items: results }
  } catch {
    return { items: [] }
  }
}

/** 批量计算多个目录的磁盘占用大小（后台执行，不阻塞主流程） */
export async function getDirectorySizes(dirPaths: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const tasks = dirPaths.map((dirPath) => async () => {
    const bytes = await getDirSize(dirPath)
    result[dirPath] = formatSize(bytes)
  })
  await limitedPool(tasks, BATCH_CONCURRENCY)
  return result
}
export async function pickBatchFolderAndScan(
  options?: ScanOptions
): Promise<BatchScanResult | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择包含多个游戏的根文件夹'
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return scanBatchDirectory(result.filePaths[0], options)
}
