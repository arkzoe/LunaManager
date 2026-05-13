<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import GameCard from './shared/GameCard.vue'
import type { GameRecord, GameStatus } from '../../../shared/types'
import { formatRelativeTime } from '../utils/format'
import ImportDialog from './ImportDialog.vue'
import BatchImportDialog from './BatchImportDialog.vue'
import ToastNotification from './ToastNotification.vue'

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
const importBtnRef = ref<HTMLElement | null>(null)

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

const closeImportMenu = (): void => {
  showImportMenu.value = false
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
    <div class="toolbar">
      <div class="search-box">
        <svg
          viewBox="0 0 24 24"
          class="search-icon"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input v-model="searchQuery" placeholder="搜索游戏名称..." class="search-input" />
      </div>

      <div class="tb-actions">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button
            class="vt-btn"
            :class="{ active: viewMode === 'grid' }"
            title="网格视图"
            @click="viewMode = 'grid'"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
            </svg>
          </button>
          <button
            class="vt-btn"
            :class="{ active: viewMode === 'list' }"
            title="列表视图"
            @click="viewMode = 'list'"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
          </button>
        </div>

        <!-- 批量操作按钮 -->
        <button
          class="btn-outline btn-sm"
          :class="{ active: batchMode }"
          @click="toggleBatchMode"
        >
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
            <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
          </svg>
          批量操作
        </button>

        <!-- 导入按钮下拉菜单 -->
        <div class="import-dropdown">
          <button
            ref="importBtnRef"
            class="btn-brand btn-sm"
            @click="toggleImportMenu"
          >
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            导入
            <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current dropdown-arrow">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
          <div
            v-if="showImportMenu"
            class="import-menu-local"
          >
            <button class="ctx-item" @click="handleManualImport">
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              手动导入
            </button>
            <button class="ctx-item" @click="handleBatchImport">
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm0-4H6v-2h8v2z" />
              </svg>
              批量导入
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态筛选 -->
    <div class="filters-bar">
      <button
        v-for="f in filters"
        :key="f.id"
        class="filter-btn"
        :class="{ active: activeFilter === f.id }"
        @click="activeFilter = f.id"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="batchMode" class="batch-bar">
      <span class="bb-count">已选 {{ batchCount }} 项</span>
      <button class="bb-btn" @click="toggleSelectAll">
        {{ allFilteredSelected ? '取消全选' : '全选' }}
      </button>
      <div class="bb-status-wrap">
        <button class="bb-btn" @click="showBatchStatusMenu = !showBatchStatusMenu" :disabled="batchCount === 0">
          修改状态
          <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current"><path d="M7 10l5 5 5-5z" /></svg>
        </button>
        <Teleport to="body">
          <div v-if="showBatchStatusMenu" class="context-overlay" @click="closeBatchStatusMenu" />
          <div v-if="showBatchStatusMenu" class="batch-status-menu">
            <button
              v-for="f in statusFilters"
              :key="f.id"
              class="ctx-item"
              @click="handleBatchStatus(f.id)"
            >
              {{ f.label }}
            </button>
          </div>
        </Teleport>
      </div>
      <button class="bb-btn" :disabled="batchCount === 0" @click="openCollectionPicker">添加到收藏夹</button>
      <button class="bb-btn bb-danger" :disabled="batchCount === 0" @click="openDeleteConfirm">删除</button>
    </div>

    <!-- 骨架屏 -->
    <div v-if="store.isLoading" class="skeleton-grid">
      <div v-for="i in 8" :key="i" class="skeleton-card" />
    </div>

    <!-- 游戏列表 / 网格 -->
    <div v-else-if="filteredGames.length > 0">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="game-grid">
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="grid-item"
          :class="{ 'batch-active': batchMode }"
          @click="handleGameClick(game)"
          @contextmenu="handleContextMenu($event, game)"
        >
          <label v-if="batchMode" class="grid-check">
            <input
              type="checkbox"
              :checked="selectedIds.has(game.id)"
              @change="toggleSelectGame(game.id)"
              class="grid-cb"
            />
          </label>
          <GameCard :game="game" />
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="game-list">
        <div class="list-header" :class="{ 'has-check': batchMode }">
          <span v-if="batchMode" class="lh-check">
            <input type="checkbox" :checked="allFilteredSelected" @change="toggleSelectAll" class="list-cb" />
          </span>
          <span class="lh-col lh-cover">&nbsp;</span>
          <span class="lh-col lh-name">名称</span>
          <span class="lh-col lh-status">状态</span>
          <span class="lh-col lh-rating">评分</span>
          <span class="lh-col lh-playtime">时长</span>
          <span class="lh-col lh-last">最后游玩</span>
        </div>
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="list-row"
          :class="{ 'has-check': batchMode }"
          @click="handleGameClick(game)"
          @contextmenu="handleContextMenu($event, game)"
        >
          <div v-if="batchMode" class="lr-check">
            <input
              type="checkbox"
              :checked="selectedIds.has(game.id)"
              @change="toggleSelectGame(game.id)"
              class="list-cb"
            />
          </div>
          <div class="lr-cover">
            <img v-if="game.cover" :src="game.cover" :alt="game.title" class="lr-cover-img" />
            <div v-else class="lr-cover-ph">
              <svg viewBox="0 0 24 24" class="w-4 h-4 fill-text-muted opacity-30">
                <path
                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                />
              </svg>
            </div>
          </div>
          <span class="lr-name">{{ game.title_cn || game.title }}</span>
          <span class="lr-status">
            <span class="status-tag" :class="game.status">{{ statusLabels[game.status] }}</span>
          </span>
          <span class="lr-rating">{{
            game.personal_rating ? game.personal_rating + '/10' : '-'
          }}</span>
          <span class="lr-playtime">{{ game.playtime || '-' }}</span>
          <span class="lr-last">{{ formatRelativeTime(game.last_played) || '-' }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态：游戏库为空 -->
    <div v-else-if="store.games.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-25 mb-4">
        <path
          d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        />
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
    <Teleport to="body">
      <div
        v-if="showCtxMenu"
        class="context-overlay"
        @click="closeContextMenu"
        @contextmenu.prevent="closeContextMenu"
      />
      <div
        v-if="showCtxMenu && ctxMenu"
        class="context-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
      >
        <button class="ctx-item" @click="handleViewDetail">
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
            <path
              d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
            />
          </svg>
          查看详情
        </button>
        <div class="ctx-divider" />
        <div class="ctx-label">更改状态</div>
        <button
          v-for="s in statusFilters"
          :key="s.id"
          class="ctx-item"
          :class="{ current: ctxMenu.game.status === s.id }"
          @click="handleStatusChange(ctxMenu.game, s.id)"
        >
          {{ s.label }}
        </button>
        <div class="ctx-divider" />
        <button class="ctx-item danger" @click="closeContextMenu()">
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
            <path
              d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
            />
          </svg>
          删除
        </button>
      </div>
    </Teleport>

    <!-- 手动导入对话框 -->
    <ImportDialog v-if="showImportDialog" @close="handleImportClose" @imported="handleImported" />

    <!-- 批量导入对话框 -->
    <BatchImportDialog
      v-if="showBatchImportDialog"
      @close="handleBatchImportClose"
      @imported="handleBatchImported"
    />

    <!-- 收藏夹选择弹窗 -->
    <Teleport to="body">
      <div v-if="showCollectionPicker" class="modal-overlay" @click.self="closeCollectionPicker">
        <div class="modal-card">
          <h3 class="modal-title">添加到收藏夹</h3>
          <div class="modal-list">
            <button
              v-for="col in collections"
              :key="col.id"
              class="modal-list-item"
              @click="handleAddToCollection(col.id)"
            >
              <span class="modal-list-name">{{ col.name }}</span>
              <span class="modal-list-count">{{ col.gameIds.length }} 个游戏</span>
            </button>
            <div v-if="collections.length === 0" class="modal-empty">暂无收藏夹，请先在收藏页面创建</div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="closeCollectionPicker">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteConfirm">
        <div class="modal-card">
          <h3 class="modal-title">确认删除</h3>
          <p class="modal-desc">确定要删除选中的 <strong>{{ batchCount }}</strong> 个游戏吗？此操作不可恢复。</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="closeDeleteConfirm">取消</button>
            <button class="btn-danger" @click="confirmBatchDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>

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

/* ===== 工具栏 ===== */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 0 12px 0 34px;
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

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.tb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.vt-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}

.vt-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.vt-btn.active {
  background: var(--bg-active);
  color: var(--accent-primary);
}

/* ===== 导入下拉菜单 ===== */
.import-dropdown {
  position: relative;
}

.dropdown-arrow {
  margin-left: 2px;
}

.import-menu-local {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  z-index: 100;
  min-width: 140px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 6px;
  overflow: hidden;
}

/* ===== 筛选栏 ===== */
.filters-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:hover {
  border-color: var(--border-color-medium);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

/* ===== 游戏网格 ===== */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.grid-item {
  cursor: pointer;
}

/* ===== 游戏列表 ===== */
.game-list {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 44px 2fr 80px 60px 70px 100px;
  align-items: center;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.list-row {
  display: grid;
  grid-template-columns: 44px 2fr 80px 60px 70px 100px;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-color-light);
}

.list-row:last-child {
  border-bottom: none;
}

.list-row:hover {
  background: var(--bg-hover);
}

.lr-cover {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lr-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lr-cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lr-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.lr-rating,
.lr-playtime,
.lr-last {
  font-size: 12px;
  color: var(--text-tertiary);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-tag.want {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent-primary);
}
.status-tag.playing {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.status-tag.played {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}
.status-tag.shelved {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}
.status-tag.abandoned {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
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

/* ===== 右键菜单 ===== */
.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 160px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 6px;
  overflow: hidden;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.1s;
  text-align: left;
}

.ctx-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.ctx-item.current {
  color: var(--accent-primary);
  font-weight: 600;
}

.ctx-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.ctx-divider {
  height: 1px;
  background: var(--border-color-light);
  margin: 4px 6px;
}

.ctx-label {
  padding: 6px 10px 2px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== 批量操作按钮 ===== */
.btn-outline {
  height: 34px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-outline:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-outline.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

/* ===== 批量操作栏 ===== */
.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.bb-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 4px;
}

.bb-btn {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.bb-btn:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.bb-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.bb-danger:hover:not(:disabled) {
  border-color: var(--danger);
  color: var(--danger);
}

.bb-status-wrap {
  position: relative;
}

.batch-status-menu {
  position: fixed;
  z-index: 1000;
  min-width: 120px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  overflow: hidden;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* ===== 网格勾选框 ===== */
.grid-item {
  position: relative;
  cursor: pointer;
}

.grid-item.batch-active {
  cursor: default;
}

.grid-check {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  cursor: pointer;
}

.grid-cb {
  accent-color: var(--accent-primary);
}

/* ===== 列表勾选框 ===== */
.lh-check {
  display: flex;
  align-items: center;
}

.lr-check {
  display: flex;
  align-items: center;
}

.list-cb {
  accent-color: var(--accent-primary);
}

.list-header.has-check {
  grid-template-columns: 36px 40px 2fr 80px 60px 70px 100px;
}

.list-row.has-check {
  grid-template-columns: 36px 40px 2fr 80px 60px 70px 100px;
}

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  width: 360px;
  max-width: 90vw;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  padding: 20px;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.modal-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}

.modal-list {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.1s;
  text-align: left;
}

.modal-list-item:hover {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.04);
}

.modal-list-name {
  font-weight: 600;
}

.modal-list-count {
  font-size: 11px;
  color: var(--text-tertiary);
}

.modal-empty {
  text-align: center;
  padding: 20px 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-danger {
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--danger);
  color: white;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover {
  opacity: 0.85;
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
</style>
