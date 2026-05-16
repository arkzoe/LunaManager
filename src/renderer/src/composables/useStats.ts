import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { PlaySession } from '../../../shared/types'
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

export function useStats() {
  const store = useGameStore()

  const allStats = ref<AggregatedStat[]>([])
  const totalSessionCount = ref(0)
  const allSessions = ref<PlaySession[]>([])

  const libraryStats = computed<LibraryStats>(() => {
    const totalGames = store.allGames.length
    let totalMs = 0
    for (const s of allStats.value) totalMs += s.total_duration
    const totalHours = Math.floor(totalMs / 3600000) || 0
    const completedGames = store.allGames.filter((g) => g.status === 'played').length
    return {
      totalGames,
      totalHours,
      completedGames,
      avgPerDay: totalGames > 0 ? Math.round(totalHours / Math.max(totalGames, 1)) : 0
    }
  })

  const rankings = computed<RankingItem[]>(() => {
    const gameMap = new Map(store.allGames.map((g) => [g.id, g]))
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

  const loadStats = async (): Promise<void> => {
    if (store.games.length === 0) await store.loadGames()
    const [stats, count, sessions] = await Promise.all([
      window.api.getAllAggregatedStats(),
      window.api.getTotalSessionCount(),
      window.api.getAllSessions()
    ])
    allStats.value = stats
    totalSessionCount.value = count
    allSessions.value = sessions
  }

  return { allStats, totalSessionCount, allSessions, libraryStats, rankings, topGame, loadStats }
}
