import { dialog } from 'electron'
import { readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import type { ImportScanResult, BatchScanResult } from '../../shared/types'

function getDirSize(dirPath: string): number {
  let total = 0
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      try {
        if (entry.isDirectory()) {
          total += getDirSize(fullPath)
        } else if (entry.isFile()) {
          total += statSync(fullPath).size
        }
      } catch {
        /* skip inaccessible */
      }
    }
  } catch {
    /* skip inaccessible */
  }
  return total
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

function scanExeFiles(dirPath: string, depth = 0): string[] {
  if (depth > 3) return []
  const exes: string[] = []
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory() && depth < 3) {
        exes.push(...scanExeFiles(fullPath, depth + 1))
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
        exes.push(fullPath)
      }
    }
  } catch {
    /* skip */
  }
  return exes
}

function isSystemExe(name: string): boolean {
  const lower = name.toLowerCase()
  const systemNames = [
    'unins000.exe',
    'unins001.exe',
    'uninst',
    'dxwebsetup.exe',
    'vcredist',
    'dotnet',
    'directx',
    'oalinst.exe',
    'winrar.exe',
    '7z',
    'steam.exe',
    'launcher.exe',
    'update.exe',
    'setup.exe',
    'config',
    'patch',
    'dat'
  ]
  return systemNames.some((s) => lower.includes(s))
}

export function scanDirectory(folderPath: string): ImportScanResult {
  const folderName = basename(folderPath)
  const rawExes = scanExeFiles(folderPath)
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
    totalSize: formatSize(getDirSize(folderPath))
  }
}

export async function pickFolderAndScan(): Promise<ImportScanResult | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择游戏文件夹'
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return scanDirectory(result.filePaths[0])
}

export function scanBatchDirectory(parentPath: string): BatchScanResult {
  const items: BatchScanResult['items'] = []
  try {
    const entries = readdirSync(parentPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const folderPath = join(parentPath, entry.name)
      const result = scanDirectory(folderPath)
      items.push({
        folderPath: result.folderPath,
        folderName: result.folderName,
        executables: result.executables,
        totalSize: result.totalSize
      })
    }
  } catch {
    /* skip inaccessible */
  }
  return { items }
}

export async function pickBatchFolderAndScan(): Promise<BatchScanResult | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择包含多个游戏的根文件夹'
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return scanBatchDirectory(result.filePaths[0])
}
