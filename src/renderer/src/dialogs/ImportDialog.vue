<script setup lang="ts">
import { ref } from 'vue'
import type { ImportScanResult, GameRecord } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', game: GameRecord): void
}>()

const store = useGameStore()
const isLoading = ref(false)
const scanResult = ref<ImportScanResult | null>(null)
const selectedExe = ref('')
const title = ref('')
const titleCn = ref('')
const error = ref('')

const handlePickFolder = async (): Promise<void> => {
  isLoading.value = true
  error.value = ''
  try {
    const result = await window.api.pickImportFolder()
    if (!result) {
      isLoading.value = false
      return
    }
    scanResult.value = result
    title.value = result.folderName
    titleCn.value = ''
    if (result.executables.length === 1) {
      selectedExe.value = result.executables[0].fullPath
    } else {
      selectedExe.value = result.executables.length > 0 ? result.executables[0].fullPath : ''
    }
  } catch (e: any) {
    error.value = e.message || '选择文件夹失败'
  } finally {
    isLoading.value = false
  }
}

const handleConfirm = async (): Promise<void> => {
  if (!scanResult.value) return
  if (!title.value.trim()) {
    error.value = '请输入游戏名称'
    return
  }
  if (!selectedExe.value) {
    error.value = '请选择主程序文件'
    return
  }

  const existing = store.games.find((g) => g.executable_path === selectedExe.value)
  if (existing) {
    error.value = `"${existing.title}" 已存在于游戏库中，请勿重复导入`
    return
  }

  isLoading.value = true
  error.value = ''
  try {
    const now = Date.now()
    const gameData: Omit<GameRecord, 'created_at' | 'updated_at'> = {
      id: `id-${now}`,
      title: title.value.trim(),
      title_cn: titleCn.value.trim(),
      cover: '',
      rating: 0,
      size: scanResult.value.totalSize,
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
      executable_path: selectedExe.value,
      save_path: '',
      vndb_id: '',
      bangumi_id: '',
      notes: '',
      custom_tags: '[]',
      last_launch_method: 'normal'
    }
    const game = await window.api.createGame(gameData)
    store.games.unshift(game)
    emit('imported', game)
  } catch (e: any) {
    error.value = e.message || '导入失败'
  } finally {
    isLoading.value = false
  }
}

const handleClose = (): void => {
  if (!isLoading.value) emit('close')
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
          <h2 class="dialog-title">导入游戏</h2>
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
              {{ isLoading ? '扫描中...' : '选择游戏文件夹' }}
            </button>
          </div>

          <!-- Step 2: Edit Metadata -->
          <div v-else class="import-form">
            <div class="form-group">
              <label class="form-label">文件夹路径</label>
              <div class="form-path">{{ scanResult.folderPath }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">游戏大小</label>
              <div class="form-value">{{ scanResult.totalSize }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">主程序 <span class="text-danger">*</span></label>
              <div v-if="scanResult.executables.length === 0" class="form-warning">
                未检测到可执行文件
              </div>
              <div v-else class="exe-list">
                <label
                  v-for="exe in scanResult.executables"
                  :key="exe.fullPath"
                  class="exe-item"
                  :class="{ selected: selectedExe === exe.fullPath }"
                >
                  <input
                    v-model="selectedExe"
                    type="radio"
                    :value="exe.fullPath"
                    class="exe-radio"
                  />
                  <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current exe-icon">
                    <path
                      d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"
                    />
                  </svg>
                  <span class="exe-name">{{ exe.name }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="input-title"
                >游戏名称 <span class="text-danger">*</span></label
              >
              <input
                id="input-title"
                v-model="title"
                class="form-input"
                placeholder="输入游戏名称"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="input-title-cn">中文名称</label>
              <input
                id="input-title-cn"
                v-model="titleCn"
                class="form-input"
                placeholder="输入中文名称（可选）"
              />
            </div>

            <div class="form-actions">
              <button class="btn-cancel" :disabled="isLoading" @click="handleClose">取消</button>
              <button class="btn-brand" :disabled="isLoading" @click="handleConfirm">
                {{ isLoading ? '导入中...' : '确认导入' }}
              </button>
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
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
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
}

.folder-pick-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
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

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-path {
  padding: 8px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  word-break: break-all;
}

.form-value {
  font-size: 13px;
  color: var(--text-primary);
}

.form-input,
.form-select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-select {
  cursor: pointer;
}

.form-warning {
  font-size: 12px;
  color: var(--warning);
}

.exe-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.exe-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
}

.exe-item:hover {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.04);
}

.exe-item.selected {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.08);
}

.exe-radio {
  accent-color: var(--accent-primary);
}

.exe-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.exe-name {
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
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

.text-danger {
  color: var(--danger);
}
</style>
