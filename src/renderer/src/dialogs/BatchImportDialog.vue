<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GameRecord, ImportResult, ImportResultItem } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useBatchScan } from '../composables/useBatchScan'
import { useBatchMatch } from '../composables/useBatchMatch'
import BatchImportRow from './BatchImportRow.vue'
import BatchImportResult from './BatchImportResult.vue'
import SearchInputDialog from '../shared/SearchInputDialog.vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', result: ImportResult): void
}>()

const store = useGameStore()
const settingsStore = useSettingsStore()
const isImporting = ref(false)

const scan = useBatchScan()
const match = useBatchMatch(scan.rows, scan.error)

// Import result state
const showResult = ref(false)
const importResult = ref<ImportResult | null>(null)

const handlePickFolder = async (): Promise<void> => {
  await scan.handlePickFolder(match.invalidateTokenCache)
  if (settingsStore.settings.autoSyncMetadata && match.unmatchedCount.value > 0) {
    await match.handleMatchAll()
  }
}

const handleImportAll = async (): Promise<void> => {
  const toImport = scan.rows.value.filter((r) => r.selected && r.selectedExe && !r.isDuplicate)
  if (toImport.length === 0) {
    scan.error.value = '请至少选择一个有效的游戏'
    return
  }

  isImporting.value = true
  scan.error.value = ''
  scan.importedCount.value = 0
  showResult.value = false

  const startedAt = Date.now()
  const resultItems: ImportResultItem[] = []
  const CONCURRENCY = 3

  try {
    for (let i = 0; i < toImport.length; i += CONCURRENCY) {
      const chunk = toImport.slice(i, i + CONCURRENCY)
      await Promise.allSettled(
        chunk.map(async (row) => {
          row.importStatus = 'importing'
          row.importMessage = ''
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
              row.importStatus = 'skipped'
              row.importMessage = `与已有游戏 "${existing.title}" 重复`
              resultItems.push({
                title: row.title || row.folderName,
                id: '',
                status: 'skipped',
                reason: row.importMessage
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
              playtime_seconds: 0,
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
            scan.importedCount.value++
            row.importStatus = 'success'
            resultItems.push({ title: row.title || row.folderName, id: gameId, status: 'success' })
          } catch (e: unknown) {
            row.importStatus = 'failed'
            row.importMessage = (e instanceof Error ? e.message : String(e)) || '未知错误'
            resultItems.push({
              title: row.title || row.folderName,
              id: '',
              status: 'failed',
              reason: row.importMessage
            })
          }
        })
      )
    }
  } catch (e: unknown) {
    scan.error.value = (e instanceof Error ? e.message : String(e)) || '导入失败'
  } finally {
    isImporting.value = false
  }

  importResult.value = {
    items: resultItems,
    successCount: resultItems.filter((r) => r.status === 'success').length,
    skippedCount: resultItems.filter((r) => r.status === 'skipped').length,
    failedCount: resultItems.filter((r) => r.status === 'failed').length,
    totalDuration: Date.now() - startedAt
  }
  showResult.value = true
}

const handleFinish = (): void => {
  if (importResult.value) emit('imported', importResult.value)
}

const handleClose = (): void => {
  if (!scan.isLoading.value && !isImporting.value && !match.isMatchingAll.value) emit('close')
}

const handleOverlayClick = (e: MouseEvent): void => {
  if ((e.target as HTMLElement).classList.contains('dialog-overlay')) handleClose()
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      scan.reset()
      match.reset()
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="dialog-overlay"
        @click="handleOverlayClick"
        @keydown.esc="handleClose"
      >
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 class="dialog-title">批量导入游戏</h2>
            <button class="dialog-close" @click="handleClose">&times;</button>
          </div>

          <!-- Step 1: Select Folder -->
          <div v-if="!scan.scanResult.value" class="dialog-body">
            <div class="folder-pick-area">
              <button
                class="btn-primary"
                :disabled="scan.isLoading.value"
                @click="handlePickFolder"
              >
                <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
                  <path
                    d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                  />
                </svg>
                {{ scan.isLoading.value ? '扫描中...' : '选择游戏库根文件夹' }}
              </button>
              <p class="folder-hint">选择包含多个游戏子文件夹的根目录</p>
            </div>
          </div>

          <!-- Import result report -->
          <div v-else-if="showResult && importResult" class="dialog-body">
            <BatchImportResult :result="importResult" @finish="handleFinish" />
          </div>

          <!-- Step 2: Review & Import -->
          <template v-else-if="scan.scanResult.value">
            <div v-if="scan.error.value" class="form-error batch-error">{{ scan.error.value }}</div>
            <div class="batch-summary">
              <div class="bs-left">
                <label class="bs-select-all">
                  <input
                    type="checkbox"
                    :checked="scan.isAllSelected.value"
                    :indeterminate="
                      scan.selectedSelectableCount.value > 0 &&
                      scan.selectedSelectableCount.value < scan.allSelectableCount.value
                    "
                    :disabled="isImporting"
                    @change="scan.handleSelectAll(($event.target as HTMLInputElement).checked)"
                  />
                  <span
                    >共检测到 <strong>{{ scan.totalCount.value }}</strong> 个游戏目录</span
                  >
                </label>
                <div class="bs-sort">
                  <button
                    class="sort-btn"
                    :class="{ active: scan.sortKey.value === 'name' }"
                    :disabled="isImporting"
                    @click="scan.toggleSort('name')"
                  >
                    名称
                    {{
                      scan.sortKey.value === 'name'
                        ? scan.sortDir.value === 'asc'
                          ? '↑'
                          : '↓'
                        : ''
                    }}
                  </button>
                  <button
                    class="sort-btn"
                    :class="{ active: scan.sortKey.value === 'size' }"
                    :disabled="isImporting"
                    @click="scan.toggleSort('size')"
                  >
                    大小
                    {{
                      scan.sortKey.value === 'size'
                        ? scan.sortDir.value === 'asc'
                          ? '↑'
                          : '↓'
                        : ''
                    }}
                  </button>
                </div>
              </div>
              <div class="bs-right">
                <button
                  v-if="!match.isMatchingAll.value"
                  class="btn-match-all"
                  :disabled="isImporting || match.unmatchedCount.value === 0"
                  @click="match.handleMatchAll()"
                >
                  一键匹配全部 ({{ match.unmatchedCount.value }})
                </button>
                <button v-else class="btn-match-cancel" @click="match.handleCancelMatchAll()">
                  取消匹配
                </button>
              </div>
            </div>

            <div class="batch-scroll">
              <div class="batch-list">
                <BatchImportRow
                  v-for="row in scan.sortedRows.value"
                  :key="row.folderPath"
                  :row="row"
                  :searching="match.searchingRow.value === row.folderPath"
                  :importing="isImporting || match.isMatchingAll.value"
                  @update:selected="row.selected = $event"
                  @update:title="row.title = $event"
                  @update:selected-exe="row.selectedExe = $event"
                  @search="match.handleSearchRow(row.folderPath)"
                />
              </div>
              <div v-if="scan.totalCount.value === 0" class="empty-hint">该文件夹下没有子目录</div>
            </div>

            <div class="batch-actions">
              <div class="ba-count">
                {{
                  isImporting
                    ? `正在导入 ${scan.importedCount.value}/${scan.selectedCount.value} ...`
                    : `已选 ${scan.selectedCount.value} 个游戏${scan.skipCount.value > 0 ? `，${scan.skipCount.value} 个跳过（已存在）` : ''}`
                }}
              </div>
              <div class="ba-buttons">
                <button
                  class="btn-cancel"
                  :disabled="isImporting || match.isMatchingAll.value"
                  @click="handleClose"
                >
                  取消
                </button>
                <button
                  class="btn-primary"
                  :disabled="
                    isImporting || match.isMatchingAll.value || scan.selectedCount.value === 0
                  "
                  @click="handleImportAll"
                >
                  {{ isImporting ? '导入中...' : '导入选中' }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <SearchInputDialog
    :show="match.showSearchInput.value"
    :initial-query="match.searchInputQuery.value"
    :initial-source="match.searchSource.value"
    @select="match.handleSearchInputSelect"
    @close="match.handleSearchInputClose"
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

.modal-enter-active {
  animation: overlay-in 0.2s ease;
}

.modal-leave-active {
  animation: overlay-out 0.15s ease forwards;
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

.modal-enter-active .dialog-card {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .dialog-card {
  animation: modal-out 0.15s ease forwards;
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
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--danger);
  font-size: 12px;
}

.batch-error {
  margin: 8px 20px 0;
  flex-shrink: 0;
}

.batch-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 0;
  flex-shrink: 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
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
  background: rgba(59, 130, 246, 0.06);
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

.batch-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  min-height: 0;
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  padding: 12px 20px;
  border-top: 1px solid var(--border-color-light);
  flex-shrink: 0;
  background: var(--bg-primary);
  border-radius: 8px;
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
