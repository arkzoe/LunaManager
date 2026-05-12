import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GameRecord, GameStatus } from '../../../shared/types'

export const useGameStore = defineStore('games', () => {
  const games = ref<GameRecord[]>([])
  const selectedGameId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const allGames = computed(() => games.value)
  const installedGames = computed(() => games.value.filter(g => g.installed))
  const favoriteGames = computed(() => games.value.filter(g => g.favorite))
  const selectedGame = computed(() => games.value.find(g => g.id === selectedGameId.value) || null)

  const gamesByCategory = computed(() => {
    const map: Record<string, GameRecord[]> = {}
    games.value.forEach(g => {
      if (!map[g.category]) map[g.category] = []
      map[g.category].push(g)
    })
    return map
  })

  const recentlyPlayed = computed(() =>
    games.value.filter(g => g.last_played).sort((a, b) => (b.last_played || '').localeCompare(a.last_played || '')).slice(0, 5)
  )

  const totalPlaytimeMinutes = computed(() => {
    let total = 0
    games.value.forEach(g => {
      if (g.playtime && g.playtime !== '未知') {
        const m = g.playtime.match(/(\d+)/)
        if (m) total += parseInt(m[1]) * 60
      }
    })
    return total
  })

  // ===== Actions =====
  const loadGames = async (): Promise<void> => {
    isLoading.value = true
    error.value = null
    try {
      games.value = await window.api.getGames()
    } catch (e: any) {
      error.value = e.message || '加载游戏失败'
    } finally {
      isLoading.value = false
    }
  }

  const addGame = async (data: Omit<GameRecord, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    const game = await window.api.createGame(data as any)
    games.value.unshift(game)
  }

  const updateGame = async (id: string, updates: Partial<GameRecord>): Promise<void> => {
    await window.api.updateGame(id, updates)
    const idx = games.value.findIndex(g => g.id === id)
    if (idx !== -1) Object.assign(games.value[idx], updates, { updated_at: Date.now() })
  }

  const deleteGame = async (id: string): Promise<void> => {
    await window.api.deleteGame(id)
    games.value = games.value.filter(g => g.id !== id)
  }

  const searchGames = async (query: string): Promise<GameRecord[]> => {
    return window.api.searchGames(query)
  }

  const selectGame = (id: string | null): void => {
    selectedGameId.value = id
  }

  const toggleFavorite = async (id: string): Promise<void> => {
    const game = games.value.find(g => g.id === id)
    if (!game) return
    const next = game.favorite ? 0 : 1
    await window.api.updateGame(id, { favorite: next } as any)
    game.favorite = next
  }

  const setLoading = (v: boolean): void => { isLoading.value = v }
  const setError = (e: string | null): void => { error.value = e }

  return {
    games, selectedGameId, isLoading, error,
    allGames, installedGames, favoriteGames, selectedGame, gamesByCategory, recentlyPlayed, totalPlaytimeMinutes,
    loadGames, addGame, updateGame, deleteGame, searchGames, selectGame, toggleFavorite,
    setLoading, setError
  }
})
