import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { BatchScanResult, ImportRowState } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'

export interface UseBatchScanReturn {
  isLoading: Ref<boolean>
  scanResult: Ref<BatchScanResult | null>
  rows: Ref<ImportRowState[]>
  importedCount: Ref<number>
  error: Ref<string>
  sortKey: Ref<'name' | 'size'>
  sortDir: Ref<'asc' | 'desc'>
  sortedRows: ComputedRef<ImportRowState[]>
  toggleSort: (key: 'name' | 'size') => void
  selectedCount: ComputedRef<number>
  skipCount: ComputedRef<number>
  totalCount: ComputedRef<number>
  allSelectableCount: ComputedRef<number>
  selectedSelectableCount: ComputedRef<number>
  isAllSelected: ComputedRef<boolean>
  handleSelectAll: (checked: boolean) => void
  handlePickFolder: (invalidateCache: () => void) => Promise<void>
  reset: () => void
}

const matchStatusOrder: Record<string, number> = {
  matched: 0,
  noresult: 1,
  searching: 2,
  idle: 3
}

export function useBatchScan(): UseBatchScanReturn {
  const store = useGameStore()

  const isLoading = ref(false)
  const scanResult = ref<BatchScanResult | null>(null)
  const error = ref('')
  const importedCount = ref(0)
  const rows = ref<ImportRowState[]>([])

  const sortKey = ref<'name' | 'size'>('name')
  const sortDir = ref<'asc' | 'desc'>('asc')

  const existingPaths = computed(() => new Set(store.games.map((g) => g.executable_path)))

  const sortedRows = computed(() => {
    const arr = [...rows.value]
    arr.sort((a, b) => {
      const ma = matchStatusOrder[a.matchStatus ?? 'idle'] ?? 3
      const mb = matchStatusOrder[b.matchStatus ?? 'idle'] ?? 3
      if (ma !== mb) return ma - mb
      let cmp = 0
      if (sortKey.value === 'name') {
        cmp = (a.title || a.folderName).localeCompare(b.title || b.folderName)
      } else {
        cmp = a.totalSize.localeCompare(b.totalSize, undefined, { numeric: true })
      }
      return sortDir.value === 'asc' ? cmp : -cmp
    })
    return arr
  })

  const toggleSort = (key: 'name' | 'size'): void => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const selectedCount = computed(
    () => rows.value.filter((r) => r.selected && r.selectedExe && !r.isDuplicate).length
  )
  const skipCount = computed(() => rows.value.filter((r) => r.isDuplicate).length)
  const totalCount = computed(() => rows.value.length)
  const allSelectableCount = computed(
    () => rows.value.filter((r) => r.selectedExe && !r.isDuplicate).length
  )
  const selectedSelectableCount = computed(
    () => rows.value.filter((r) => r.selected && r.selectedExe && !r.isDuplicate).length
  )
  const isAllSelected = computed(
    () => allSelectableCount.value > 0 && selectedSelectableCount.value === allSelectableCount.value
  )

  const handleSelectAll = (checked: boolean): void => {
    rows.value.forEach((r) => {
      if (r.selectedExe && !r.isDuplicate) {
        r.selected = checked
      }
    })
  }

  const handlePickFolder = async (invalidateCache: () => void): Promise<void> => {
    invalidateCache()
    isLoading.value = true
    error.value = ''
    importedCount.value = 0
    try {
      const result = await window.api.pickBatchImportFolder()
      if (!result) {
        isLoading.value = false
        return
      }
      scanResult.value = result
      const paths = existingPaths.value
      const EXCLUDE_EXE = ['update', 'unitycrashhandler', 'custom']
      rows.value = result.items.map((item) => {
        const filtered = item.executables.filter(
          (e) => !EXCLUDE_EXE.includes(e.name.toLowerCase().replace(/\.exe$/i, ''))
        )
        const hasDuplicate = filtered.some((e) => paths.has(e.fullPath))
        return {
          ...item,
          executables: filtered,
          selected: filtered.length > 0 && !hasDuplicate,
          title: item.folderName,
          selectedExe: filtered.length > 0 ? filtered[0].fullPath : '',
          isDuplicate: hasDuplicate,
          vndbId: '',
          bangumiId: '',
          cover: '',
          rating: 0,
          developer: '',
          publisher: '',
          releaseDate: '',
          description: '',
          customTags: '[]',
          savePath: '',
          matchStatus: 'idle' as const,
          importStatus: 'idle' as const,
          importMessage: ''
        }
      })
    } catch (e: unknown) {
      error.value = (e instanceof Error ? e.message : String(e)) || '选择文件夹失败'
    } finally {
      isLoading.value = false
    }
  }

  const reset = (): void => {
    scanResult.value = null
    rows.value = []
    error.value = ''
    importedCount.value = 0
    sortKey.value = 'name'
    sortDir.value = 'asc'
  }

  return {
    isLoading,
    scanResult,
    rows,
    importedCount,
    error,
    sortKey,
    sortDir,
    sortedRows,
    toggleSort,
    selectedCount,
    skipCount,
    totalCount,
    allSelectableCount,
    selectedSelectableCount,
    isAllSelected,
    handleSelectAll,
    handlePickFolder,
    reset
  }
}
