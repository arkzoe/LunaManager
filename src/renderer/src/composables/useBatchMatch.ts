import { ref, computed, type Ref } from 'vue'
import type { SearchResult, ImportRowState } from '../../../shared/types'
import { useTokenCache } from './useTokenCache'
import { fillGameFromDetail } from './useMetadata'

export interface UseBatchMatchReturn {
  searchingRow: Ref<string>
  searchSource: Ref<string>
  showSearchInput: Ref<boolean>
  searchInputFolder: Ref<string>
  searchInputQuery: Ref<string>
  isMatchingAll: Ref<boolean>
  unmatchedCount: Ref<number>
  invalidateTokenCache: () => void
  ensureTokenCache: () => Promise<{
    source: string
    token: string | null
    vndbToken: string | null
    bangumiToken: string | null
  }>
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
    const { bangumiToken, vndbToken } = await ensureTokenCache()

    row.matchStatus = 'matched'
    row.title = result.titleCn || result.title || row.title
    if (result.source === 'vndb') row.vndbId = result.id
    if (result.source === 'bangumi') row.bangumiId = result.id
    if (result.cover) row.cover = result.cover
    if (result.date) row.releaseDate = result.date
    searchSource.value = result.source

    if (result.id) {
      const fetchToken = result.source === 'bangumi' ? bangumiToken : vndbToken
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

  // 批量匹配改为单次 IPC 调用（主进程完成搜索 + 模糊匹配 + 详情获取）
  const handleMatchAll = async (): Promise<void> => {
    const toMatch = rows.value.filter(
      (r) => r.selected && r.selectedExe && !r.isDuplicate && !r.vndbId && !r.bangumiId
    )
    if (toMatch.length === 0) return

    isMatchingAll.value = true
    error.value = ''
    matchAllAbortController = new AbortController()

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

      // 标记所有行为「搜索中」
      for (const row of toMatch) row.matchStatus = 'searching'

      // 单次 IPC：主进程完成搜索 + 模糊匹配 + 详情获取
      const queryRows = toMatch.map((r) => ({
        query: r.title || r.folderName,
        title: r.title,
        folderName: r.folderName
      }))
      const matched = await window.api.batchMatch({
        rows: queryRows,
        source,
        vndbToken: vndbToken || undefined,
        bangumiToken: bangumiToken || undefined
      })

      // 将结果映射回 ImportRowState
      const rowByQuery = new Map(toMatch.map((r) => [r.title || r.folderName, r]))
      let matchFailedCount = 0

      for (const m of matched) {
        const row = rowByQuery.get(m.query)
        if (!row) continue

        if (m.bangumiId || m.vndbId) {
          row.title = m.title || row.title
          if (m.vndbId) row.vndbId = m.vndbId
          if (m.bangumiId) row.bangumiId = m.bangumiId
          if (m.cover) row.cover = m.cover
          if (m.releaseDate) row.releaseDate = m.releaseDate
          if (m.developer) row.developer = m.developer
          if (m.description) row.description = m.description
          if (m.customTags) row.customTags = m.customTags
          row.matchStatus = 'matched'
        } else {
          row.matchStatus = 'noresult'
          matchFailedCount++
        }
      }

      if (matchFailedCount > 0) {
        error.value = `${matchFailedCount} 个游戏匹配失败，可手动搜索`
      }
    } catch {
      error.value = '批量匹配请求失败，请检查网络后重试'
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
