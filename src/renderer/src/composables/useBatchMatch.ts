import { ref, computed, type Ref } from 'vue'
import type { SearchResult, ImportRowState } from '../../../shared/types'
import { useTokenCache } from './useTokenCache'
import { fillGameFromDetail } from './useMetadata'
import { pickBestMatch, REJECT_THRESHOLD } from '../utils/matcher'

export interface UseBatchMatchReturn {
  searchingRow: Ref<string>
  searchSource: Ref<string>
  showSearchInput: Ref<boolean>
  searchInputFolder: Ref<string>
  searchInputQuery: Ref<string>
  isMatchingAll: Ref<boolean>
  unmatchedCount: Ref<number>
  invalidateTokenCache: () => void
  ensureTokenCache: () => Promise<{ source: string; token: string | null; vndbToken: string | null; bangumiToken: string | null }>
  handleSearchRow: (folderPath: string) => void
  handleSearchInputSelect: (result: SearchResult) => Promise<void>
  handleSearchInputClose: () => void
  handleMatchAll: () => Promise<void>
  handleCancelMatchAll: () => void
  reset: () => void
}

export function useBatchMatch(
  rows: Ref<ImportRowState[]>,
  error: Ref<string>
): UseBatchMatchReturn {
  const { ensureTokenCache, invalidateTokenCache } = useTokenCache()

  const searchingRow = ref('')
  const searchSource = ref<string>('bangumi')
  const showSearchInput = ref(false)
  const searchInputFolder = ref('')
  const searchInputQuery = ref('')

  const isMatchingAll = ref(false)
  let matchAllAbortController: AbortController | null = null

  const unmatchedCount = computed(
    () =>
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
      const { source, token, vndbToken, bangumiToken } = await ensureTokenCache()
      searchSource.value = source

      if (source === 'mixed') {
        if (!bangumiToken && !vndbToken) {
          error.value = '请先在「设置 → 数据源」中配置至少一个数据源的 Token'
          return
        }
      } else if (source === 'bangumi' && !token) {
        error.value = '请先在「设置 → 数据源」中配置 Bangumi Token'
        return
      }

      let matchFailedCount = 0
      let sourceFailedOnce = false

      const processOne = async (row: ImportRowState): Promise<void> => {
        if (signal.aborted) return
        const query = row.title || row.folderName
        row.matchStatus = 'searching'

        try {
          let allResults: SearchResult[] = []
          if (source === 'mixed') {
            const tasks: Promise<SearchResult[]>[] = []
            if (vndbToken) tasks.push(window.api.searchMetadata(query, 'vndb', vndbToken || undefined))
            if (bangumiToken) tasks.push(window.api.searchMetadata(query, 'bangumi', bangumiToken || undefined))
            const settledResults = await Promise.allSettled(tasks)
            settledResults.forEach((r) => {
              if (r.status === 'fulfilled') {
                allResults.push(...r.value)
              } else {
                sourceFailedOnce = true
              }
            })
          } else {
            allResults = await window.api.searchMetadata(query, source as 'vndb' | 'bangumi', token || undefined)
          }

          const best = pickBestMatch(query, allResults, REJECT_THRESHOLD)
          if (best) {
            row.title = best.titleCn || best.title || row.title
            if (best.source === 'vndb') row.vndbId = best.id
            if (best.source === 'bangumi') row.bangumiId = best.id
            if (best.cover) row.cover = best.cover
            if (best.date) row.releaseDate = best.date

            if (best.id) {
              try {
                const fetchToken =
                  best.source === 'bangumi' ? bangumiToken || token : vndbToken || token
                const detail = await window.api.fetchMetadataDetail(
                  best.id,
                  best.source,
                  fetchToken || undefined,
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
      }

      // Concurrency pool of 4
      const concurrency = 4
      let idx = 0
      const workers: Promise<void>[] = []
      for (let i = 0; i < concurrency && i < toMatch.length; i++) {
        workers.push(
          (async () => {
            while (idx < toMatch.length && !signal.aborted) {
              const current = idx++
              await processOne(toMatch[current])
            }
          })()
        )
      }
      await Promise.allSettled(workers)

      if ((matchFailedCount > 0 || sourceFailedOnce) && !signal.aborted) {
        const msgs: string[] = []
        if (sourceFailedOnce) msgs.push('部分数据源请求失败，已自动使用可用的数据源')
        if (matchFailedCount > 0) msgs.push(`${matchFailedCount} 个游戏匹配失败，可手动搜索`)
        error.value = msgs.join('；')
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

  const reset = (): void => {
    searchingRow.value = ''
    showSearchInput.value = false
    searchInputFolder.value = ''
    searchInputQuery.value = ''
    isMatchingAll.value = false
    matchAllAbortController?.abort()
    matchAllAbortController = null
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
    handleCancelMatchAll,
    reset
  }
}
