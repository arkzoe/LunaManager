import { shallowRef, ref, computed, onUnmounted } from 'vue'
import type { PlaySession, GameRecord } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import { formatPlaytime } from '../utils/format'

interface AggregatedStat {
  game_id: string
  total_sessions: number
  total_duration: number
  last_played: number | null
}

export interface RankingItem {
  rank: number
  title: string
  playtime: string
  cover: string
}

export interface LibraryStats {
  totalGames: number
  totalHours: number
  completedGames: number
  avgPerDay: number
}

export function computeRankings(
  sessions: PlaySession[],
  games: GameRecord[],
  cutoff?: number
): RankingItem[] {
  const gameMap = new Map(games.map((g) => [g.id, g]))
  const durationMap = new Map<string, number>()

  for (const s of sessions) {
    if (cutoff && s.start_time < cutoff) continue
    if (!s.duration || s.duration <= 0) continue
    durationMap.set(s.game_id, (durationMap.get(s.game_id) || 0) + s.duration)
  }

  const ranked = [...durationMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([gameId, totalMs], idx) => {
      const game = gameMap.get(gameId)
      return {
        rank: idx + 1,
        title: game ? game.title_cn || game.title : gameId,
        playtime: formatPlaytime(Math.floor(totalMs / 1000)),
        cover: game?.cover || ''
      }
    })

  if (ranked.length === 0) {
    return [
      { rank: 1, title: '-', playtime: '-', cover: '' },
      { rank: 2, title: '-', playtime: '-', cover: '' }
    ]
  }
  return ranked
}

export function useStats() {
  const store = useGameStore()

  const allStats = shallowRef<AggregatedStat[]>([])
  const totalSessionCount = ref(0)
  const allSessions = shallowRef<PlaySession[]>([])

  const libraryStats = computed<LibraryStats>(() => {
    const totalGames = store.games.length
    let totalMs = 0
    for (const s of allStats.value) totalMs += s.total_duration
    const totalHours = Math.floor(totalMs / 3600000) || 0
    const completedGames = store.games.filter((g) => g.status === 'played').length
    return {
      totalGames,
      totalHours,
      completedGames,
      avgPerDay: totalGames > 0 ? Math.round(totalHours / Math.max(totalGames, 1)) : 0
    }
  })

  const rankings = computed<RankingItem[]>(() => {
    const gameMap = new Map(store.games.map((g) => [g.id, g]))
    const ranked = allStats.value
      .filter((s) => s.total_duration > 0)
      .slice(0, 10)
      .map((s, idx) => {
        const game = gameMap.get(s.game_id)
        return {
          rank: idx + 1,
          title: game ? game.title_cn || game.title : s.game_id,
          playtime: formatPlaytime(Math.floor(s.total_duration / 1000)),
          cover: game?.cover || ''
        }
      })
    if (ranked.length === 0) {
      return [
        { rank: 1, title: '-', playtime: '-', cover: '' },
        { rank: 2, title: '-', playtime: '-', cover: '' }
      ]
    }
    return ranked
  })

  const topGame = computed(() => rankings.value[0])

  let unmounted = false
  onUnmounted(() => {
    unmounted = true
  })
  const loadStats = async (recordHistory = true): Promise<void> => {
    if (store.games.length === 0) await store.loadGames()
    if (unmounted) return
    if (!recordHistory) {
      allSessions.value = []
      allStats.value = []
      totalSessionCount.value = 0
      return
    }
    const sessions = await window.api.getAllSessions()
    if (unmounted) return
    allSessions.value = sessions
    totalSessionCount.value = sessions.length
    const stats = await window.api.getAllAggregatedStats()
    if (unmounted) return
    allStats.value = stats
  }

  return { allStats, totalSessionCount, allSessions, libraryStats, rankings, topGame, loadStats }
}
