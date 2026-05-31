import { shallowRef, ref, computed, onUnmounted } from 'vue'
import type { RankingItem } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'

interface AggregatedStat {
  game_id: string
  total_sessions: number
  total_duration: number
  last_played: number | null
}

export interface LibraryStats {
  totalGames: number
  totalHours: number
  completedGames: number
  avgPerDay: number
}

export function useStats() {
  const store = useGameStore()

  const allStats = shallowRef<AggregatedStat[]>([])
  const totalSessionCount = ref(0)

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

  let unmounted = false
  onUnmounted(() => {
    unmounted = true
  })
  const loadStats = async (recordHistory = true): Promise<void> => {
    if (store.games.length === 0) await store.loadGames()
    if (unmounted) return
    if (!recordHistory) {
      allStats.value = []
      totalSessionCount.value = 0
      return
    }
    const stats = await window.api.getAllAggregatedStats()
    if (unmounted) return
    allStats.value = stats
    totalSessionCount.value = stats.length
  }

  // 排行通过 IPC getRankings 获取，后端 SQL 聚合
  const loadRankings = async (cutoff?: number): Promise<RankingItem[]> => {
    return window.api.getRankings({ cutoff, limit: 10 })
  }

  return { allStats, totalSessionCount, libraryStats, loadStats, loadRankings }
}
