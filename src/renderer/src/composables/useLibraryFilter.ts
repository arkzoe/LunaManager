import { ref, computed, watch, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { GameRecord, GameStatus } from '../../../shared/types'
import { STATUS_OPTIONS } from '../utils/constants'
import type { useGameStore } from '../stores/useGameStore'

type SortKey = 'name' | 'playtime' | 'rating' | 'last_played'

export const sortOptions = [
  { key: 'name' as const, label: '名称' },
  { key: 'playtime' as const, label: '时长' },
  { key: 'rating' as const, label: '评分' },
  { key: 'last_played' as const, label: '最后游玩' }
]

export const filters: { id: GameStatus | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  ...STATUS_OPTIONS.map((o) => ({ id: o.value as GameStatus, label: o.label }))
]

export const statusFilters = computed(() =>
  filters.filter((f): f is { id: GameStatus; label: string } => f.id !== 'all')
)

interface UseLibraryFilterReturn {
  searchQuery: Ref<string>
  debouncedSearch: Ref<string>
  activeFilter: Ref<GameStatus | 'all'>
  sortKey: Ref<SortKey>
  sortDir: Ref<'asc' | 'desc'>
  toggleSort: (key: SortKey) => void
  filteredGames: ShallowRef<GameRecord[]>
  filteredTotal: Ref<number>
  filterLoading: Ref<boolean>
  fetchFilteredGames: () => Promise<void>
  cleanup: () => void
}

export function useLibraryFilter(store: ReturnType<typeof useGameStore>): UseLibraryFilterReturn {
  const searchQuery = ref('')
  const debouncedSearch = ref('')
  const activeFilter = ref<GameStatus | 'all'>('all')
  const sortKey = ref<SortKey>('name')
  const sortDir = ref<'asc' | 'desc'>('asc')

  const toggleSort = (key: SortKey): void => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = key === 'name' ? 'asc' : 'desc'
    }
  }

  const filteredGames = shallowRef<GameRecord[]>([])
  const filteredTotal = ref(0)
  const filterLoading = ref(false)

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  let filterFetchTimer: ReturnType<typeof setTimeout> | null = null

  const fetchFilteredGames = async (): Promise<void> => {
    filterLoading.value = true
    try {
      const result = await window.api.getFilteredGames({
        status: activeFilter.value,
        search: debouncedSearch.value || undefined,
        sortKey: sortKey.value,
        sortDir: sortDir.value,
        limit: 200
      })
      filteredGames.value = result.items
      filteredTotal.value = result.total
    } catch {
      filteredGames.value = store.games
    } finally {
      filterLoading.value = false
    }
  }

  watch(searchQuery, (val) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      debouncedSearch.value = val
    }, 200)
  })

  watch([activeFilter, debouncedSearch, sortKey, sortDir], () => {
    if (filterFetchTimer) clearTimeout(filterFetchTimer)
    filterFetchTimer = setTimeout(() => fetchFilteredGames(), 100)
  })

  watch(
    () => store.games,
    () => {
      if (filterFetchTimer) clearTimeout(filterFetchTimer)
      filterFetchTimer = setTimeout(() => fetchFilteredGames(), 100)
    },
    { deep: false }
  )

  const cleanup = (): void => {
    if (searchTimer) clearTimeout(searchTimer)
    if (filterFetchTimer) clearTimeout(filterFetchTimer)
  }

  return {
    searchQuery,
    debouncedSearch,
    activeFilter,
    sortKey,
    sortDir,
    toggleSort,
    filteredGames,
    filteredTotal,
    filterLoading,
    fetchFilteredGames,
    cleanup
  }
}