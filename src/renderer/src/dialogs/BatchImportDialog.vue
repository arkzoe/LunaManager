<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  BatchScanResult,
  GameRecord,
  SearchResult,
  ImportRowState,
  ImportResult,
  ImportResultItem
} from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import BatchImportRow from './BatchImportRow.vue'
import SearchResultPicker from '../shared/SearchResultPicker.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', result: ImportResult): void
}>()

const store = useGameStore()
const isLoading = ref(false)
const isImporting = ref(false)
const scanResult = ref<BatchScanResult | null>(null)
const error = ref('')
const importedCount = ref(0)

// Token cache
let cachedSource: 'vndb' | 'bangumi' | null = null
let cachedToken: string | null = null

const invalidateTokenCache = (): void => {
  cachedSource = null
  cachedToken = null
}

const ensureTokenCache = async (): Promise<{
  source: 'vndb' | 'bangumi'
  token: string | null
}> => {
  if (cachedSource === null) {
    cachedSource = (await window.api.getConfig('metadataSource')) || 'vndb'
  }
  if (cachedToken === null) {
    cachedToken =
      cachedSource === 'bangumi'
        ? await window.api.getConfig('bangumiToken')
        : await window.api.getConfig('vndbApiKey')
  }
  return { source: cachedSource, token: cachedToken }
}

const rows = ref<ImportRowState[]>([])

// Search state
const searchingRow = ref('')
const searchResults = ref<SearchResult[]>([])
const showSearchPicker = ref(false)
const searchSource = ref<'vndb' | 'bangumi'>('vndb')
const activeRowFolder = ref('')

// Match-all state
const isMatchingAll = ref(false)
let matchAllAbortController: AbortController | null = null

// Import result state
const showResult = ref(false)
const importResult = ref<ImportResult | null>(null)

// Sort state
const sortKey = ref<'name' | 'size'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

const sortedRows = computed(() => {
  const arr = [...rows.value]
  arr.sort((a, b) => {
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

const existingPaths = computed(() => new Set(store.games.map((g) => g.executable_path)))

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

const unmatchedCount = computed(
  () =>
    rows.value.filter(
      (r) => r.selected && r.selectedExe && !r.isDuplicate && !r.vndbId && !r.bangumiId
    ).length
)

const handleSelectAll = (checked: boolean): void => {
  rows.value.forEach((r) => {
    if (r.selectedExe && !r.isDuplicate) {
      r.selected = checked
    }
  })
}

const handlePickFolder = async (): Promise<void> => {
  invalidateTokenCache()
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
    rows.value = result.items.map((item) => {
      const hasDuplicate = item.executables.some((e) => paths.has(e.fullPath))
      return {
        ...item,
        selected: item.executables.length > 0 && !hasDuplicate,
        title: item.folderName,
        selectedExe: item.executables.length > 0 ? item.executables[0].fullPath : '',
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
        savePath: ''
      }
    })
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '选择文件夹失败'
  } finally {
    isLoading.value = false
  }
}

const handleSearchRow = async (folderPath: string): Promise<void> => {
  if (searchingRow.value) return
  const row = rows.value.find((r) => r.folderPath === folderPath)
  if (!row) return

  const query = row.title || row.folderName
  if (!query) return

  searchingRow.value = folderPath
  error.value = ''
  try {
    const { source, token } = await ensureTokenCache()
    searchSource.value = source

    if (source === 'bangumi' && !token) {
      error.value = '请先在「设置 → 数据源」中配置 Bangumi Token'
      return
    }

    searchResults.value = await window.api.searchMetadata(query, source, token || undefined)
    if (searchResults.value.length > 0) {
      activeRowFolder.value = folderPath
      showSearchPicker.value = true
    }
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : String(err)) || '搜索失败'
  } finally {
    searchingRow.value = ''
  }
}

const handlePickerSelect = async (result: SearchResult): Promise<void> => {
  showSearchPicker.value = false
  const row = rows.value.find((r) => r.folderPath === activeRowFolder.value)
  if (!row) return

  row.title = result.titleCn || result.title || row.title
  if (result.source === 'vndb') row.vndbId = result.id
  if (result.source === 'bangumi') row.bangumiId = result.id
  if (result.cover) row.cover = result.cover
  if (result.rating) row.rating = result.rating
  if (result.date) row.releaseDate = result.date
  searchSource.value = result.source

  if (result.id) {
    try {
      const { token } = await ensureTokenCache()
      const detail = await window.api.fetchMetadataDetail(
        result.id,
        result.source,
        token || undefined,
        undefined
      )
      if (detail.developer) row.developer = detail.developer
      if (detail.publisher) row.publisher = detail.publisher
      if (detail.release_date) row.releaseDate = detail.release_date
      if (detail.rating) row.rating = detail.rating
      if (detail.title) row.title = detail.title_cn || detail.title || row.title
      if (detail.title_cn) row.title = detail.title_cn || row.title
      if (detail.description) row.description = detail.description
      if (detail.custom_tags) row.customTags = detail.custom_tags
      if (detail.cover) row.cover = detail.cover
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('获取元数据详情失败:', msg)
    }
  }
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
              if (detail.developer) row.developer = detail.developer
              if (detail.publisher) row.publisher = detail.publisher
              if (detail.release_date) row.releaseDate = detail.release_date
              if (detail.rating) row.rating = detail.rating
              if (detail.title) row.title = detail.title_cn || detail.title || row.title
              if (detail.title_cn) row.title = detail.title_cn || row.title
              if (detail.description) row.description = detail.description
              if (detail.custom_tags) row.customTags = detail.custom_tags
              if (detail.cover) row.cover = detail.cover
            } catch {
              matchFailedCount++
            }
          }
        } else {
          matchFailedCount++
        }
      } catch {
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

const handleImportAll = async (): Promise<void> => {
  const toImport = rows.value.filter((r) => r.selected && r.selectedExe && !r.isDuplicate)
  if (toImport.length === 0) {
    error.value = '请至少选择一个有效的游戏'
    return
  }

  isImporting.value = true
  error.value = ''
  importedCount.value = 0
  showResult.value = false

  const startedAt = Date.now()
  const resultItems: ImportResultItem[] = []
  const CONCURRENCY = 3

  try {
    for (let i = 0; i < toImport.length; i += CONCURRENCY) {
      const chunk = toImport.slice(i, i + CONCURRENCY)
      await Promise.allSettled(
        chunk.map(async (row) => {
          try {
            const now = Date.now()
            const gameId = `id-${now}-${Math.random().toString(36).slice(2, 6)}`

            const existing = store.games.find(
              (g) =>
                g.executable_path === row.selectedExe ||
                (row.vndbId && g.vndb_id === row.vndbId) ||
                (row.bangumiId && g.bangumi_id === row.bangumiId)
            )
            if (existing) {
              resultItems.push({
                title: row.title || row.folderName,
                id: '',
                status: 'skipped',
                reason: `与已有游戏 "${existing.title}" 重复`
              })
              return
            }

            let cover = ''
            if (row.cover && !row.cover.startsWith('cover://')) {
              const localPath = await window.api.downloadCover(gameId, row.cover)
              if (localPath) cover = localPath
            }

            const gameData: Omit<GameRecord, 'created_at' | 'updated_at'> = {
              id: gameId,
              title: row.title.trim() || row.folderName,
              title_cn: '',
              cover,
              rating: row.rating,
              size: row.totalSize,
              installed: 1,
              favorite: 0,
              status: 'want',
              personal_rating: 0,
              last_played: '',
              description: row.description,
              developer: row.developer,
              publisher: row.publisher,
              release_date: row.releaseDate,
              playtime: '',
              executable_path: row.selectedExe,
              save_path: row.savePath,
              vndb_id: row.vndbId,
              bangumi_id: row.bangumiId,
              notes: '',
              custom_tags: row.customTags,
              last_launch_method: 'normal'
            }
            const game = await window.api.createGame(gameData)
            store.games.unshift(game)
            importedCount.value++
            resultItems.push({
              title: row.title || row.folderName,
              id: gameId,
              status: 'success'
            })
          } catch (e: unknown) {
            resultItems.push({
              title: row.title || row.folderName,
              id: '',
              status: 'failed',
              reason: (e instanceof Error ? e.message : String(e)) || '未知错误'
            })
          }
        })
      )
    }
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '导入失败'
  } finally {
    isImporting.value = false
  }

  const successItems = resultItems.filter((r) => r.status === 'success')
  const skippedItems = resultItems.filter((r) => r.status === 'skipped')
  const failedItems = resultItems.filter((r) => r.status === 'failed')

  importResult.value = {
    items: resultItems,
    successCount: successItems.length,
    skippedCount: skippedItems.length,
    failedCount: failedItems.length,
    totalDuration: Date.now() - startedAt
  }
  showResult.value = true
}

const handleFinish = (): void => {
  if (importResult.value) emit('imported', importResult.value)
}

const handleClose = (): void => {
  if (!isLoading.value && !isImporting.value && !isMatchingAll.value) emit('close')
}

const handleOverlayClick = (e: MouseEvent): void => {
  if ((e.target as HTMLElement).classList.contains('dialog-overlay')) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click="handleOverlayClick" @keydown.esc="handleClose">
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">批量导入游戏</h2>
          <button class="dialog-close" @click="handleClose">&times;</button>
        </div>

        <div class="dialog-body">
          <div v-if="error" class="form-error">{{ error }}</div>

          <!-- Step 1: Select Folder -->
          <div v-if="!scanResult" class="folder-pick-area">
            <button class="btn-brand" :disabled="isLoading" @click="handlePickFolder">
              <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
                <path
                  d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                />
              </svg>
              {{ isLoading ? '扫描中...' : '选择游戏库根文件夹' }}
            </button>
            <p class="folder-hint">选择包含多个游戏子文件夹的根目录</p>
          </div>

          <!-- Import result report -->
          <div v-if="showResult && importResult" class="result-panel">
            <div class="result-summary">
              <div class="result-stat success">
                <span class="result-num">{{ importResult.successCount }}</span>
                <span class="result-label">成功</span>
              </div>
              <div class="result-stat skipped">
                <span class="result-num">{{ importResult.skippedCount }}</span>
                <span class="result-label">跳过</span>
              </div>
              <div class="result-stat failed">
                <span class="result-num">{{ importResult.failedCount }}</span>
                <span class="result-label">失败</span>
              </div>
              <div class="result-stat">
                <span class="result-num"
                  >{{ (importResult.totalDuration / 1000).toFixed(1) }}s</span
                >
                <span class="result-label">耗时</span>
              </div>
            </div>
            <div v-if="importResult.failedCount > 0" class="result-detail">
              <div class="result-section-title">失败详情</div>
              <div
                v-for="item in importResult.items.filter((i) => i.status === 'failed')"
                :key="item.title + item.reason"
                class="result-item failed"
              >
                <span class="result-item-title">{{ item.title || '(未知)' }}</span>
                <span class="result-item-reason">{{ item.reason }}</span>
              </div>
            </div>
            <div v-if="importResult.skippedCount > 0" class="result-detail">
              <div class="result-section-title">跳过详情</div>
              <div
                v-for="item in importResult.items.filter((i) => i.status === 'skipped')"
                :key="item.title + item.reason"
                class="result-item skipped"
              >
                <span class="result-item-title">{{ item.title }}</span>
                <span class="result-item-reason">{{ item.reason }}</span>
              </div>
            </div>
            <div class="result-actions">
              <button class="btn-brand" @click="handleFinish">完成</button>
            </div>
          </div>

          <!-- Step 2: Review & Import -->
          <div v-else-if="scanResult" class="batch-form">
            <div class="batch-summary">
              <div class="bs-left">
                <label class="bs-select-all">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="
                      selectedSelectableCount > 0 && selectedSelectableCount < allSelectableCount
                    "
                    :disabled="isImporting"
                    @change="handleSelectAll(($event.target as HTMLInputElement).checked)"
                  />
                  <span
                    >共检测到 <strong>{{ totalCount }}</strong> 个游戏目录</span
                  >
                </label>
                <div class="bs-sort">
                  <button
                    class="sort-btn"
                    :class="{ active: sortKey === 'name' }"
                    :disabled="isImporting"
                    @click="toggleSort('name')"
                  >
                    名称 {{ sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
                  </button>
                  <button
                    class="sort-btn"
                    :class="{ active: sortKey === 'size' }"
                    :disabled="isImporting"
                    @click="toggleSort('size')"
                  >
                    大小 {{ sortKey === 'size' ? (sortDir === 'asc' ? '↑' : '↓') : '' }}
                  </button>
                </div>
              </div>
              <div class="bs-right">
                <button
                  v-if="!isMatchingAll"
                  class="btn-match-all"
                  :disabled="isImporting || unmatchedCount === 0"
                  @click="handleMatchAll"
                >
                  一键匹配全部 ({{ unmatchedCount }})
                </button>
                <button v-else class="btn-match-cancel" @click="handleCancelMatchAll">
                  取消匹配
                </button>
              </div>
            </div>

            <div class="batch-list">
              <BatchImportRow
                v-for="row in sortedRows"
                :key="row.folderPath"
                :row="row"
                :searching="searchingRow === row.folderPath"
                :importing="isImporting || isMatchingAll"
                @update:selected="row.selected = $event"
                @update:title="row.title = $event"
                @update:selected-exe="row.selectedExe = $event"
                @search="handleSearchRow(row.folderPath)"
              />
            </div>

            <div v-if="totalCount === 0" class="empty-hint">该文件夹下没有子目录</div>

            <div class="batch-actions">
              <div class="ba-count">
                {{
                  isImporting
                    ? `正在导入 ${importedCount}/${selectedCount} ...`
                    : `已选 ${selectedCount} 个游戏${skipCount > 0 ? `，${skipCount} 个跳过（已存在）` : ''}`
                }}
              </div>
              <div class="ba-buttons">
                <button
                  class="btn-cancel"
                  :disabled="isImporting || isMatchingAll"
                  @click="handleClose"
                >
                  取消
                </button>
                <button
                  class="btn-brand"
                  :disabled="isImporting || isMatchingAll || selectedCount === 0"
                  @click="handleImportAll"
                >
                  {{ isImporting ? '导入中...' : '导入选中' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <SearchResultPicker
    v-if="showSearchPicker"
    :results="searchResults"
    :loading="false"
    :source="searchSource"
    @select="handlePickerSelect"
    @close="showSearchPicker = false"
  />
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-card {
  width: 680px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.dialog-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.1s;
}

.dialog-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dialog-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.folder-pick-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.folder-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.form-error {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--danger);
  font-size: 12px;
}

.batch-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bs-left {
  display: flex;
  align-items: center;
}

.bs-select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.bs-select-all input {
  accent-color: var(--accent-primary);
}

.bs-sort {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.sort-btn {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-tertiary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.sort-btn:hover {
  border-color: var(--accent-primary);
  color: var(--text-secondary);
}

.sort-btn.active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.06);
}

.sort-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.bs-right {
  display: flex;
  gap: 6px;
}

.btn-match-all,
.btn-match-cancel {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-match-all {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.btn-match-all:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-match-all:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn-match-cancel {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: var(--danger);
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.empty-hint {
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid var(--border-color-light);
}

.ba-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.ba-buttons {
  display: flex;
  gap: 8px;
}

/* Result panel */
.result-panel {
  padding: 16px 0;
}

.result-summary {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 16px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.result-stat.success .result-num {
  color: #22c55e;
}
.result-stat.skipped .result-num {
  color: #f59e0b;
}
.result-stat.failed .result-num {
  color: var(--danger);
}

.result-num {
  font-size: 22px;
  font-weight: 700;
}

.result-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.result-detail {
  margin-top: 12px;
}

.result-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.result-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 4px;
}

.result-item.failed {
  background: rgba(239, 68, 68, 0.08);
}

.result-item.skipped {
  background: rgba(245, 158, 11, 0.08);
}

.result-item-title {
  color: var(--text-primary);
  font-weight: 500;
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-item-reason {
  color: var(--text-tertiary);
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
  margin-top: 16px;
}

.btn-cancel {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
