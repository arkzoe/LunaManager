import { spawn, execFile, type ChildProcess } from 'child_process'
import path from 'path'
import { getConfig } from '../config/store'
import { getLeProcPath } from '../config/paths'
import { sessionOps, gameOps, getDatabase } from '../database'
import type { LaunchMode } from '../../shared/types'

const activeProcesses = new Map<string, ChildProcess>()
const launchLocks = new Map<string, Promise<void>>()

export function isGameRunning(gameId: string): boolean {
  const proc = activeProcesses.get(gameId)
  return proc !== undefined && proc.exitCode === null
}

export async function launchGame(gameId: string, mode: LaunchMode): Promise<void> {
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
    const gameDir = path.dirname(game.executable_path)

    let cmd: string
    let args: string[]

    switch (mode) {
      case 'le':
        cmd = getLeProcPath()
        args = [game.executable_path]
        break
      case 'magpie':
        if (!magpiePath) throw new Error('请先在设置中配置 Magpie 路径')
        cmd = magpiePath
        args = [game.executable_path]
        break
      case 'normal':
      default:
        cmd = game.executable_path
        args = []
        break
    }

    let sessionId: string | null = null

    const db = getDatabase()
    const initTxn = db.transaction(() => {
      if (trackPlaytime) {
        const session = sessionOps.start(gameId)
        sessionId = session.id
      }
      gameOps.update(gameId, { last_launch_method: mode })
    })
    initTxn()

    const proc = spawn(cmd, args, {
      cwd: gameDir,
      detached: false,
      stdio: 'ignore'
    })

    activeProcesses.set(gameId, proc)

    proc.on('error', (err) => {
      activeProcesses.delete(gameId)
      if (sessionId) {
        sessionOps.end(sessionId)
      }
      console.error(`Failed to launch game ${gameId}:`, err.message)
    })

    proc.on('close', () => {
      activeProcesses.delete(gameId)

      if (sessionId && trackPlaytime) {
        sessionOps.end(sessionId)
        const totalDurationMs = sessionOps.getTotalPlaytime(gameId)
        const totalSeconds = Math.floor(totalDurationMs / 1000)
        gameOps.update(gameId, {
          playtime_seconds: totalSeconds,
          last_played: new Date().toISOString()
        })
      } else {
        gameOps.update(gameId, {
          last_played: new Date().toISOString()
        })
      }
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
