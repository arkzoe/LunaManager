<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BatchScanResult, GameRecord } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import BatchImportRow from './BatchImportRow.vue'

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
}

const rows = ref<RowState[]>([])

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
        isDuplicate: hasDuplicate
      }
    })
  } catch (e: any) {
    error.value = e.message || '选择文件夹失败'
  } finally {
    isLoading.value = false
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
      const gameData: Omit<GameRecord, 'created_at' | 'updated_at'> = {
        id: `id-${now}-${Math.random().toString(36).slice(2, 6)}`,
        title: row.title.trim() || row.folderName,
        title_cn: '',
        cover: '',
        rating: 0,
        size: row.totalSize,
        installed: 1,
        favorite: 0,
        status: 'want',
        personal_rating: 0,
        last_played: '',
        description: '',
        developer: '',
        publisher: '',
        release_date: '',
        playtime: '',
        executable_path: row.selectedExe,
        save_path: '',
        vndb_id: '',
        bangumi_id: '',
        notes: '',
        custom_tags: '[]',
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
                v-for="row in rows"
                :key="row.folderPath"
                :row="row"
                @update:selected="row.selected = $event"
                @update:title="row.title = $event"
                @update:selectedExe="row.selectedExe = $event"
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
