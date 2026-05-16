import { ref, computed, type Ref } from 'vue'
import type { SearchResult, ImportRowState } from '../../../shared/types'
import { useTokenCache } from './useTokenCache'
import { fillGameFromDetail } from './useMetadata'

export interface UseBatchMatchReturn {
  searchingRow: Ref<string>
  searchSource: Ref<'vndb' | 'bangumi'>
  showSearchInput: Ref<boolean>
  searchInputFolder: Ref<string>
  searchInputQuery: Ref<string>
  isMatchingAll: Ref<boolean>
  unmatchedCount: Ref<number>
  invalidateTokenCache: () => void
  ensureTokenCache: () => Promise<{ source: 'vndb' | 'bangumi'; token: string | null }>
  handleSearchRow: (folderPath: string) => void
  handleSearchInputSelect: (result: SearchResult) => Promise<void>
  handleSearchInputClose: () => void
  handleMatchAll: () => Promise<void>
  handleCancelMatchAll: () => void
}

export function useBatchMatch(
  rows: Ref<ImportRowState[]>,
  error: Ref<string>
): UseBatchMatchReturn {
  const { ensureTokenCache, invalidateTokenCache } = useTokenCache()

  const searchingRow = ref('')
  const searchSource = ref<'vndb' | 'bangumi'>('vndb')
  const showSearchInput = ref(false)
  const searchInputFolder = ref('')
  const searchInputQuery = ref('')

  const isMatchingAll = ref(false)
  let matchAllAbortController: AbortController | null = null

  const unmatchedCount = computed(() =>
    rows.value.filter(
      (r) => r.selected && r.selectedExe && !r.isDuplicate && !r.vndbId && !r.bangumiId
    ).length
  )

  const handleSearchRow = (folderPath: string): void => {
    const row = rows.value.find((r) => r.folderPath === folderPath)
    if (!row) return
    searchInputFolder.value = folderPath
    searchInputQuery.value = row.title || row.folderName
    showSearchInput.value = true
  }

  const handleSearchInputSelect = async (result: SearchResult): Promise<void> => {
    showSearchInput.value = false
    const row = rows.value.find((r) => r.folderPath === searchInputFolder.value)
    if (!row) return

    row.matchStatus = 'matched'
    row.title = result.titleCn || result.title || row.title
    if (result.source === 'vndb') row.vndbId = result.id
    if (result.source === 'bangumi') row.bangumiId = result.id
    if (result.cover) row.cover = result.cover
    if (result.rating) row.rating = result.rating
    if (result.date) row.releaseDate = result.date
    searchSource.value = result.source

    if (result.id) {
      const fetchToken =
        result.source === 'bangumi'
          ? await window.api.getConfig('bangumiToken')
          : await window.api.getConfig('vndbApiKey')
      try {
        const detail = await window.api.fetchMetadataDetail(
          result.id,
          result.source,
          fetchToken || undefined,
          undefined
        )
        fillGameFromDetail(detail, row)
      } catch (err) {
        console.error('获取元数据详情失败:', err)
      }
    }
  }

  const handleSearchInputClose = (): void => {
    showSearchInput.value = false
    const row = rows.value.find((r) => r.folderPath === searchInputFolder.value)
    if (row) row.matchStatus = 'idle'
  }

  const handleMatchAll = async (): Promise<void> => {
    const toMatch = rows.value.filter(
      (r) => r.selected && r.selectedExe && !r.isDuplicate && !r.vndbId && !r.bangumiId
    )
    if (toMatch.length === 0) return

    isMatchingAll.value = true
    error.value = ''
    matchAllAbortController = new AbortController()
    const { signal } = matchAllAbortController

    try {
      const { source, token } = await ensureTokenCache()
      searchSource.value = source

      if (source === 'bangumi' && !token) {
        error.value = '请先在「设置 → 数据源」中配置 Bangumi Token'
        return
      }

      let matchFailedCount = 0

      for (let i = 0; i < toMatch.length; i++) {
        if (signal.aborted) break
        const row = toMatch[i]
        const query = row.title || row.folderName
        row.matchStatus = 'searching'

        try {
          const results = await window.api.searchMetadata(query, source, token || undefined)
          if (results.length > 0) {
            const best = results[0]
            row.title = best.titleCn || best.title || row.title
            if (best.source === 'vndb') row.vndbId = best.id
            if (best.source === 'bangumi') row.bangumiId = best.id
            if (best.cover) row.cover = best.cover
            if (best.rating) row.rating = best.rating
            if (best.date) row.releaseDate = best.date

            if (best.id) {
              try {
                const detail = await window.api.fetchMetadataDetail(
                  best.id,
                  best.source,
                  token || undefined,
                  undefined
                )
                fillGameFromDetail(detail, row)
              } catch {
                matchFailedCount++
              }
            }
            row.matchStatus = 'matched'
          } else {
            row.matchStatus = 'noresult'
            matchFailedCount++
          }
        } catch {
          row.matchStatus = 'noresult'
          matchFailedCount++
        }

        if (i < toMatch.length - 1 && !signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      if (matchFailedCount > 0 && !signal.aborted) {
        error.value = `${matchFailedCount} 个游戏匹配失败，可手动搜索`
      }
    } finally {
      isMatchingAll.value = false
      matchAllAbortController = null
    }
  }

  const handleCancelMatchAll = (): void => {
    matchAllAbortController?.abort()
    error.value = ''
  }

  return {
    searchingRow,
    searchSource,
    showSearchInput,
    searchInputFolder,
    searchInputQuery,
    isMatchingAll,
    unmatchedCount,
    invalidateTokenCache,
    ensureTokenCache,
    handleSearchRow,
    handleSearchInputSelect,
    handleSearchInputClose,
    handleMatchAll,
    handleCancelMatchAll
  }
}
