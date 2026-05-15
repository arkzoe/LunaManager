<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { GameRecord } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import { useCollections } from '../composables/useCollections'
import type { UICollection } from '../composables/useCollections'
import { getIconSvg } from './favorites/icons'
import CollectionCard from './favorites/CollectionCard.vue'
import CollectionGameGrid from './favorites/CollectionGameGrid.vue'
import CollectionFormModal from './favorites/CollectionFormModal.vue'
import ConfirmDialog from '../shared/ConfirmDialog.vue'
import ToastNotification from '../shared/ToastNotification.vue'

const store = useGameStore()

const props = defineProps<{
  games?: GameRecord[]
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
}>()

const { collections, loadCollections, createCollection, renameCollection, deleteCollection } =
  useCollections()

const effectiveGames = computed(() => props.games || store.allGames)

const searchQuery = ref('')
const viewMode = ref<'collections' | 'games'>('collections')
const selectedCollectionId = ref<string | null>(null)

const collectionGames = ref<Map<string, GameRecord[]>>(new Map())

const modalMode = ref<'create' | 'rename' | 'delete' | 'move' | null>(null)
const editingCollection = ref<UICollection | null>(null)
const selectedGameForMove = ref<GameRecord | null>(null)

// Sort state
type SortField = 'name' | 'gameCount' | 'createdAt' | 'updatedAt'
const sortField = ref<SortField>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')
const showSortMenu = ref(false)

const sortOptions: { field: SortField; label: string }[] = [
  { field: 'name', label: '按名称' },
  { field: 'gameCount', label: '按游戏数量' },
  { field: 'createdAt', label: '按创建时间' },
  { field: 'updatedAt', label: '按更新时间' }
]

// Collection batch mode
const batchMode = ref(false)
const colSelectedIds = ref<Set<string>>(new Set())
const showColBatchDeleteConfirm = ref(false)

// Game batch mode (within a collection)
const gameBatchMode = ref(false)
const gameSelectedIds = ref<string[]>([])
const showGameBatchRemoveConfirm = ref(false)

// Toast
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
const showToast = ref(false)

const loadCollectionGames = async (): Promise<void> => {
  for (const col of collections.value) {
    const games = await window.api.getCollectionGames(col.id)
    collectionGames.value.set(col.id, games)
    col.gameIds = games.map((g) => g.id)
  }
}

onMounted(async () => {
  await loadCollections()
  await loadCollectionGames()
})

const sortedFilteredCollections = computed(() => {
  let list = collections.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) => c.name.toLowerCase().includes(q))
  }
  const sorted = [...list].sort((a, b) => {
    let cmp = 0
    switch (sortField.value) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'gameCount':
        cmp = a.gameIds.length - b.gameIds.length
        break
      case 'createdAt':
        cmp = a.createdAt - b.createdAt
        break
      case 'updatedAt':
        cmp = a.updatedAt - b.updatedAt
        break
    }
    return sortDirection.value === 'asc' ? cmp : -cmp
  })
  return sorted
})

const selectedCollection = computed(() =>
  collections.value.find((c) => c.id === selectedCollectionId.value)
)

const currentCollectionGames = computed(
  () => collectionGames.value.get(selectedCollectionId.value || '') || []
)

const defaultCollection = computed(() => collections.value.find((c) => c.name === '最喜欢的游戏'))

const isDefault = (col: UICollection): boolean => col.name === '最喜欢的游戏'

const allColsSelected = computed(
  () => colSelectedIds.value.size === sortedFilteredCollections.value.filter((c) => !isDefault(c)).length
    && colSelectedIds.value.size > 0
)

const hasBatchable = computed(() =>
  sortedFilteredCollections.value.some((c) => !isDefault(c))
)

const allGamesSelected = computed(
  () => gameSelectedIds.value.length === currentCollectionGames.value.length && gameSelectedIds.value.length > 0
)

watch(
  () => effectiveGames.value.filter((g) => g.favorite).map((g) => g.id),
  async (favIds) => {
    const def = defaultCollection.value
    if (!def) return
    const colId = def.id
    const currentIds = new Set(collectionGames.value.get(colId)?.map((g) => g.id) || [])
    for (const id of favIds) {
      if (!currentIds.has(id)) {
        try {
          await window.api.addGameToCollection(id, colId)
        } catch {
          /* ignore */
        }
      }
    }
    for (const id of currentIds) {
      if (!favIds.includes(id)) {
        try {
          await window.api.removeGameFromCollection(id, colId)
        } catch {
          /* ignore */
        }
      }
    }
    const games = await window.api.getCollectionGames(colId)
    collectionGames.value.set(colId, games)
    def.gameIds = games.map((g) => g.id)
  },
  { immediate: true }
)

// Sort handlers
const handleSortSelect = (field: SortField): void => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  showSortMenu.value = false
}

const getSortArrow = (field: SortField): string => {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

// Collection batch handlers
const toggleBatchMode = (): void => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    colSelectedIds.value = new Set()
  }
}

const toggleColSelect = (id: string): void => {
  const next = new Set(colSelectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  colSelectedIds.value = next
}

const toggleSelectAllCols = (): void => {
  if (allColsSelected.value) {
    colSelectedIds.value = new Set()
  } else {
    colSelectedIds.value = new Set(
      sortedFilteredCollections.value.filter((c) => !isDefault(c)).map((c) => c.id)
    )
  }
}

const handleBatchDeleteCols = async (): Promise<void> => {
  const ids = [...colSelectedIds.value]
  let count = 0
  for (const id of ids) {
    const col = collections.value.find((c) => c.id === id)
    if (col && isDefault(col)) continue
    try {
      await deleteCollection(id)
      collectionGames.value.delete(id)
      count++
    } catch {
      /* ignore */
    }
  }
  colSelectedIds.value = new Set()
  batchMode.value = false
  showColBatchDeleteConfirm.value = false
  showToastMsg(`已删除 ${count} 个收藏夹`, 'success')
}

// Game batch handlers
const toggleGameBatchMode = (): void => {
  gameBatchMode.value = !gameBatchMode.value
  if (!gameBatchMode.value) {
    gameSelectedIds.value = []
  }
}

const handleGameCardClick = (game: GameRecord): void => {
  if (gameBatchMode.value) {
    toggleGameSelect(game.id)
  } else {
    emit('selectGame', game)
  }
}

const toggleGameSelect = (id: string): void => {
  const idx = gameSelectedIds.value.indexOf(id)
  if (idx >= 0) {
    gameSelectedIds.value.splice(idx, 1)
  } else {
    gameSelectedIds.value.push(id)
  }
}

const toggleSelectAllGames = (): void => {
  if (allGamesSelected.value) {
    gameSelectedIds.value = []
  } else {
    gameSelectedIds.value = currentCollectionGames.value.map((g) => g.id)
  }
}

const handleBatchRemoveGames = async (): Promise<void> => {
  const colId = selectedCollectionId.value
  if (!colId) return
  const ids = Array.from(gameSelectedIds.value)
  let count = 0
  for (const gameId of ids) {
    try {
      await window.api.removeGameFromCollection(gameId, colId)
      count++
    } catch {
      /* ignore */
    }
  }
  const games = await window.api.getCollectionGames(colId)
  collectionGames.value.set(colId, games)
  const col = collections.value.find((c) => c.id === colId)
  if (col) col.gameIds = games.map((g) => g.id)
  gameSelectedIds.value = []
  gameBatchMode.value = false
  showGameBatchRemoveConfirm.value = false
  showToastMsg(`已从收藏夹移出 ${count} 个游戏`, 'success')
}

const handleBatchMoveGames = async (targetId: string): Promise<void> => {
  const colId = selectedCollectionId.value
  if (!colId) return
  const ids = Array.from(gameSelectedIds.value)
  const moveCount = ids.length
  for (const gameId of ids) {
    for (const col of collections.value) {
      await window.api.removeGameFromCollection(gameId, col.id).catch(() => {})
    }
    await window.api.addGameToCollection(gameId, targetId)
  }
  // Refresh source collection games
  const games = await window.api.getCollectionGames(colId)
  collectionGames.value.set(colId, games)
  const col = collections.value.find((c) => c.id === colId)
  if (col) col.gameIds = games.map((g) => g.id)
  // Refresh target collection games
  const targetGames = await window.api.getCollectionGames(targetId)
  collectionGames.value.set(targetId, targetGames)
  const targetCol = collections.value.find((c) => c.id === targetId)
  if (targetCol) targetCol.gameIds = targetGames.map((g) => g.id)
  gameSelectedIds.value = []
  gameBatchMode.value = false
  modalMode.value = null
  showToastMsg(`已移动 ${moveCount} 个游戏`, 'success')
}

const openBatchMoveModal = (): void => {
  modalMode.value = 'move'
}

const handleMoveGame = async (gameId: string, targetId: string): Promise<void> => {
  if (gameBatchMode.value) {
    await handleBatchMoveGames(targetId)
    return
  }
  for (const col of collections.value) {
    await window.api.removeGameFromCollection(gameId, col.id).catch(() => {})
    const games = collectionGames.value.get(col.id)
    if (games) {
      collectionGames.value.set(
        col.id,
        games.filter((g) => g.id !== gameId)
      )
    }
    col.gameIds = (collectionGames.value.get(col.id) || []).map((g) => g.id)
  }
  await window.api.addGameToCollection(gameId, targetId)
  const targetGames = await window.api.getCollectionGames(targetId)
  collectionGames.value.set(targetId, targetGames)
  const targetCol = collections.value.find((c) => c.id === targetId)
  if (targetCol) targetCol.gameIds = targetGames.map((g) => g.id)
  modalMode.value = null
  selectedGameForMove.value = null
}

const requestMoveGame = (game: GameRecord): void => {
  selectedGameForMove.value = game
  modalMode.value = 'move'
}

const openCollection = (collection: UICollection): void => {
  selectedCollectionId.value = collection.id
  viewMode.value = 'games'
  gameBatchMode.value = false
  gameSelectedIds.value = []
}

const backToCollections = (): void => {
  viewMode.value = 'collections'
  selectedCollectionId.value = null
  gameBatchMode.value = false
  gameSelectedIds.value = []
}

const handleCreate = async (name: string): Promise<void> => {
  await createCollection(name)
  const last = collections.value[collections.value.length - 1]
  if (last) {
    collectionGames.value.set(last.id, [])
    last.gameIds = []
  }
  modalMode.value = null
}

const handleRename = async (id: string, name: string): Promise<void> => {
  if (id === defaultCollection.value?.id) return
  await renameCollection(id, name)
  modalMode.value = null
}

const handleDelete = async (id: string): Promise<void> => {
  if (id === defaultCollection.value?.id) return
  await deleteCollection(id)
  collectionGames.value.delete(id)
  if (viewMode.value === 'games') viewMode.value = 'collections'
  selectedCollectionId.value = null
  modalMode.value = null
}

const openRenameModal = (col: UICollection): void => {
  if (isDefault(col)) return
  editingCollection.value = col
  modalMode.value = 'rename'
}

const openDeleteModal = (col: UICollection): void => {
  if (isDefault(col)) return
  editingCollection.value = col
  modalMode.value = 'delete'
}

const handleCloseModal = (): void => {
  modalMode.value = null
  editingCollection.value = null
  selectedGameForMove.value = null
}

const showToastMsg = (message: string, type: 'success' | 'error' = 'success'): void => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2000)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <template v-if="viewMode === 'collections'">
      <div class="toolbar">
        <div class="search-box">
          <svg
            viewBox="0 0 24 24"
            class="absolute left-3 w-4.5 h-4.5 fill-text-muted pointer-events-none"
          >
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索收藏夹..."
            class="search-input"
          />
        </div>
        <div class="toolbar-actions">
          <button
            v-if="batchMode || hasBatchable"
            class="icon-btn"
            :class="{ 'bg-brand-500/10 border-brand-500 text-brand-500': batchMode }"
            title="批量管理"
            @click="toggleBatchMode"
          >
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
              <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
            </svg>
          </button>
          <div class="filter-wrap">
            <button class="filter-btn" @click="showSortMenu = !showSortMenu">
              <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
                <path d="M3 4h18M6 4v10a6 6 0 006 6h0a6 6 0 006-6V4M12 20v-6" />
              </svg>
              <span>{{ sortOptions.find((o) => o.field === sortField)?.label }}</span>
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-current stroke-2 fill-none">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div v-if="showSortMenu" class="context-overlay" @click="showSortMenu = false" />
            <div v-if="showSortMenu" class="sort-menu">
              <button
                v-for="opt in sortOptions"
                :key="opt.field"
                class="sort-option"
                :class="{ active: sortField === opt.field }"
                @click="handleSortSelect(opt.field)"
              >
                <span>{{ opt.label }}</span>
                <span v-if="sortField === opt.field" class="sort-arrow">{{ getSortArrow(opt.field) }}</span>
                <span v-else class="sort-arrow-dim">↕</span>
              </button>
            </div>
          </div>
          <button class="add-btn" @click="modalMode = 'create'">
            <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>新建收藏夹</span>
          </button>
        </div>
      </div>

      <div v-if="batchMode" class="batch-bar">
        <span class="bb-count">已选 {{ colSelectedIds.size }} 项</span>
        <button class="bb-btn" @click="toggleSelectAllCols">
          {{ allColsSelected ? '取消全选' : '全选' }}
        </button>
        <button
          class="bb-btn bb-danger"
          :disabled="colSelectedIds.size === 0"
          @click="showColBatchDeleteConfirm = true"
        >
          删除选中
        </button>
      </div>

      <div
        class="flex flex-wrap gap-4 overflow-y-auto overflow-x-hidden pr-2 flex-1 content-start"
        :class="{ 'mt-3': batchMode }"
      >
        <CollectionCard
          v-for="collection in sortedFilteredCollections"
          :key="collection.id"
          :collection="collection"
          :is-default="isDefault(collection)"
          :batch-mode="batchMode"
          :selected="colSelectedIds.has(collection.id)"
          @open="openCollection(collection)"
          @rename="openRenameModal(collection)"
          @delete="openDeleteModal(collection)"
          @toggle-select="toggleColSelect"
        />
      </div>
    </template>

    <template v-else>
      <div class="mb-6">
        <button class="back-btn" @click="backToCollections">
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          <span>返回收藏夹</span>
        </button>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 flex items-center justify-center rounded-lg"
              :style="{ backgroundColor: selectedCollection?.iconColor + '20' }"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-4.5 h-4.5"
                :style="{ fill: selectedCollection?.iconColor }"
              >
                <path :d="getIconSvg(selectedCollection?.icon || 'folder')" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-text-primary m-0 mb-1">
                {{ selectedCollection?.name }}
              </h2>
              <span class="text-sm text-text-muted">
                {{ selectedCollection?.gameIds.length }} 个游戏
              </span>
            </div>
          </div>
          <button
            class="icon-btn"
            :class="{ 'bg-brand-500/10 border-brand-500 text-brand-500': gameBatchMode }"
            title="批量管理"
            @click="toggleGameBatchMode"
          >
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
              <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="gameBatchMode" class="batch-bar">
        <span class="bb-count">已选 {{ gameSelectedIds.length }} 项</span>
        <button class="bb-btn" @click="toggleSelectAllGames">
          {{ allGamesSelected ? '取消全选' : '全选' }}
        </button>
        <button
          class="bb-btn bb-danger"
          :disabled="gameSelectedIds.length === 0"
          @click="showGameBatchRemoveConfirm = true"
        >
          移出收藏夹
        </button>
        <button
          class="bb-btn"
          :disabled="gameSelectedIds.length === 0"
          @click="openBatchMoveModal"
        >
          移动到...
        </button>
      </div>

      <CollectionGameGrid
        :games="currentCollectionGames"
        :collections="collections"
        :batch-mode="gameBatchMode"
        :selected-ids="gameSelectedIds"
        @card-click="handleGameCardClick($event)"
        @move-game="requestMoveGame($event)"
        @toggle-select="toggleGameSelect($event)"
      />
    </template>

    <CollectionFormModal
      :show="modalMode !== null"
      :mode="modalMode || 'create'"
      :collection="editingCollection || undefined"
      :collections="collections"
      :game="selectedGameForMove || undefined"
      @create="handleCreate"
      @rename="handleRename"
      @delete="handleDelete"
      @move="handleMoveGame"
      @close="handleCloseModal"
    />

    <ConfirmDialog
      :show="showColBatchDeleteConfirm"
      title="批量删除收藏夹"
      :message="`确定要删除选中的 ${colSelectedIds.size} 个收藏夹吗？收藏夹中的游戏不会被删除。`"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="handleBatchDeleteCols"
      @cancel="showColBatchDeleteConfirm = false"
    />

    <ConfirmDialog
      :show="showGameBatchRemoveConfirm"
      title="批量移出游戏"
      :message="`确定要将选中的 ${gameSelectedIds.length} 个游戏移出「${selectedCollection?.name}」吗？`"
      confirm-text="移出"
      cancel-text="取消"
      @confirm="handleBatchRemoveGames"
      @cancel="showGameBatchRemoveConfirm = false"
    />

    <ToastNotification
      v-if="showToast"
      :type="toastType"
      :message="toastMessage"
      @close="showToast = false"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 320px;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 40px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 200ms ease;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 200ms ease;
}

.icon-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color-medium);
}

.filter-wrap {
  position: relative;
}

.filter-btn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}

.filter-btn:hover {
  background: var(--bg-secondary);
}

.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.sort-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 160px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  overflow: hidden;
  margin-top: 4px;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.1s;
  text-align: left;
}

.sort-option:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sort-option.active {
  color: var(--accent-primary);
  font-weight: 600;
}

.sort-arrow {
  font-size: 14px;
  color: var(--accent-primary);
}

.sort-arrow-dim {
  font-size: 14px;
  color: var(--text-muted);
  opacity: 0.4;
}

.add-btn {
  height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: #6366f1;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
}

.add-btn:hover {
  background: #4f46e5;
}

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

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}

.back-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

svg {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
