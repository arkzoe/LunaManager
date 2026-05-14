<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BatchScanResult, GameRecord, SearchResult } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import BatchImportRow from './BatchImportRow.vue'
import SearchResultPicker from '../shared/SearchResultPicker.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', count: number): void
}>()

const store = useGameStore()
const isLoading = ref(false)
const isImporting = ref(false)
const scanResult = ref<BatchScanResult | null>(null)
const error = ref('')
const importedCount = ref(0)

// 每行的编辑状态
interface RowState {
  folderPath: string
  folderName: string
  executables: { name: string; fullPath: string }[]
  totalSize: string
  selected: boolean
  title: string
  selectedExe: string
  isDuplicate: boolean
  vndbId: string
  bangumiId: string
  cover: string
  rating: number
  developer: string
  releaseDate: string
  description: string
  customTags: string
}

const rows = ref<RowState[]>([])

// Search state
const searchingRow = ref<number>(-1)
const searchResults = ref<SearchResult[]>([])
const showSearchPicker = ref(false)
const searchSource = ref<'vndb' | 'bangumi'>('vndb')
const activeRowIndex = ref(-1)

const existingPaths = computed(() => new Set(store.games.map((g) => g.executable_path)))
const selectedCount = computed(() => rows.value.filter((r) => r.selected && r.selectedExe && !r.isDuplicate).length)
const skipCount = computed(() => rows.value.filter((r) => r.isDuplicate).length)
const totalCount = computed(() => rows.value.length)

const handlePickFolder = async (): Promise<void> => {
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
        releaseDate: '',
        description: '',
        customTags: '[]'
      }
    })
  } catch (e: any) {
    error.value = e.message || '选择文件夹失败'
  } finally {
    isLoading.value = false
  }
}

const handleSearchRow = async (rowIndex: number): Promise<void> => {
  const row = rows.value[rowIndex]
  if (!row) return

  const query = row.title || row.folderName
  if (!query) return

  searchingRow.value = rowIndex
  try {
    const source = await window.api.getConfig('metadataSource')
    searchSource.value = source || 'vndb'
    searchResults.value = await window.api.searchMetadata(query, searchSource.value)
    if (searchResults.value.length > 0) {
      activeRowIndex.value = rowIndex
      showSearchPicker.value = true
    }
  } catch {
    // silently fail
  } finally {
    searchingRow.value = -1
  }
}

const handlePickerSelect = async (result: SearchResult): Promise<void> => {
  showSearchPicker.value = false
  const row = rows.value[activeRowIndex.value]
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
      const detail = await window.api.fetchMetadataDetail(
        result.id,
        result.source,
        undefined,
        undefined
      )
      if (detail.developer) row.developer = detail.developer
      if (detail.title_cn) row.title = detail.title_cn || row.title
      if (detail.description) row.description = detail.description
      if (detail.custom_tags) row.customTags = detail.custom_tags
      if (detail.cover) row.cover = detail.cover
    } catch {
      // details fetch failed, keep surface-level data
    }
  }
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

  try {
    for (const row of toImport) {
      const now = Date.now()
      const gameId = `id-${now}-${Math.random().toString(36).slice(2, 6)}`

      let cover = ''
      if (row.cover) {
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
        publisher: '',
        release_date: row.releaseDate,
        playtime: '',
        executable_path: row.selectedExe,
        save_path: '',
        vndb_id: row.vndbId,
        bangumi_id: row.bangumiId,
        notes: '',
        custom_tags: row.customTags,
        last_launch_method: 'normal'
      }
      const game = await window.api.createGame(gameData)
      store.games.unshift(game)
      importedCount.value++
    }
    emit('imported', importedCount.value)
  } catch (e: any) {
    error.value = e.message || '导入失败'
  } finally {
    isImporting.value = false
  }
}

const handleClose = (): void => {
  if (!isLoading.value && !isImporting.value) emit('close')
}

const handleOverlayClick = (e: MouseEvent): void => {
  if ((e.target as HTMLElement).classList.contains('dialog-overlay')) handleClose()
}
</script>

<template>
  <Teleport to="body">
    <div class="dialog-overlay" @click="handleOverlayClick">
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
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
              </svg>
              {{ isLoading ? '扫描中...' : '选择游戏库根文件夹' }}
            </button>
            <p class="folder-hint">选择包含多个游戏子文件夹的根目录</p>
          </div>

          <!-- Step 2: Review & Import -->
          <div v-else class="batch-form">
            <div class="batch-summary">
              共检测到 <strong>{{ totalCount }}</strong> 个游戏目录
            </div>

            <div class="batch-list">
              <BatchImportRow
                v-for="(row, idx) in rows"
                :key="row.folderPath"
                :row="row"
                :searching="searchingRow === idx"
                @update:selected="row.selected = $event"
                @update:title="row.title = $event"
                @update:selectedExe="row.selectedExe = $event"
                @search="handleSearchRow(idx)"
              />
            </div>

            <div v-if="totalCount === 0" class="empty-hint">该文件夹下没有子目录</div>

            <div class="batch-actions">
              <div class="ba-count">
                {{ isImporting ? `正在导入 ${importedCount}/${selectedCount} ...` : `已选 ${selectedCount} 个游戏${skipCount > 0 ? `，${skipCount} 个跳过（已存在）` : ''}` }}
              </div>
              <div class="ba-buttons">
                <button class="btn-cancel" :disabled="isImporting" @click="handleClose">取消</button>
                <button class="btn-brand" :disabled="isImporting || selectedCount === 0" @click="handleImportAll">
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
  width: 640px;
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
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
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
