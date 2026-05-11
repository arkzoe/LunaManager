import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface Game {
  id: string
  title: string
  cover: string
  category: string
  rating: number
  size: string
  installed: boolean
  favorite: boolean
  lastPlayed?: string
  description?: string
  developer?: string
  publisher?: string
  releaseDate?: string
  playtime?: string
  executablePath?: string
  savePath?: string
  createdAt: number
  updatedAt: number
}

export const useGameStore = defineStore('games', () => {
  // State
  const games = ref<Game[]>([])
  const selectedGameId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const allGames = computed(() => games.value)
  
  const installedGames = computed(() => 
    games.value.filter(g => g.installed)
  )
  
  const favoriteGames = computed(() => 
    games.value.filter(g => g.favorite)
  )
  
  const selectedGame = computed(() => 
    games.value.find(g => g.id === selectedGameId.value) || null
  )

  const gamesByCategory = computed(() => {
    const categories: Record<string, Game[]> = {}
    games.value.forEach(game => {
      if (!categories[game.category]) {
        categories[game.category] = []
      }
      categories[game.category].push(game)
    })
    return categories
  })

  const recentlyPlayed = computed(() => 
    games.value
      .filter(g => g.lastPlayed && g.installed)
      .sort((a, b) => {
        const order = ['天前', '周前', '月前']
        const getPriority = (str: string | undefined): number => {
          if (!str) return 999
          for (let i = 0; i < order.length; i++) {
            if (str.includes(order[i])) return i
          }
          return 999
        }
        return getPriority(a.lastPlayed) - getPriority(b.lastPlayed)
      })
      .slice(0, 5)
  )

  const totalPlaytimeMinutes = computed(() => {
    let total = 0
    games.value.forEach((game) => {
      if (game.playtime && game.playtime !== '未知') {
        const match = game.playtime.match(/(\d+)/)
        if (match) {
          total += parseInt(match[1]) * 60
        }
      }
    })
    return total
  })

  // Actions
  const setGames = (newGames: Game[]): void => {
    games.value = newGames
  }

  const addGame = (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): void => {
    const newGame: Game = {
      ...game,
      id: `game-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    games.value.push(newGame)
  }

  const updateGame = (id: string, updates: Partial<Game>): void => {
    const index = games.value.findIndex(g => g.id === id)
    if (index !== -1) {
      games.value[index] = {
        ...games.value[index],
        ...updates,
        updatedAt: Date.now()
      }
    }
  }

  const deleteGame = (id: string): void => {
    const index = games.value.findIndex(g => g.id === id)
    if (index !== -1) {
      games.value.splice(index, 1)
    }
  }

  const selectGame = (id: string | null): void => {
    selectedGameId.value = id
  }

  const toggleFavorite = (id: string): void => {
    const game = games.value.find(g => g.id === id)
    if (game) {
      game.favorite = !game.favorite
      game.updatedAt = Date.now()
    }
  }

  const setLoading = (loading: boolean): void => {
    isLoading.value = loading
  }

  const setError = (err: string | null): void => {
    error.value = err
  }

  // Search and filter
  const searchGames = (query: string): Game[] => {
    const lowerQuery = query.toLowerCase()
    return games.value.filter(game =>
      game.title.toLowerCase().includes(lowerQuery) ||
      game.category.toLowerCase().includes(lowerQuery) ||
      (game.developer && game.developer.toLowerCase().includes(lowerQuery))
    )
  }

  return {
    // State
    games,
    selectedGameId,
    isLoading,
    error,
    // Getters
    allGames,
    installedGames,
    favoriteGames,
    selectedGame,
    gamesByCategory,
    recentlyPlayed,
    totalPlaytimeMinutes,
    // Actions
    setGames,
    addGame,
    updateGame,
    deleteGame,
    selectGame,
    toggleFavorite,
    setLoading,
    setError,
    searchGames
  }
})
