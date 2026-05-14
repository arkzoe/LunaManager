<script setup lang="ts">
import { ref } from 'vue'
import type { ImportScanResult, GameRecord, SearchResult } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import SearchResultPicker from '../shared/SearchResultPicker.vue'

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
const searching = ref(false)
const searchResults = ref<SearchResult[]>([])
const showSearchPicker = ref(false)
const searchSource = ref<'vndb' | 'bangumi'>('vndb')
const metadataFilled = ref(false)

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
    isLoading.value = false
  } catch (e: any) {
    error.value = e.message || '选择文件夹失败'
    isLoading.value = false
  }
}

const handleSearch = async (): Promise<void> => {
  const query = title.value.trim() || scanResult.value?.folderName
  if (!query) return

  searching.value = true
  metadataFilled.value = false
  try {
    const source = await window.api.getConfig('metadataSource')
    searchSource.value = source || 'vndb'
    searchResults.value = await window.api.searchMetadata(query, searchSource.value)
    if (searchResults.value.length === 1) {
      applySearchResult(searchResults.value[0])
    } else if (searchResults.value.length > 1) {
      showSearchPicker.value = true
    }
  } catch {
    // silently fail, user can manually search
  } finally {
    searching.value = false
  }
}

const applySearchResult = async (result: SearchResult): Promise<void> => {
  title.value = result.titleCn || result.title || title.value
  titleCn.value = result.titleCn || ''

  if (result.id) {
    const detail = await window.api.fetchMetadataDetail(
      result.id,
      result.source,
      undefined,
      undefined // no gameId yet, will download on import
    )
    if (detail.title) title.value = detail.title_cn || detail.title || title.value
    if (detail.title_cn) titleCn.value = detail.title_cn
    if (detail.cover) {
      // Store the cover URL temporarily; will be downloaded on import with gameId
      coverUrl.value = detail.cover
    }
    if (detail.developer) developer.value = detail.developer
    if (detail.release_date) releaseDate.value = detail.release_date
    if (detail.description) description.value = detail.description
    if (detail.rating) rating.value = detail.rating
    if (detail.custom_tags) customTags.value = detail.custom_tags
    if (detail.vndb_id) vndbId.value = detail.vndb_id
    if (detail.bangumi_id) bangumiId.value = detail.bangumi_id
    metadataFilled.value = true
  }
}

const handlePickerSelect = (result: SearchResult): void => {
  showSearchPicker.value = false
  applySearchResult(result)
}

const coverUrl = ref('')
const developer = ref('')
const releaseDate = ref('')
const description = ref('')
const rating = ref(0)
const customTags = ref('[]')
const vndbId = ref('')
const bangumiId = ref('')

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
    const gameId = `id-${now}`

    // Download cover if we have a URL
    let cover = ''
    if (coverUrl.value) {
      const localPath = await window.api.downloadCover(gameId, coverUrl.value)
      if (localPath) cover = localPath
    }

    const gameData: Omit<GameRecord, 'created_at' | 'updated_at'> = {
      id: gameId,
      title: title.value.trim(),
      title_cn: titleCn.value.trim(),
      cover,
      rating: rating.value,
      size: scanResult.value.totalSize,
      installed: 1,
      favorite: 0,
      status: 'want',
      personal_rating: 0,
      last_played: '',
      description: description.value,
      developer: developer.value,
      publisher: '',
      release_date: releaseDate.value,
      playtime: '',
      executable_path: selectedExe.value,
      save_path: '',
      vndb_id: vndbId.value,
      bangumi_id: bangumiId.value,
      notes: '',
      custom_tags: customTags.value,
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
              <div class="form-label-row">
                <label class="form-label" for="input-title"
                  >游戏名称 <span class="text-danger">*</span></label
                >
                <button
                  class="search-btn"
                  :disabled="searching"
                  title="识别源数据"
                  @click="handleSearch"
                >
                  <svg v-if="searching" viewBox="0 0 24 24" class="w-3.5 h-3.5 spin">
                    <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  识别源数据
                </button>
              </div>
              <input
                id="input-title"
                v-model="title"
                class="form-input"
                placeholder="输入游戏名称"
              />
              <div v-if="metadataFilled" class="metadata-hint">已从 {{ searchSource === 'vndb' ? 'VNDB' : 'Bangumi' }} 获取元数据</div>
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

            <div class="form-group">
              <label class="form-label" for="input-developer">开发商</label>
              <input
                id="input-developer"
                v-model="developer"
                class="form-input"
                placeholder="开发商（可自动获取）"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="input-date">发行日期</label>
              <input
                id="input-date"
                v-model="releaseDate"
                class="form-input"
                placeholder="发行日期（可自动获取）"
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

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.form-label-row .form-label {
  margin-bottom: 0;
}

.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.search-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.metadata-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #22c55e;
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

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
