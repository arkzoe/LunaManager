<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ScanResult, GameRecord, SearchResult } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import SearchResultPicker from '../shared/SearchResultPicker.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', game: GameRecord): void
}>()

const store = useGameStore()
const isLoading = ref(false)
const scanResult = ref<ScanResult | null>(null)
const selectedExe = ref('')
const title = ref('')
const titleCn = ref('')
const error = ref('')
const searching = ref(false)
const searchResults = ref<SearchResult[]>([])
const showSearchPicker = ref(false)
const searchSource = ref<'vndb' | 'bangumi'>('vndb')
const metadataFilled = ref(false)
const searchNoResults = ref(false)

// Token cache
let cachedSource: 'vndb' | 'bangumi' | null = null
let cachedToken: string | null = null

const coverUrl = ref('')
const developer = ref('')
const releaseDate = ref('')
const description = ref('')
const rating = ref(0)
const customTags = ref('[]')
const vndbId = ref('')
const bangumiId = ref('')
const publisher = ref('')
const notes = ref('')
const savePath = ref('')
const status = ref<GameRecord['status']>('want')

const invalidateTokenCache = (): void => {
  cachedSource = null
  cachedToken = null
}

watch(title, () => {
  searchNoResults.value = false
})

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

const handlePickFolder = async (): Promise<void> => {
  invalidateTokenCache()
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
  searchNoResults.value = false
  error.value = ''
  try {
    const { source, token } = await ensureTokenCache()
    searchSource.value = source

    if (source === 'bangumi' && !token) {
      error.value = '请先在「设置 → 数据源」中配置 Bangumi Token'
      return
    }

    searchResults.value = await window.api.searchMetadata(query, source, token || undefined)
    if (searchResults.value.length === 1) {
      applySearchResult(searchResults.value[0])
    } else if (searchResults.value.length > 1) {
      showSearchPicker.value = true
    } else {
      searchNoResults.value = true
    }
  } catch (err: any) {
    error.value = err.message || '搜索失败'
  } finally {
    searching.value = false
  }
}

const applySearchResult = async (result: SearchResult): Promise<void> => {
  title.value = result.titleCn || result.title || title.value
  titleCn.value = result.titleCn || ''

  if (result.id) {
    try {
      const { token } = await ensureTokenCache()
      const detail = await window.api.fetchMetadataDetail(
        result.id,
        result.source,
        token || undefined,
        undefined
      )
      if (detail.title) title.value = detail.title_cn || detail.title || title.value
      if (detail.title_cn) titleCn.value = detail.title_cn
      if (detail.cover) {
        coverUrl.value = detail.cover
      }
      if (detail.developer) developer.value = detail.developer
      if (detail.publisher) publisher.value = detail.publisher
      if (detail.release_date) releaseDate.value = detail.release_date
      if (detail.description) description.value = detail.description
      if (detail.rating) rating.value = detail.rating
      if (detail.custom_tags) customTags.value = detail.custom_tags
      if (detail.vndb_id) vndbId.value = detail.vndb_id
      if (detail.bangumi_id) bangumiId.value = detail.bangumi_id
      metadataFilled.value = true
    } catch (err: any) {
      console.error('获取元数据详情失败:', err.message || err)
    }
  }
}

const handlePickerSelect = (result: SearchResult): void => {
  showSearchPicker.value = false
  applySearchResult(result)
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

  const existing = store.games.find(
    (g) =>
      g.executable_path === selectedExe.value ||
      (vndbId.value && g.vndb_id === vndbId.value) ||
      (bangumiId.value && g.bangumi_id === bangumiId.value)
  )
  if (existing) {
    error.value = `"${existing.title}" 已存在于游戏库中，请勿重复导入`
    return
  }

  isLoading.value = true
  error.value = ''
  try {
    const now = Date.now()
    const gameId = `id-${now}-${Math.random().toString(36).slice(2, 6)}`

    let cover = ''
    if (coverUrl.value && !coverUrl.value.startsWith('cover://')) {
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
      status: status.value,
      personal_rating: 0,
      last_played: '',
      description: description.value,
      developer: developer.value,
      publisher: publisher.value,
      release_date: releaseDate.value,
      playtime: '',
      executable_path: selectedExe.value,
      save_path: savePath.value,
      vndb_id: vndbId.value,
      bangumi_id: bangumiId.value,
      notes: notes.value,
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

const handlePickSavePath = async (): Promise<void> => {
  const dir = await window.api.pickDirectory()
  if (dir) savePath.value = dir
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

            <!-- Cover preview -->
            <div v-if="coverUrl" class="form-group">
              <label class="form-label">封面预览</label>
              <div class="cover-preview-wrap">
                <img
                  :src="coverUrl"
                  class="cover-preview-img"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
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
                    <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                    <path
                      d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                    />
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
              <div v-if="metadataFilled" class="metadata-hint">
                已从 {{ searchSource === 'vndb' ? 'VNDB' : 'Bangumi' }} 获取元数据
              </div>
              <div v-if="searchNoResults" class="search-no-results">
                未找到匹配结果，请尝试调整搜索名称
              </div>
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
              <label class="form-label" for="input-publisher">发行商</label>
              <input
                id="input-publisher"
                v-model="publisher"
                class="form-input"
                placeholder="发行商（可自动获取）"
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

            <div class="form-group">
              <label class="form-label" for="input-status">游戏状态</label>
              <select id="input-status" v-model="status" class="form-select">
                <option value="want">想玩</option>
                <option value="playing">在玩</option>
                <option value="played">玩过</option>
                <option value="shelved">搁置</option>
                <option value="abandoned">弃坑</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="input-description">游戏描述</label>
              <textarea
                id="input-description"
                v-model="description"
                class="form-textarea"
                placeholder="游戏描述（可自动获取）"
                rows="3"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="input-notes">备注</label>
              <textarea
                id="input-notes"
                v-model="notes"
                class="form-textarea"
                placeholder="输入备注信息（可选）"
                rows="2"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="input-tags">自定义标签</label>
              <input
                id="input-tags"
                v-model="customTags"
                class="form-input"
                placeholder="标签（JSON 数组，可自动获取）"
              />
            </div>

            <div class="form-group">
              <label class="form-label">存档路径</label>
              <div class="save-path-row">
                <div class="form-path save-path-text" :class="{ empty: !savePath }">
                  {{ savePath || '未设置' }}
                </div>
                <button class="btn-pick-path" :disabled="isLoading" @click="handlePickSavePath">
                  选择
                </button>
              </div>
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
  width: 520px;
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

.search-no-results {
  margin-top: 4px;
  font-size: 11px;
  color: var(--warning);
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

.form-textarea {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.form-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

.cover-preview-wrap {
  width: 120px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.cover-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.save-path-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.save-path-text {
  flex: 1;
  min-width: 0;
}

.save-path-text.empty {
  color: var(--text-tertiary);
  font-style: italic;
}

.btn-pick-path {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.btn-pick-path:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
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
  to {
    transform: rotate(360deg);
  }
}
</style>
