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

const filteredCollections = computed(() => {
  if (!searchQuery.value) return collections.value
  const q = searchQuery.value.toLowerCase()
  return collections.value.filter((c) => c.name.toLowerCase().includes(q))
})

const selectedCollection = computed(() =>
  collections.value.find((c) => c.id === selectedCollectionId.value)
)

const currentCollectionGames = computed(
  () => collectionGames.value.get(selectedCollectionId.value || '') || []
)

const defaultCollection = computed(() => collections.value.find((c) => c.name === '最喜欢的游戏'))

const isDefault = (col: UICollection): boolean => col.name === '最喜欢的游戏'

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

const openCollection = (collection: UICollection): void => {
  selectedCollectionId.value = collection.id
  viewMode.value = 'games'
}

const backToCollections = (): void => {
  viewMode.value = 'collections'
  selectedCollectionId.value = null
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
  await renameCollection(id, name)
  modalMode.value = null
}

const handleDelete = async (id: string): Promise<void> => {
  await deleteCollection(id)
  collectionGames.value.delete(id)
  if (viewMode.value === 'games') viewMode.value = 'collections'
  selectedCollectionId.value = null
  modalMode.value = null
}

const handleMoveGame = async (gameId: string, targetId: string): Promise<void> => {
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

const openRenameModal = (col: UICollection): void => {
  editingCollection.value = col
  modalMode.value = 'rename'
}

const openDeleteModal = (col: UICollection): void => {
  editingCollection.value = col
  modalMode.value = 'delete'
}
const handleCloseModal = (): void => {
  modalMode.value = null
  editingCollection.value = null
  selectedGameForMove.value = null
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
          <button class="icon-btn" title="批量管理">
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
              <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
            </svg>
          </button>
          <button class="filter-btn">
            <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
              <path d="M3 4h18M6 4v10a6 6 0 006 6h0a6 6 0 006-6V4M12 20v-6" />
            </svg>
            <span>筛选</span>
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-current stroke-2 fill-none">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button class="add-btn" @click="modalMode = 'create'">
            <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>新建收藏夹</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 overflow-y-auto overflow-x-hidden pr-2 flex-1 content-start">
        <CollectionCard
          v-for="collection in filteredCollections"
          :key="collection.id"
          :collection="collection"
          :is-default="isDefault(collection)"
          @open="openCollection(collection)"
          @rename="openRenameModal(collection)"
          @delete="openDeleteModal(collection)"
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
      </div>

      <CollectionGameGrid
        :games="currentCollectionGames"
        :collections="collections"
        @select-game="emit('selectGame', $event)"
        @move-game="requestMoveGame($event)"
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
