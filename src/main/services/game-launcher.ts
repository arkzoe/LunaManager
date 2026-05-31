import { spawn, execFile, exec, type ChildProcess } from 'child_process'
import path from 'path'
import { existsSync } from 'fs'
import { BrowserWindow } from 'electron'
import { getConfig } from '../config/store'
import { getLeProcPath } from '../config/paths'
import { sessionOps, gameOps, getDatabase } from '../database'
import type { LaunchMode, GameRecord } from '../../shared/types'

const activeProcesses = new Map<string, ChildProcess>()
const launchLocks = new Map<string, Promise<void>>()
const activeSessions = new Map<string, { sessionId: string; gameId: string; startTime: number }>()
// 启动时缓存的 playtime_seconds，避免退出时在 update 之前重复 DB 读
const sessionPlaytimeCache = new Map<string, number>()
// 游戏进程逃逸检测：启动器退出后跟踪实际游戏可执行文件路径
const gameExePaths = new Map<string, string>()
// 后台监控定时器（替代前端轮询）
const monitorTimers = new Map<string, ReturnType<typeof setInterval>>()
// 监控元数据：sessionId + trackPlaytime，供监控定时器清理时使用
const monitorMeta = new Map<string, { sessionId: string | null; trackPlaytime: boolean }>()
let magpieProcess: ChildProcess | null = null

export function isGameRunning(gameId: string): boolean {
  const proc = activeProcesses.get(gameId)
  return proc !== undefined && proc.exitCode === null
}

// 提取：统一的游戏退出处理（含 playtime 累计 + IPC 推送）
function handleGameExit(gameId: string, sessionId: string | null, trackPlaytime: boolean): void {
  if (!activeProcesses.has(gameId)) return

  activeProcesses.delete(gameId)
  gameExePaths.delete(gameId)
  monitorMeta.delete(gameId)

  const timer = monitorTimers.get(gameId)
  if (timer) {
    clearInterval(timer)
    monitorTimers.delete(gameId)
  }

  const sessionEntry = activeSessions.get(gameId)
  activeSessions.delete(gameId)

  const initialPlaytime = sessionPlaytimeCache.get(gameId) ?? 0
  sessionPlaytimeCache.delete(gameId)

  if (sessionId && trackPlaytime) {
    sessionOps.end(sessionId)
    const sessionDuration = sessionEntry?.startTime
      ? Math.floor((Date.now() - sessionEntry.startTime) / 1000)
      : 0
    const totalSeconds = initialPlaytime + sessionDuration
    gameOps.update(gameId, {
      playtime_seconds: totalSeconds,
      last_played: new Date().toISOString()
    })
    const updatedGame = gameOps.getById(gameId)
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0 && updatedGame) {
      wins[0].webContents.send('game:updated', {
        ...updatedGame,
        playtime_seconds: totalSeconds,
        last_played: new Date().toISOString()
      } as GameRecord)
    }
  } else {
    gameOps.update(gameId, { last_played: new Date().toISOString() })
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      const updated = gameOps.getById(gameId)
      if (updated) {
        wins[0].webContents.send('game:updated', updated)
      }
    }
  }
}

// 启动后台监控循环（10s 间隔），替代前端 setInterval 轮询
function startMonitor(gameId: string): void {
  if (monitorTimers.has(gameId)) return
  const timer = setInterval(async () => {
    const proc = activeProcesses.get(gameId)
    if (!proc) {
      clearInterval(timer)
      monitorTimers.delete(gameId)
      return
    }
    if (proc.exitCode !== null) {
      // 进程已退出，检查逃逸：游戏可执行文件是否仍在运行
      const meta = monitorMeta.get(gameId)
      const exePath = gameExePaths.get(gameId)
      if (meta && exePath) {
        const running = await isProcessRunning(path.basename(exePath))
        if (!running) {
          // 游戏确已退出（逃逸场景下的最终清理）
          handleGameExit(gameId, meta.sessionId, meta.trackPlaytime)
        }
      } else {
        // 无逃逸检测所需信息，直接清理
        handleGameExit(gameId, meta?.sessionId ?? null, meta?.trackPlaytime ?? false)
      }
    }
  }, 10000)
  monitorTimers.set(gameId, timer)
}

function isProcessRunning(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(
      'tasklist',
      ['/FI', `IMAGENAME eq ${name}`, '/NH'],
      { windowsHide: true },
      (err, stdout) => {
        if (err) {
          resolve(false)
          return
        }
        resolve(stdout.toLowerCase().includes(name.toLowerCase()))
      }
    )
  })
}

const magpieHelperScript = [
  'Add-Type -TypeDefinition @"',
  'using System;',
  'using System.Runtime.InteropServices;',
  'public class MagpieHelper {',
  '    [DllImport("user32.dll")]',
  '    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, System.UIntPtr dwExtraInfo);',
  '    public static void SendKeys(byte vk1, byte vk2, byte vk3) {',
  '        keybd_event(vk1, 0, 0, UIntPtr.Zero);',
  '        keybd_event(vk2, 0, 0, UIntPtr.Zero);',
  '        keybd_event(vk3, 0, 0, UIntPtr.Zero);',
  '        keybd_event(vk3, 0, 2, UIntPtr.Zero);',
  '        keybd_event(vk2, 0, 2, UIntPtr.Zero);',
  '        keybd_event(vk1, 0, 2, UIntPtr.Zero);',
  '    }',
  '}',
  '"@'
].join('\n')

function sendMagpieHotkey(delayMs = 3000, hotkey: 'fullscreen' | 'windowed' = 'fullscreen'): void {
  const keys = hotkey === 'fullscreen' ? '0x12, 0x10, 0x41' : '0x12, 0x10, 0x51'
  const script = `${magpieHelperScript}\nStart-Sleep -Milliseconds ${delayMs}\n[MagpieHelper]::SendKeys(${keys})`
  const encoded = Buffer.from(script, 'utf16le').toString('base64')

  exec(
    `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
    { windowsHide: true },
    (_err, _stdout, stderr) => {
      if (stderr) console.error('[Magpie]', stderr.trim())
    }
  )
}

export async function launchGame(gameId: string, modes: LaunchMode[]): Promise<void> {
  if (launchLocks.has(gameId)) {
    await launchLocks.get(gameId)
    return
  }

  let resolveLock: () => void
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve
  })
  launchLocks.set(gameId, lockPromise)

  try {
    const game = gameOps.getById(gameId)
    if (!game) throw new Error(`Game not found: ${gameId}`)

    if (!game.executable_path) throw new Error('游戏未设置可执行文件路径')

    if (isGameRunning(gameId)) throw new Error('游戏已在运行中')

    const trackPlaytime = getConfig('trackPlaytime')
    const magpiePath = getConfig('magpiePath')
    const autoLaunchMagpie = getConfig('autoLaunchMagpie')
    const magpieHotkey = getConfig('magpieHotkey')
    const magpieDelay = getConfig('magpieDelay')
    const gameDir = path.dirname(game.executable_path)

    const useLE = modes.includes('le')
    const useMagpie = modes.includes('magpie')

    let cmd: string
    let args: string[]

    if (useLE) {
      const lePath = getLeProcPath()
      if (!existsSync(lePath)) throw new Error(`LEProc.exe 未找到：${lePath}，请确认程序已正确安装`)
      cmd = lePath
      args = [game.executable_path]
    } else {
      cmd = game.executable_path
      args = []
    }

    if (useMagpie) {
      if (!magpiePath) throw new Error('请先在设置中配置 Magpie 路径')
      if (autoLaunchMagpie) {
        const running = await isProcessRunning('Magpie.exe')
        if (!running) {
          magpieProcess = spawn(magpiePath, ['-t'], {
            detached: true,
            stdio: 'ignore'
          })
          magpieProcess.unref()
          magpieProcess.on('exit', () => {
            magpieProcess = null
          })
        }
      }
    }

    let sessionId: string | null = null

    const db = getDatabase()
    const initTxn = db.transaction(() => {
      if (trackPlaytime) {
        sessionOps.endActiveSessionsForGame(gameId)
        const session = sessionOps.start(gameId)
        sessionId = session.id
        activeSessions.set(gameId, { sessionId: session.id, gameId, startTime: session.start_time })
      }
      gameOps.update(gameId, { last_launch_method: modes.join(',') })
    })
    initTxn()

    // 缓存当前 playtime_seconds，游戏退出时直接累加
    sessionPlaytimeCache.set(gameId, game.playtime_seconds || 0)

    const proc = spawn(cmd, args, {
      cwd: gameDir,
      detached: false,
      stdio: 'ignore'
    })

    gameExePaths.set(gameId, game.executable_path)
    monitorMeta.set(gameId, { sessionId, trackPlaytime })
    activeProcesses.set(gameId, proc)

    // 推送游戏启动事件（前端立即响应）
    const launchWins = BrowserWindow.getAllWindows()
    if (launchWins.length > 0) {
      launchWins[0].webContents.send('game:running-started', gameId)
    }
    // 启动后台监控循环（替代前端 15s setInterval）
    startMonitor(gameId)

    if (useMagpie) {
      sendMagpieHotkey(magpieDelay, magpieHotkey)
    }

    proc.on('error', (err) => {
      console.error(`Failed to launch game ${gameId}:`, err.message)
      handleGameExit(gameId, sessionId, trackPlaytime)
    })

    proc.on('close', async () => {
      // 检查进程逃逸：启动器进程退出时，实际游戏 exe 可能仍在运行
      const exePath = gameExePaths.get(gameId)
      if (exePath) {
        const stillRunning = await isProcessRunning(path.basename(exePath))
        if (stillRunning) {
          // 逃逸场景：启动器已退，但游戏仍在运行
          // 不清除，由监控循环（startMonitor）持续检查并最终清理
          return
        }
      }
      // 正常退出或逃逸检测无结果：立即清理
      handleGameExit(gameId, sessionId, trackPlaytime)
    })
  } finally {
    launchLocks.delete(gameId)
    resolveLock!()
  }
}

export function stopGame(gameId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = activeProcesses.get(gameId)
    if (!proc || proc.exitCode !== null) {
      resolve()
      return
    }

    const pid = proc.pid
    if (!pid || process.platform !== 'win32') {
      proc.kill('SIGTERM')
      resolve()
      return
    }

    execFile('taskkill', ['/f', '/t', '/pid', String(pid)], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function endAllActiveSessions(): Promise<void> {
  const now = Date.now()
  for (const [, entry] of activeSessions) {
    sessionOps.end(entry.sessionId)
    const sessionDuration = Math.floor((now - entry.startTime) / 1000)
    const game = gameOps.getById(entry.gameId)
    const totalSeconds = (game?.playtime_seconds || 0) + sessionDuration
    gameOps.update(entry.gameId, {
      playtime_seconds: totalSeconds,
      last_played: new Date().toISOString()
    })
  }
  activeSessions.clear()
  sessionPlaytimeCache.clear()
  // 清理所有监控定时器及辅助跟踪
  for (const [, timer] of monitorTimers) clearInterval(timer)
  monitorTimers.clear()
  gameExePaths.clear()
  monitorMeta.clear()
}

export function killMagpieIfLaunched(): Promise<void> {
  const proc = magpieProcess
  if (proc && proc.pid) {
    return new Promise((resolve) => {
      execFile('taskkill', ['/F', '/T', '/PID', String(proc.pid)], () => {
        magpieProcess = null
        resolve()
      })
    })
  }
  return Promise.resolve()
}
