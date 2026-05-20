<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import type { GameRecord, GameStatus, ImportResult } from '../../../shared/types'
import { useToast } from '../composables/useToast'
import type { UICollection } from '../composables/useCollections'
import ImportDialog from '../dialogs/ImportDialog.vue'
import BatchImportDialog from '../dialogs/BatchImportDialog.vue'
import ToastNotification from '../shared/ToastNotification.vue'
import LibraryToolbar from './library/LibraryToolbar.vue'
import LibraryFilterBar from './library/LibraryFilterBar.vue'
import LibraryBatchBar from './library/LibraryBatchBar.vue'
import GameGridView from './library/GameGridView.vue'
import GameListView from './library/GameListView.vue'
import GameContextMenu from './library/GameContextMenu.vue'
import ConfirmDialog from '../shared/ConfirmDialog.vue'
import CollectionPickerDialog from '../shared/CollectionPickerDialog.vue'

const emit = defineEmits<{ (e: 'selectGame', game: GameRecord): void }>()

const store = useGameStore()
const searchQuery = ref('')
const activeFilter = ref<GameStatus | 'all'>('all')
const viewMode = ref<'grid' | 'list'>('grid')

type SortKey = 'name' | 'playtime' | 'rating' | 'last_played'
const sortKey = ref<SortKey>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

const filterSortKey = ref(0)
watch([activeFilter, sortKey, sortDir, searchQuery], () => {
  filterSortKey.value++
})

const sortOptions = [
  { key: 'name' as const, label: '名称' },
  { key: 'playtime' as const, label: '时长' },
  { key: 'rating' as const, label: '评分' },
  { key: 'last_played' as const, label: '最后游玩' }
]

const toggleSort = (key: SortKey): void => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'name' ? 'asc' : 'desc'
  }
}

// 右键菜单
const ctxMenu = ref<{ x: number; y: number; game: GameRecord } | null>(null)
const showCtxMenu = ref(false)

// 导入菜单
const showImportMenu = ref(false)

// 导入对话框
const showImportDialog = ref(false)
const showBatchImportDialog = ref(false)

// 批量操作
const batchMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const showBatchStatusMenu = ref(false)
const showCollectionPicker = ref(false)
const showDeleteConfirm = ref(false)
const showSingleDeleteConfirm = ref(false)
const singleDeleteGame = ref<GameRecord | null>(null)

const {
  show: showToast,
  message: toastMessage,
  type: toastType,
  showToast: showToastMsg
} = useToast()

const collections = ref<UICollection[]>([])

const loadCollections = async (): Promise<void> => {
  try {
    const [dbCols, gamesMap] = await Promise.all([
      window.api.getCollections(),
      window.api.getAllCollectionGamesMap()
    ])
    collections.value = dbCols.map((c) => ({
      id: c.id,
      name: c.name,
      icon: 'folder',
      iconColor: '#4f46e5',
      gameIds: gamesMap[c.id] ?? [],
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }))
  } catch {
    collections.value = []
  }
}

const batchCount = computed(() => selectedIds.value.size)
const allFilteredSelected = computed(
  () =>
    filteredGames.value.length > 0 && filteredGames.value.every((g) => selectedIds.value.has(g.id))
)

const handleGameClick = (game: GameRecord): void => {
  if (batchMode.value) {
    toggleSelectGame(game.id)
  } else {
    emit('selectGame', game)
  }
}

const toggleBatchMode = (): void => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedIds.value = new Set()
  }
}

const toggleSelectGame = (id: string): void => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

const toggleSelectAll = (): void => {
  if (allFilteredSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(filteredGames.value.map((g) => g.id))
  }
}

const closeBatchStatusMenu = (): void => {
  showBatchStatusMenu.value = false
}

const handleBatchStatus = async (status: GameStatus): Promise<void> => {
  showBatchStatusMenu.value = false
  const ids = [...selectedIds.value]
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await window.api.updateGame(id, { status } as Partial<GameRecord>)
      const g = store.allGames.find((x) => x.id === id)
      if (g) g.status = status
    })
  )
  const failed = ids.filter((_, i) => results[i].status === 'rejected')
  if (failed.length > 0) {
    selectedIds.value = new Set(failed)
    showToastMsg(`${failed.length}/${ids.length} 个操作失败`, 'error')
  } else {
    showToastMsg(`已将 ${ids.length} 个游戏改为「${statusLabels[status]}」`, 'success')
    selectedIds.value = new Set()
    batchMode.value = false
  }
}

const openCollectionPicker = async (): Promise<void> => {
  await loadCollections()
  showCollectionPicker.value = true
}

const closeCollectionPicker = (): void => {
  showCollectionPicker.value = false
}

const handleAddToCollection = async (collectionId: string): Promise<void> => {
  const col = collections.value.find((c) => c.id === collectionId)
  if (!col) return
  const ids = [...selectedIds.value]
  const toAdd = ids.filter((id) => !col.gameIds.includes(id))
  const results = await Promise.allSettled(
    toAdd.map(async (id) => {
      await window.api.addGameToCollection(id, collectionId)
      col.gameIds.push(id)
    })
  )
  const added = results.filter((r) => r.status === 'fulfilled').length
  showCollectionPicker.value = false
  selectedIds.value = new Set()
  batchMode.value = false
  showToastMsg(`已将 ${added} 个游戏添加到「${col.name}」`, 'success')
}

const openDeleteConfirm = (): void => {
  showDeleteConfirm.value = true
}

const closeDeleteConfirm = (): void => {
  showDeleteConfirm.value = false
}

const confirmBatchDelete = async (): Promise<void> => {
  showDeleteConfirm.value = false
  const ids = [...selectedIds.value]
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await window.api.deleteGame(id)
      store.games = store.games.filter((g) => g.id !== id)
    })
  )
  const failed = ids.filter((_, i) => results[i].status === 'rejected')
  if (failed.length > 0) {
    selectedIds.value = new Set(failed)
    showToastMsg(`${failed.length}/${ids.length} 个删除失败`, 'error')
  } else {
    showToastMsg(`已删除 ${ids.length} 个游戏`, 'success')
    selectedIds.value = new Set()
    batchMode.value = false
  }
}

const confirmSingleDelete = async (): Promise<void> => {
  if (!singleDeleteGame.value) return
  showSingleDeleteConfirm.value = false
  try {
    await window.api.deleteGame(singleDeleteGame.value.id)
    store.games = store.games.filter((g) => g.id !== singleDeleteGame.value!.id)
    showToastMsg(`已删除「${singleDeleteGame.value.title}」`, 'success')
  } catch {
    showToastMsg('删除失败', 'error')
  }
  singleDeleteGame.value = null
}

onMounted(() => {
  if (store.games.length === 0) store.loadGames()
})

const filters: { id: GameStatus | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'want', label: '想玩' },
  { id: 'playing', label: '在玩' },
  { id: 'played', label: '已玩' },
  { id: 'shelved', label: '搁置' },
  { id: 'abandoned', label: '抛弃' }
]

const statusFilters = computed(() =>
  filters.filter((f): f is { id: GameStatus; label: string } => f.id !== 'all')
)

const filteredGames = computed(() => {
  let list = store.allGames
  if (activeFilter.value !== 'all') {
    list = list.filter((g) => g.status === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (g) =>
        g.title.toLowerCase().includes(q) || (g.title_cn && g.title_cn.toLowerCase().includes(q))
    )
  }
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...list].sort((a, b) => {
    let cmp = 0
    if (key === 'name') {
      const an = a.title_cn || a.title
      const bn = b.title_cn || b.title
      cmp = an.localeCompare(bn, 'zh-CN')
    } else if (key === 'playtime') {
      cmp = (a.playtime_seconds || 0) - (b.playtime_seconds || 0)
    } else if (key === 'rating') {
      cmp = (a.personal_rating || 0) - (b.personal_rating || 0)
    } else if (key === 'last_played') {
      cmp = (a.last_played || '').localeCompare(b.last_played || '')
    }
    return cmp * dir
  })
})

const handleContextMenu = (e: MouseEvent, game: GameRecord): void => {
  e.preventDefault()
  ctxMenu.value = { x: e.clientX, y: e.clientY, game }
  showCtxMenu.value = true
}

const closeContextMenu = (): void => {
  showCtxMenu.value = false
  ctxMenu.value = null
}

const handleContextAddToCollection = async (): Promise<void> => {
  if (!ctxMenu.value) return
  selectedIds.value = new Set([ctxMenu.value.game.id])
  closeContextMenu()
  await loadCollections()
  showCollectionPicker.value = true
}

const handleViewDetail = (): void => {
  if (ctxMenu.value) emit('selectGame', ctxMenu.value.game)
  closeContextMenu()
}

const statusLabels: Record<GameStatus, string> = {
  want: '想玩',
  playing: '在玩',
  played: '已玩',
  shelved: '搁置',
  abandoned: '抛弃'
}

const handleStatusChange = async (game: GameRecord, status: GameStatus): Promise<void> => {
  try {
    await window.api.updateGame(game.id, { status })
    const g = store.allGames.find((x) => x.id === game.id)
    if (g) g.status = status
  } catch {
    // fallback silently
  }
  closeContextMenu()
}

const handleContextDelete = (): void => {
  if (!ctxMenu.value) return
  singleDeleteGame.value = ctxMenu.value.game
  closeContextMenu()
  showSingleDeleteConfirm.value = true
}

const toggleImportMenu = (): void => {
  showImportMenu.value = !showImportMenu.value
}

const handleManualImport = (): void => {
  showImportMenu.value = false
  showImportDialog.value = true
}

const handleBatchImport = (): void => {
  showImportMenu.value = false
  showBatchImportDialog.value = true
}

const handleImportClose = (): void => {
  showImportDialog.value = false
}

const handleImported = (game: GameRecord): void => {
  showImportDialog.value = false
  emit('selectGame', game)
}

const handleBatchImportClose = (): void => {
  showBatchImportDialog.value = false
}

const handleBatchImported = (result: ImportResult): void => {
  showBatchImportDialog.value = false
  const parts: string[] = []
  if (result.successCount > 0) parts.push(`成功 ${result.successCount} 个`)
  if (result.skippedCount > 0) parts.push(`跳过 ${result.skippedCount} 个`)
  if (result.failedCount > 0) parts.push(`失败 ${result.failedCount} 个`)
  const type = result.failedCount > 0 ? 'error' : 'success'
  showToastMsg(`导入完成：${parts.join('，')}`, type)
}
</script>

<template>
  <div class="library">
    <!-- 顶部工具栏 -->
    <LibraryToolbar
      :search-query="searchQuery"
      :view-mode="viewMode"
      :show-import-menu="showImportMenu"
      :batch-mode="batchMode"
      @update:search-query="searchQuery = $event"
      @update:view-mode="viewMode = $event"
      @toggle-import-menu="toggleImportMenu"
      @manual-import="handleManualImport"
      @batch-import="handleBatchImport"
      @toggle-batch-mode="toggleBatchMode"
    />

    <!-- 状态筛选 -->
    <LibraryFilterBar
      :filters="filters"
      :active-filter="activeFilter"
      @update:active-filter="activeFilter = $event"
    />

    <!-- 批量操作栏 -->
    <div class="batch-bar-stage" :class="{ 'batch-open': batchMode }">
      <LibraryBatchBar
        :batch-count="batchCount"
        :all-filtered-selected="allFilteredSelected"
        :status-filters="statusFilters"
        :show-batch-status-menu="showBatchStatusMenu"
        @toggle-select-all="toggleSelectAll"
        @toggle-batch-status="showBatchStatusMenu = !showBatchStatusMenu"
        @handle-batch-status="handleBatchStatus"
        @open-collection-picker="openCollectionPicker"
        @open-delete-confirm="openDeleteConfirm"
        @close-batch-status-menu="closeBatchStatusMenu"
      />
    </div>

    <!-- 排序栏 -->
    <div class="sort-bar">
      <span class="sort-label">排序</span>
      <button
        v-for="opt in sortOptions"
        :key="opt.key"
        class="sort-btn"
        :class="{ active: sortKey === opt.key }"
        @click="toggleSort(opt.key)"
      >
        {{ opt.label }}
        <span v-if="sortKey === opt.key" class="sort-arrow">{{
          sortDir === 'asc' ? '↑' : '↓'
        }}</span>
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="store.error" class="error-banner">
      <span>加载游戏失败：{{ store.error }}</span>
    </div>

    <!-- 骨架屏 -->
    <div v-if="store.isLoading" class="skeleton-grid">
      <div v-for="i in 8" :key="i" class="skeleton-card" />
    </div>

    <!-- 游戏列表 / 网格 -->
    <template v-else-if="filteredGames.length > 0">
      <GameGridView
        v-if="viewMode === 'grid'"
        :key="'grid-' + filterSortKey"
        :filtered-games="filteredGames"
        :batch-mode="batchMode"
        :selected-ids="selectedIds"
        @select-game="handleGameClick"
        @toggle-select-game="toggleSelectGame"
        @context-menu="handleContextMenu"
      />
      <GameListView
        v-else
        :key="'list-' + filterSortKey"
        :filtered-games="filteredGames"
        :batch-mode="batchMode"
        :selected-ids="selectedIds"
        :all-filtered-selected="allFilteredSelected"
        :status-labels="statusLabels"
        @select-game="handleGameClick"
        @toggle-select-game="toggleSelectGame"
        @toggle-select-all="toggleSelectAll"
        @context-menu="handleContextMenu"
      />
    </template>

    <!-- 空状态：游戏库为空 -->
    <div v-else-if="!store.error && store.games.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-25 mb-4">
        <path
          d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        />
      </svg>
      <p>游戏库还是空的</p>
      <button class="btn-primary btn-sm" @click="handleManualImport">导入你的第一个游戏</button>
    </div>

    <!-- 空状态：搜索无结果 -->
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-25 mb-4">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <p>没有找到匹配的游戏</p>
    </div>

    <!-- 右键菜单 -->
    <GameContextMenu
      :show="showCtxMenu"
      :x="ctxMenu?.x ?? 0"
      :y="ctxMenu?.y ?? 0"
      :status-filters="statusFilters"
      :game-status="ctxMenu?.game?.status ?? null"
      @view-detail="handleViewDetail"
      @add-to-collection="handleContextAddToCollection"
      @status-change="(s) => ctxMenu && handleStatusChange(ctxMenu.game, s)"
      @delete="handleContextDelete"
      @close="closeContextMenu"
    />

    <!-- 手动导入对话框 -->
    <ImportDialog :show="showImportDialog" @close="handleImportClose" @imported="handleImported" />

    <!-- 批量导入对话框 -->
    <BatchImportDialog
      :show="showBatchImportDialog"
      @close="handleBatchImportClose"
      @imported="handleBatchImported"
    />

    <!-- 收藏夹选择弹窗 -->
    <CollectionPickerDialog
      :show="showCollectionPicker"
      :selected-count="batchCount"
      @close="closeCollectionPicker"
      @select="handleAddToCollection"
    />

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="确认删除"
      :message="`确定要删除选中的 ${batchCount} 个游戏吗？此操作不可恢复。`"
      confirm-text="确认删除"
      danger
      @confirm="confirmBatchDelete"
      @cancel="closeDeleteConfirm"
    />

    <!-- 右键菜单删除确认弹窗 -->
    <ConfirmDialog
      :show="showSingleDeleteConfirm"
      title="确认删除"
      :message="`确定要删除「${singleDeleteGame?.title ?? ''}」吗？此操作不可恢复。`"
      confirm-text="确认删除"
      danger
      @confirm="confirmSingleDelete"
      @cancel="showSingleDeleteConfirm = false"
    />

    <!-- Toast 通知 -->
    <ToastNotification
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
    <!-- useToast hideToast unused by design: ToastNotification handles close via @close -->
  </div>
</template>

<style scoped>
.library {
  max-width: 100%;
  animation: fade-in-up 0.4s ease;
}

/* ===== 错误提示 ===== */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--text-primary);
  font-size: 13px;
}

/* ===== 骨架屏 ===== */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.skeleton-card {
  aspect-ratio: 3/4;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* ===== 排序栏 ===== */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.sort-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-right: 4px;
}

.sort-btn {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-tertiary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
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

.sort-arrow {
  margin-left: 2px;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.empty-state p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

/* 批量操作栏容器 — 过渡高度避免下方内容弹跳 */
.batch-bar-stage {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.15s ease;
  pointer-events: none;
}
.batch-bar-stage.batch-open {
  max-height: 500px;
  opacity: 1;
  pointer-events: auto;
}
</style>
