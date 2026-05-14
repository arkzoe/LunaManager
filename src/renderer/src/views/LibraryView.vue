<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import type { GameRecord, GameStatus } from '../../../shared/types'
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

// Toast 通知
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
const showToastMsg = (msg: string, type: 'success' | 'error'): void => {
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
}

interface CollectionItem {
  id: string
  name: string
  gameIds: string[]
}

const collections = ref<CollectionItem[]>([])

const loadCollections = async (): Promise<void> => {
  try {
    const dbCols = await window.api.getCollections()
    const items: CollectionItem[] = []
    for (const c of dbCols) {
      const games = await window.api.getCollectionGames(c.id)
      items.push({ id: c.id, name: c.name, gameIds: games.map((g) => g.id) })
    }
    collections.value = items
  } catch { collections.value = [] }
}

const batchCount = computed(() => selectedIds.value.size)
const allFilteredSelected = computed(() =>
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
  const failed: string[] = []
  for (const id of ids) {
    try {
      await window.api.updateGame(id, { status } as any)
      const g = store.allGames.find((x) => x.id === id)
      if (g) g.status = status
    } catch {
      failed.push(id)
    }
  }
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
  let added = 0
  for (const id of ids) {
    if (!col.gameIds.includes(id)) {
      try {
        await window.api.addGameToCollection(id, collectionId)
        col.gameIds.push(id)
        added++
      } catch { /* skip */ }
    }
  }
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
  const failed: string[] = []
  for (const id of ids) {
    try {
      await window.api.deleteGame(id)
      store.games = store.games.filter((g) => g.id !== id) as any
    } catch {
      failed.push(id)
    }
  }
  if (failed.length > 0) {
    selectedIds.value = new Set(failed)
    showToastMsg(`${failed.length}/${ids.length} 个删除失败`, 'error')
  } else {
    showToastMsg(`已删除 ${ids.length} 个游戏`, 'success')
    selectedIds.value = new Set()
    batchMode.value = false
  }
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
  return list
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
  } catch (e) {
    // fallback silently
  }
  closeContextMenu()
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

const handleBatchImported = (_count: number): void => {
  showBatchImportDialog.value = false
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
    <LibraryBatchBar
      v-if="batchMode"
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

    <!-- 骨架屏 -->
    <div v-if="store.isLoading" class="skeleton-grid">
      <div v-for="i in 8" :key="i" class="skeleton-card" />
    </div>

    <!-- 游戏列表 / 网格 -->
    <template v-else-if="filteredGames.length > 0">
      <GameGridView
        v-if="viewMode === 'grid'"
        :filtered-games="filteredGames"
        :batch-mode="batchMode"
        :selected-ids="selectedIds"
        @select-game="handleGameClick"
        @toggle-select-game="toggleSelectGame"
        @context-menu="handleContextMenu"
      />
      <GameListView
        v-else
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
    <div v-else-if="store.games.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-25 mb-4">
        <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
      <p>游戏库还是空的</p>
      <button class="btn-brand btn-sm" @click="handleManualImport">导入你的第一个游戏</button>
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
      @status-change="(s) => ctxMenu && handleStatusChange(ctxMenu.game, s)"
      @close="closeContextMenu"
    />

    <!-- 手动导入对话框 -->
    <ImportDialog v-if="showImportDialog" @close="handleImportClose" @imported="handleImported" />

    <!-- 批量导入对话框 -->
    <BatchImportDialog
      v-if="showBatchImportDialog"
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
      :message="`确定要删除选中的 <strong>${batchCount}</strong> 个游戏吗？此操作不可恢复。`"
      confirm-text="确认删除"
      danger
      @confirm="confirmBatchDelete"
      @cancel="closeDeleteConfirm"
    />

    <!-- Toast 通知 -->
    <ToastNotification
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
  </div>
</template>

<style scoped>
.library {
  max-width: 1000px;
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

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
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

</style>
