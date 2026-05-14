import { spawn, type ChildProcess } from 'child_process'
import path from 'path'
import { getConfig } from '../config/store'
import { sessionOps, gameOps } from '../database'
import type { LaunchMode } from '../../shared/types'

const activeProcesses = new Map<string, ChildProcess>()

function formatPlaytime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (hours < 24) return rem ? `${hours}小时${rem}分钟` : `${hours}小时`
  const days = Math.floor(hours / 24)
  const rh = hours % 24
  return rh ? `${days}天${rh}小时` : `${days}天`
}

export function isGameRunning(gameId: string): boolean {
  const proc = activeProcesses.get(gameId)
  return proc !== undefined && proc.exitCode === null
}

export function launchGame(gameId: string, mode: LaunchMode): void {
  const game = gameOps.getById(gameId)
  if (!game) throw new Error(`Game not found: ${gameId}`)

  if (!game.executable_path) throw new Error('游戏未设置可执行文件路径')

  if (isGameRunning(gameId)) throw new Error('游戏已在运行中')

  const cfg = {
    trackPlaytime: getConfig('trackPlaytime'),
    lePath: getConfig('lePath'),
    magpiePath: getConfig('magpiePath')
  }

  const gameDir = path.dirname(game.executable_path)

  let cmd: string
  let args: string[]

  switch (mode) {
    case 'le':
      if (!cfg.lePath) throw new Error('请先在设置中配置 Locale Emulator 路径')
      cmd = cfg.lePath
      args = [game.executable_path]
      break
    case 'magpie':
      if (!cfg.magpiePath) throw new Error('请先在设置中配置 Magpie 路径')
      cmd = cfg.magpiePath
      args = [game.executable_path]
      break
    case 'normal':
    default:
      cmd = game.executable_path
      args = []
      break
  }

  const trackPlaytime = cfg.trackPlaytime
  let sessionId: string | null = null

  if (trackPlaytime) {
    const session = sessionOps.start(gameId)
    sessionId = session.id
  }

  gameOps.update(gameId, { last_launch_method: mode })

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
      const totalMs = sessionOps.getTotalPlaytime(gameId)
      const totalSeconds = Math.floor(totalMs / 1000)
      gameOps.update(gameId, {
        playtime: formatPlaytime(totalSeconds),
        last_played: new Date().toISOString()
      })
    } else {
      gameOps.update(gameId, {
        last_played: new Date().toISOString()
      })
    }
  })
}
