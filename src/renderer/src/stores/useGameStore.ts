import { shallowRef, ref } from 'vue'
import { defineStore } from 'pinia'
import type { GameRecord } from '../../../shared/types'

export const useGameStore = defineStore('games', () => {
  const games = shallowRef<GameRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
    if (idx !== -1) {
      const copy = [...games.value]
      copy[idx] = { ...copy[idx], ...updates, updated_at: Date.now() }
      games.value = copy
    }
  }

  const refreshGame = (updated: GameRecord): void => {
    const idx = games.value.findIndex((g) => g.id === updated.id)
    if (idx !== -1) {
      const copy = [...games.value]
      copy[idx] = updated
      games.value = copy
    }
  }

  const deleteGame = async (id: string): Promise<void> => {
    await window.api.deleteGame(id)
    const idx = games.value.findIndex((g) => g.id === id)
    if (idx !== -1) {
      const copy = [...games.value]
      copy.splice(idx, 1)
      games.value = copy
    }
  }

  return {
    games,
    isLoading,
    error,
    loadGames,
    updateGame,
    refreshGame,
    deleteGame
  }
})
