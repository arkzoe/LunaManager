import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GameRecord } from '../../../shared/types'

export const useGameStore = defineStore('games', () => {
  const games = ref<GameRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const allGames = computed(() => games.value)

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

  const updateGame = async (id: string, updates: Partial<GameRecord>): Promise<void> => {
    await window.api.updateGame(id, updates)
    const idx = games.value.findIndex((g) => g.id === id)
    if (idx !== -1) Object.assign(games.value[idx], updates, { updated_at: Date.now() })
  }

  const refreshGame = (updated: GameRecord): void => {
    const idx = games.value.findIndex((g) => g.id === updated.id)
    if (idx !== -1) games.value[idx] = updated
  }

  const deleteGame = async (id: string): Promise<void> => {
    await window.api.deleteGame(id)
    games.value = games.value.filter((g) => g.id !== id)
  }

  return {
    games,
    isLoading,
    error,
    allGames,
    loadGames,
    updateGame,
    refreshGame,
    deleteGame
  }
})
