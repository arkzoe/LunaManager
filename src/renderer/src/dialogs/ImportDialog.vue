<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ScanResult, GameRecord, SearchResult } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import { useTokenCache } from '../composables/useTokenCache'
import { fillGameFromDetail } from '../composables/useMetadata'
import { pickBestMatch, AUTO_MATCH_THRESHOLD } from '../utils/matcher'
import GameMetadataForm from '../shared/GameMetadataForm.vue'
import type { MetadataForm } from '../shared/GameMetadataForm.vue'
import SearchResultPicker from '../shared/SearchResultPicker.vue'

const props = defineProps<{ show: boolean }>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', game: GameRecord): void
}>()

const store = useGameStore()
const isLoading = ref(false)
const scanResult = ref<ScanResult | null>(null)
const error = ref('')
const searching = ref(false)
const searchResults = ref<SearchResult[]>([])
const showSearchPicker = ref(false)
const searchSource = ref<'vndb' | 'bangumi'>('bangumi')
const metadataFilled = ref(false)
const searchNoResults = ref(false)

const { ensureTokenCache, invalidateTokenCache } = useTokenCache()

// Form fields (driven by GameMetadataForm via v-model)
const form = ref<MetadataForm>({
  selectedExe: '',
  title: '',
  titleCn: '',
  developer: '',
  releaseDate: '',
  description: '',
  notes: '',
  customTags: '[]',
  savePath: '',
  status: 'want'
})

const coverUrl = ref('')
const vndbId = ref('')
const bangumiId = ref('')

const resetForm = (): void => {
  form.value = {
    selectedExe: '',
    title: '',
    titleCn: '',
    developer: '',
    releaseDate: '',
    description: '',
    notes: '',
    customTags: '[]',
    savePath: '',
    status: 'want'
  }
}

const resetState = (): void => {
  scanResult.value = null
  error.value = ''
  searching.value = false
  searchResults.value = []
  showSearchPicker.value = false
  metadataFilled.value = false
  searchNoResults.value = false
  coverUrl.value = ''
  vndbId.value = ''
  bangumiId.value = ''
  resetForm()
}

watch(
  () => props.show,
  (val) => {
    if (val) resetState()
  }
)

watch(
  () => form.value.title,
  () => {
    searchNoResults.value = false
  }
)

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
    const EXCLUDE_EXE = ['update', 'unitycrashhandler', 'custom']
    const filteredExe = result.executables.filter(
      (e: { name: string }) => !EXCLUDE_EXE.includes(e.name.toLowerCase().replace(/\.exe$/i, ''))
    )
    result.executables = filteredExe
    scanResult.value = result
    form.value = {
      ...form.value,
      title: result.folderName,
      titleCn: '',
      selectedExe:
        filteredExe.length === 1
          ? filteredExe[0].fullPath
          : filteredExe.length > 0
            ? filteredExe[0].fullPath
            : ''
    }
    isLoading.value = false
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '选择文件夹失败'
    isLoading.value = false
  }
}

const handleSearch = async (): Promise<void> => {
  const query = form.value.title.trim() || scanResult.value?.folderName
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
    const results = await window.api.searchMetadata(query, source, token || undefined)
    searchResults.value = results
    if (results.length > 0) {
      const best = pickBestMatch(query, results, AUTO_MATCH_THRESHOLD)
      if (best) {
        applySearchResult(best)
      } else {
        showSearchPicker.value = true
      }
    } else {
      searchNoResults.value = true
    }
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : String(err)) || '搜索失败'
  } finally {
    searching.value = false
  }
}

const applySearchResult = async (result: SearchResult): Promise<void> => {
  form.value.title = result.titleCn || result.title || form.value.title
  form.value.titleCn = result.titleCn || ''
  if (result.id) {
    try {
      const { token } = await ensureTokenCache()
      const detail = await window.api.fetchMetadataDetail(
        result.id,
        result.source,
        token || undefined,
        undefined
      )
      fillGameFromDetail(detail, form.value)
      if (detail.cover) {
        const previewId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const localPath = await window.api.downloadCover(previewId, detail.cover)
        if (localPath) coverUrl.value = localPath
      }
      if (detail.vndb_id) vndbId.value = detail.vndb_id
      if (detail.bangumi_id) bangumiId.value = detail.bangumi_id
      metadataFilled.value = true
    } catch (err: unknown) {
      console.error('获取元数据详情失败:', err instanceof Error ? err.message : String(err))
    }
  }
}

const handlePickerSelect = (result: SearchResult): void => {
  showSearchPicker.value = false
  applySearchResult(result)
}

const handleConfirm = async (): Promise<void> => {
  if (!scanResult.value) return
  if (!form.value.title.trim()) {
    error.value = '请输入游戏名称'
    return
  }
  if (!form.value.selectedExe) {
    error.value = '请选择主程序文件'
    return
  }
  const existing = store.games.find(
    (g) =>
      g.executable_path === form.value.selectedExe ||
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
    const gameId = `id-${crypto.randomUUID()}`
    let cover = ''
    if (coverUrl.value) {
      if (coverUrl.value.startsWith('cover://')) {
        cover = coverUrl.value
      } else {
        const localPath = await window.api.downloadCover(gameId, coverUrl.value)
        if (localPath) cover = localPath
      }
    }
    const gameData: Omit<GameRecord, 'created_at' | 'updated_at'> = {
      id: gameId,
      title: form.value.title.trim(),
      title_cn: form.value.titleCn.trim(),
      cover,
      size: scanResult.value.totalSize,
      favorite: 0,
      status: form.value.status,
      personal_rating: 0,
      last_played: '',
      description: form.value.description,
      developer: form.value.developer,
      release_date: form.value.releaseDate,
      playtime_seconds: 0,
      executable_path: form.value.selectedExe,
      save_path: form.value.savePath,
      vndb_id: vndbId.value,
      bangumi_id: bangumiId.value,
      notes: form.value.notes,
      custom_tags: form.value.customTags,
      last_launch_method: 'normal'
    }
    const game = await window.api.createGame(gameData)
    store.games.unshift(game)
    emit('imported', game)
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '导入失败'
  } finally {
    isLoading.value = false
  }
}

const handleClose = (): void => {
  if (!isLoading.value) emit('close')
}
const handlePickSavePath = async (): Promise<void> => {
  const dir = await window.api.pickDirectory()
  if (dir) form.value = { ...form.value, savePath: dir }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="dialog-overlay" @keydown.esc="handleClose">
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 class="dialog-title">导入游戏</h2>
            <button class="dialog-close" @click="handleClose">&times;</button>
          </div>
          <!-- Step 1: Select Folder -->
          <div v-if="!scanResult" class="dialog-body">
            <div class="folder-pick-area">
              <button class="btn-primary" :disabled="isLoading" @click="handlePickFolder">
                <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
                  <path
                    d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                  />
                </svg>
                {{ isLoading ? '扫描中...' : '选择游戏文件夹' }}
              </button>
            </div>
          </div>
          <!-- Step 2: Metadata Form + Fixed Actions -->
          <template v-else>
            <div class="dialog-body">
              <GameMetadataForm
                :scan-result="scanResult"
                :form="form"
                :cover-url="coverUrl"
                :searching="searching"
                :search-no-results="searchNoResults"
                :metadata-filled="metadataFilled"
                :search-source="searchSource"
                :error="error"
                @update:form="form = $event"
                @search="handleSearch"
                @pick-save-path="handlePickSavePath"
              />
            </div>
            <div class="dialog-footer">
              <button class="btn-ghost" :disabled="isLoading" @click="handleClose">取消</button>
              <button class="btn-primary" :disabled="isLoading" @click="handleConfirm">
                {{ isLoading ? '导入中...' : '确认导入' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <SearchResultPicker
    :show="showSearchPicker"
    :results="searchResults"
    :loading="false"
    :source="searchSource"
    @select="handlePickerSelect"
    @close="showSearchPicker = false"
  />
</template>

<style scoped>
.modal-enter-active {
  animation: overlay-in 0.2s ease;
}
.modal-leave-active {
  animation: overlay-out 0.15s ease forwards;
}
.dialog-card {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}
.modal-enter-active .dialog-card {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-leave-active .dialog-card {
  animation: modal-out 0.15s ease forwards;
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
</style>
