<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { GameRecord } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import { useToast } from '../composables/useToast'
import { useCollections } from '../composables/useCollections'
import type { UICollection } from '../composables/useCollections'
import CollectionsListView from './favorites/CollectionsListView.vue'
import CollectionGamesView from './favorites/CollectionGamesView.vue'
import CollectionFormModal from './favorites/CollectionFormModal.vue'
import ConfirmDialog from '../shared/ConfirmDialog.vue'
import ToastNotification from '../shared/ToastNotification.vue'

const store = useGameStore()

const props = defineProps<{ games?: GameRecord[] }>()
const emit = defineEmits<{ (e: 'selectGame', game: GameRecord): void }>()

const { collections, loadCollections, createCollection, renameCollection, deleteCollection } =
  useCollections()
const effectiveGames = computed(() => props.games || store.games)
const collectionGames = ref<Map<string, GameRecord[]>>(new Map())

// View mode
const viewMode = ref<'collections' | 'games'>('collections')
const selectedCollectionId = ref<string | null>(null)

// Modal state
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

// Search
const searchQuery = ref('')

// Collection batch
const batchMode = ref(false)
const colSelectedIds = ref<Set<string>>(new Set())
const showColBatchDeleteConfirm = ref(false)

// Game batch
const gameBatchMode = ref(false)
const gameSelectedIds = ref<string[]>([])
const showGameBatchRemoveConfirm = ref(false)

// Toast
const {
  show: showToast,
  message: toastMessage,
  type: toastType,
  showToast: showToastMsg
} = useToast()

// Data loading
let unmounted = false
onUnmounted(() => {
  unmounted = true
  if (favSyncTimer) clearTimeout(favSyncTimer)
})
const loadCollectionGames = async (): Promise<void> => {
  if (unmounted) return
  const gamesMap = await window.api.getAllCollectionGamesMap()
  if (unmounted) return
  const gameMap = new Map(effectiveGames.value.map((g) => [g.id, g]))
  for (const col of collections.value) {
    const gameIds = gamesMap[col.id] ?? []
    col.gameIds = gameIds
    collectionGames.value.set(
      col.id,
      gameIds.map((id) => gameMap.get(id) || ({ id } as GameRecord))
    )
  }
}
onMounted(async () => {
  await loadCollections()
  if (unmounted) return
  await loadCollectionGames()
})

// Computed
const sortedFilteredCollections = computed(() => {
  let list = collections.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) => c.name.toLowerCase().includes(q))
  }
  return [...list].sort((a, b) => {
    if (isDefault(a)) return -1
    if (isDefault(b)) return 1
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
  () =>
    colSelectedIds.value.size ===
      sortedFilteredCollections.value.filter((c) => !isDefault(c)).length &&
    colSelectedIds.value.size > 0
)
const hasBatchable = computed(() => sortedFilteredCollections.value.some((c) => !isDefault(c)))
const allGamesSelected = computed(
  () =>
    gameSelectedIds.value.length === currentCollectionGames.value.length &&
    gameSelectedIds.value.length > 0
)

// Default collection sync (debounced)
let favSyncTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => effectiveGames.value.filter((g) => g.favorite).map((g) => g.id),
  async (favIds) => {
    if (favSyncTimer) clearTimeout(favSyncTimer)
    favSyncTimer = setTimeout(async () => {
      const def = defaultCollection.value
      if (!def) return
      const colId = def.id
      const currentIds = new Set(collectionGames.value.get(colId)?.map((g) => g.id) || [])
      for (const id of favIds) {
        if (!currentIds.has(id)) {
          try {
            await window.api.addGameToCollection(id, colId)
          } catch {
            /* */
          }
        }
      }
      const games = await window.api.getCollectionGames(colId)
      collectionGames.value.set(colId, games)
      def.gameIds = games.map((g) => g.id)
    }, 500)
  },
  { immediate: true }
)

// Sort
const handleSort = (field: string): void => {
  const f = field as SortField
  if (sortField.value === f) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = f
    sortDirection.value = 'asc'
  }
  showSortMenu.value = false
}

// Collection batch
const toggleBatchMode = (): void => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) colSelectedIds.value = new Set()
}
const toggleColSelect = (id: string): void => {
  const next = new Set(colSelectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  colSelectedIds.value = next
}
const toggleSelectAllCols = (): void => {
  if (allColsSelected.value) colSelectedIds.value = new Set()
  else
    colSelectedIds.value = new Set(
      sortedFilteredCollections.value.filter((c) => !isDefault(c)).map((c) => c.id)
    )
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
      /* */
    }
  }
  colSelectedIds.value = new Set()
  batchMode.value = false
  showColBatchDeleteConfirm.value = false
  showToastMsg(`已删除 ${count} 个收藏夹`, 'success')
}

// Game batch
const toggleGameBatchMode = (): void => {
  gameBatchMode.value = !gameBatchMode.value
  if (!gameBatchMode.value) gameSelectedIds.value = []
}
const handleGameCardClick = (game: GameRecord): void => {
  if (gameBatchMode.value) toggleGameSelect(game.id)
  else emit('selectGame', game)
}
const toggleGameSelect = (id: string): void => {
  const idx = gameSelectedIds.value.indexOf(id)
  if (idx >= 0) gameSelectedIds.value.splice(idx, 1)
  else gameSelectedIds.value.push(id)
}
const toggleSelectAllGames = (): void => {
  if (allGamesSelected.value) gameSelectedIds.value = []
  else gameSelectedIds.value = currentCollectionGames.value.map((g) => g.id)
}
const handleBatchRemoveGames = async (): Promise<void> => {
  const colId = selectedCollectionId.value
  if (!colId) return
  let count = 0
  for (const gameId of gameSelectedIds.value) {
    try {
      await window.api.removeGameFromCollection(gameId, colId)
      count++
    } catch {
      /* */
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
  const moveCount = gameSelectedIds.value.length

  // Snapshot current collection memberships for rollback
  const snapshot = new Map<string, string[]>()
  for (const col of collections.value) {
    const games = await window.api.getCollectionGames(col.id)
    snapshot.set(
      col.id,
      games.map((g) => g.id)
    )
  }

  for (const gameId of gameSelectedIds.value) {
    try {
      for (const col of collections.value) {
        await window.api.removeGameFromCollection(gameId, col.id)
      }
      await window.api.addGameToCollection(gameId, targetId)
    } catch {
      // Rollback: restore game to its original collections
      for (const [colId, gameIds] of snapshot) {
        if (gameIds.includes(gameId)) {
          await window.api.addGameToCollection(gameId, colId).catch(() => {})
        }
      }
      showToastMsg('移动失败，已回滚', 'error')
      return
    }
  }
  const games = await window.api.getCollectionGames(colId)
  collectionGames.value.set(colId, games)
  const col = collections.value.find((c) => c.id === colId)
  if (col) col.gameIds = games.map((g) => g.id)
  const targetGames = await window.api.getCollectionGames(targetId)
  collectionGames.value.set(targetId, targetGames)
  const targetCol = collections.value.find((c) => c.id === targetId)
  if (targetCol) targetCol.gameIds = targetGames.map((g) => g.id)
  gameSelectedIds.value = []
  gameBatchMode.value = false
  modalMode.value = null
  showToastMsg(`已移动 ${moveCount} 个游戏`, 'success')
}
const handleMoveGame = async (gameId: string | undefined, targetId: string): Promise<void> => {
  if (gameBatchMode.value || !gameId) {
    await handleBatchMoveGames(targetId)
    return
  }
  for (const col of collections.value) {
    await window.api.removeGameFromCollection(gameId, col.id).catch(() => {})
    const games = collectionGames.value.get(col.id)
    if (games)
      collectionGames.value.set(
        col.id,
        games.filter((g) => g.id !== gameId)
      )
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

// Collection CRUD
const openCollection = (col: UICollection): void => {
  selectedCollectionId.value = col.id
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
const requestMoveGame = (game: GameRecord): void => {
  selectedGameForMove.value = game
  modalMode.value = 'move'
}
const handleCloseModal = (): void => {
  modalMode.value = null
  editingCollection.value = null
  selectedGameForMove.value = null
}
</script>

<template>
  <div class="h-full flex flex-col">
    <Transition name="view-fade" mode="out-in">
      <CollectionsListView
        v-if="viewMode === 'collections'"
        key="collections"
        :collections="sortedFilteredCollections"
        :search-query="searchQuery"
        :batch-mode="batchMode"
        :col-selected-ids="colSelectedIds"
        :has-batchable="hasBatchable"
        :all-cols-selected="allColsSelected"
        :show-sort-menu="showSortMenu"
        :sort-field="sortField"
        :sort-options="sortOptions"
        @update:search-query="searchQuery = $event"
        @toggle-batch-mode="toggleBatchMode"
        @toggle-sort-menu="showSortMenu = !showSortMenu"
        @sort="handleSort"
        @toggle-select-all-cols="toggleSelectAllCols"
        @toggle-col-select="toggleColSelect"
        @open-col-batch-delete-confirm="showColBatchDeleteConfirm = true"
        @open-collection="openCollection"
        @rename-collection="openRenameModal"
        @delete-collection="openDeleteModal"
        @create-collection="modalMode = 'create'"
      />
      <CollectionGamesView
        v-else
        key="games"
        :collection="selectedCollection || null"
        :games="currentCollectionGames"
        :collections="collections"
        :game-batch-mode="gameBatchMode"
        :game-selected-ids="gameSelectedIds"
        :all-games-selected="allGamesSelected"
        @back="backToCollections"
        @select-game="handleGameCardClick"
        @toggle-game-batch-mode="toggleGameBatchMode"
        @toggle-select-all-games="toggleSelectAllGames"
        @toggle-game-select="toggleGameSelect"
        @open-game-batch-remove-confirm="showGameBatchRemoveConfirm = true"
        @open-batch-move-modal="modalMode = 'move'"
        @move-game="requestMoveGame"
      />
    </Transition>

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
.h-full {
  animation: fade-in-up 0.4s ease;
}

.view-fade-enter-active,
.view-fade-leave-active {
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
}

.view-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
