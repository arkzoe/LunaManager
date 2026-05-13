<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { GameRecord, Collection as DBCollection } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import GameCard from './shared/GameCard.vue'

interface UICollection {
  id: string
  name: string
  icon: string
  iconColor: string
  gameIds: string[]
  createdAt: number
}

const store = useGameStore()

const props = defineProps<{
  games?: GameRecord[]
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
}>()

const effectiveGames = computed(() => props.games || store.allGames)

const searchQuery = ref('')
const viewMode = ref<'collections' | 'games'>('collections')
const selectedCollectionId = ref<string | null>(null)

const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const showMoveModal = ref(false)
const newCollectionName = ref('')
const renameCollectionName = ref('')
const selectedGameForMove = ref<GameRecord | null>(null)

const collections = ref<UICollection[]>([])
const collectionGames = ref<Map<string, GameRecord[]>>(new Map())

const defaultIconColor = '#4f46e5'

const mapDBCollection = (db: DBCollection): UICollection => ({
  id: db.id,
  name: db.name,
  icon: 'folder',
  iconColor: defaultIconColor,
  gameIds: [],
  createdAt: db.created_at
})

const loadCollections = async (): Promise<void> => {
  try {
    let dbCols = await window.api.getCollections()

    // Find default favorites by name, not by hardcoded ID
    const defaultName = '最喜欢的游戏'
    let defaultCol = dbCols.find((c) => c.name === defaultName)
    if (!defaultCol) {
      defaultCol = await window.api.createCollection(defaultName)
      dbCols = [...dbCols, defaultCol]
    }
    // Remember the actual DB-assigned ID
    const defaultId = defaultCol.id

    collections.value = dbCols.map(mapDBCollection)

    // Apply heart icon to the default collection
    const def = collections.value.find((c) => c.id === defaultId)
    if (def) {
      def.icon = 'heart'
      def.iconColor = '#ec4899'
    }

    // Load games for each collection
    for (const col of collections.value) {
      const games = await window.api.getCollectionGames(col.id)
      collectionGames.value.set(col.id, games)
      col.gameIds = games.map((g) => g.id)
    }
  } catch {
    // DB not available, use empty
    collections.value = []
  }
}

onMounted(() => {
  loadCollections()
})

// Sync favorited games to default-favorites collection
watch(
  () => effectiveGames.value.filter((g) => g.favorite).map((g) => g.id),
  async (favIds) => {
    const defaultCol = collections.value.find((c) => c.name === '最喜欢的游戏')
    if (!defaultCol) return
    const colId = defaultCol.id
    const currentIds = new Set(collectionGames.value.get(colId)?.map((g) => g.id) || [])
    for (const id of favIds) {
      if (!currentIds.has(id)) {
        try { await window.api.addGameToCollection(id, colId) } catch { /* ignore */ }
      }
    }
    for (const id of currentIds) {
      if (!favIds.includes(id)) {
        try { await window.api.removeGameFromCollection(id, colId) } catch { /* ignore */ }
      }
    }
    const games = await window.api.getCollectionGames(colId)
    collectionGames.value.set(colId, games)
    defaultCol.gameIds = games.map((g) => g.id)
  },
  { immediate: true }
)

const filteredCollections = computed(() => {
  if (!searchQuery.value) return collections.value
  const query = searchQuery.value.toLowerCase()
  return collections.value.filter((c) => c.name.toLowerCase().includes(query))
})

const selectedCollection = computed(() =>
  collections.value.find((c) => c.id === selectedCollectionId.value)
)

const currentCollectionGames = computed(() =>
  collectionGames.value.get(selectedCollectionId.value || '') || []
)

const createCollection = async (): Promise<void> => {
  if (!newCollectionName.value.trim()) return
  try {
    const dbCol = await window.api.createCollection(newCollectionName.value.trim())
    const ui = mapDBCollection(dbCol)
    collections.value.push(ui)
    collectionGames.value.set(ui.id, [])
  } catch { /* ignore */ }
  newCollectionName.value = ''
  showCreateModal.value = false
}

const startRename = (collection: UICollection): void => {
  selectedCollectionId.value = collection.id
  renameCollectionName.value = collection.name
  showRenameModal.value = true
}

const confirmRename = async (): Promise<void> => {
  if (!renameCollectionName.value.trim() || !selectedCollectionId.value) return
  try {
    await window.api.renameCollection(selectedCollectionId.value, renameCollectionName.value.trim())
    const col = collections.value.find((c) => c.id === selectedCollectionId.value)
    if (col) col.name = renameCollectionName.value.trim()
  } catch { /* ignore */ }
  renameCollectionName.value = ''
  showRenameModal.value = false
}

const startDelete = (collection: UICollection): void => {
  selectedCollectionId.value = collection.id
  showDeleteModal.value = true
}

const confirmDelete = async (): Promise<void> => {
  if (!selectedCollectionId.value) return
  try {
    await window.api.deleteCollection(selectedCollectionId.value)
  } catch { /* ignore */ }
  const id = selectedCollectionId.value
  collections.value = collections.value.filter((c) => c.id !== id)
  collectionGames.value.delete(id)
  if (viewMode.value === 'games') viewMode.value = 'collections'
  selectedCollectionId.value = null
  showDeleteModal.value = false
}

const openCollection = (collection: UICollection): void => {
  selectedCollectionId.value = collection.id
  viewMode.value = 'games'
}

const backToCollections = (): void => {
  viewMode.value = 'collections'
  selectedCollectionId.value = null
}

const openMoveModal = (game: GameRecord): void => {
  selectedGameForMove.value = game
  showMoveModal.value = true
}

const moveGameToCollection = async (targetId: string): Promise<void> => {
  if (!selectedGameForMove.value) return
  const gameId = selectedGameForMove.value.id
  try {
    // Remove from all collections
    for (const col of collections.value) {
      await window.api.removeGameFromCollection(gameId, col.id).catch(() => {})
      const games = collectionGames.value.get(col.id)
      if (games) collectionGames.value.set(col.id, games.filter((g) => g.id !== gameId))
      col.gameIds = (collectionGames.value.get(col.id) || []).map((g) => g.id)
    }
    // Add to target
    await window.api.addGameToCollection(gameId, targetId)
    const targetGames = await window.api.getCollectionGames(targetId)
    collectionGames.value.set(targetId, targetGames)
    const targetCol = collections.value.find((c) => c.id === targetId)
    if (targetCol) targetCol.gameIds = targetGames.map((g) => g.id)
  } catch { /* ignore */ }
  selectedGameForMove.value = null
  showMoveModal.value = false
}

// 获取图标SVG
const getIconSvg = (iconName: string): string => {
  const icons: Record<string, string> = {
    heart:
      'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    folder:
      'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    game: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'
  }
  return icons[iconName] || icons.folder
}

const handleGameClick = (game: GameRecord): void => {
  emit('selectGame', game)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 收藏夹列表视图 -->
    <template v-if="viewMode === 'collections'">
      <!-- 工具栏 -->
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
          <button class="add-btn" @click="showCreateModal = true">
            <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>新建收藏夹</span>
          </button>
        </div>
      </div>

      <!-- 收藏夹网格 -->
      <div class="flex flex-wrap gap-4 overflow-y-auto overflow-x-hidden pr-2 flex-1 content-start">
        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          class="collection-card w-70 h-20 flex items-center gap-4 p-4 bg-bg-primary rounded-xl cursor-pointer transition-all duration-250 flex-shrink-0 box-border hover:-translate-y-0.5"
          @click="openCollection(collection)"
        >
          <div
            class="w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0"
            :style="{ backgroundColor: collection.iconColor + '20' }"
          >
            <svg viewBox="0 0 24 24" class="w-6 h-6" :style="{ fill: collection.iconColor }">
              <path :d="getIconSvg(collection.icon)" />
            </svg>
          </div>
          <div class="w-35 h-12 flex flex-col justify-center">
            <h3
              class="w-full h-5.5 text-15px font-semibold text-text-primary m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis leading-5.5"
            >
              {{ collection.name }}
            </h3>
            <p class="w-full h-4.5 text-13px text-text-muted m-0 leading-4.5">
              {{ collection.gameIds.length }} 个游戏
            </p>
          </div>
          <div
            class="flex items-center gap-1 opacity-0 transition-opacity duration-200 collection-card:hover:opacity-100"
            @click.stop
          >
            <button
              v-if="collection.name !== '最喜欢的游戏'"
              class="action-menu-btn"
              title="重命名"
              @click="startRename(collection)"
            >
              <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
            </button>
            <button
              v-if="collection.name !== '最喜欢的游戏'"
              class="action-menu-btn delete"
              title="删除"
              @click="startDelete(collection)"
            >
              <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 收藏夹游戏列表视图 -->
    <template v-else>
      <!-- 返回按钮和标题 -->
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
            <span class="text-sm text-text-muted"
              >{{ selectedCollection?.gameIds.length }} 个游戏</span
            >
          </div>
        </div>
      </div>

      <!-- 游戏网格 -->
      <div v-if="currentCollectionGames.length > 0" class="flc-grid">
        <div
          v-for="game in currentCollectionGames"
          :key="game.id"
          class="flc-game"
          @click="emit('selectGame', game)"
        >
          <GameCard :game="game" />
          <button class="flc-move" title="移动" @click.stop="openMoveModal(game)">
            <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current">
              <path
                d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-15">
        <div class="w-20 h-20 flex items-center justify-center bg-pink-100 rounded-2xl mb-5">
          <svg viewBox="0 0 24 24" class="w-10 h-10 fill-pink-400">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-text-primary m-0 mb-2">收藏夹是空的</h3>
        <p class="text-sm text-text-muted m-0">去游戏库添加游戏到这个收藏夹吧</p>
      </div>
    </template>

    <!-- 创建收藏夹弹窗 -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 backdrop-blur-sm"
      @click.self="showCreateModal = false"
    >
      <div class="w-90% max-w-100 bg-bg-primary rounded-2xl p-6">
        <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">新建收藏夹</h3>
        <input
          v-model="newCollectionName"
          type="text"
          placeholder="输入收藏夹名称"
          class="w-full h-11 px-4 bg-bg-secondary rounded-xl text-text-primary text-15px mb-5 transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          @keyup.enter="createCollection"
        />
        <div class="flex items-center justify-end gap-3">
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            @click="showCreateModal = false"
          >
            取消
          </button>
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-brand-600 text-white hover:bg-brand-700 shadow-brand hover:shadow-brand-lg"
            @click="createCollection"
          >
            创建
          </button>
        </div>
      </div>
    </div>

    <!-- 重命名弹窗 -->
    <div
      v-if="showRenameModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 backdrop-blur-sm"
      @click.self="showRenameModal = false"
    >
      <div class="w-90% max-w-100 bg-bg-primary rounded-2xl p-6">
        <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">重命名收藏夹</h3>
        <input
          v-model="renameCollectionName"
          type="text"
          placeholder="输入新名称"
          class="w-full h-11 px-4 bg-bg-secondary rounded-xl text-text-primary text-15px mb-5 transition-all duration-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          @keyup.enter="confirmRename"
        />
        <div class="flex items-center justify-end gap-3">
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            @click="showRenameModal = false"
          >
            取消
          </button>
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-brand-600 text-white hover:bg-brand-700 shadow-brand hover:shadow-brand-lg"
            @click="confirmRename"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 backdrop-blur-sm"
      @click.self="showDeleteModal = false"
    >
      <div class="w-90% max-w-100 bg-bg-primary rounded-2xl p-6">
        <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">删除收藏夹</h3>
        <p class="text-sm text-text-secondary m-0 mb-5 leading-relaxed">
          确定要删除 "{{ selectedCollection?.name }}" 吗？收藏夹中的游戏不会被删除。
        </p>
        <div class="flex items-center justify-end gap-3">
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            @click="showDeleteModal = false"
          >
            取消
          </button>
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-danger-500 text-white hover:bg-danger-600 shadow-danger hover:shadow-danger-lg"
            @click="confirmDelete"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 移动游戏弹窗 -->
    <div
      v-if="showMoveModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-1000 backdrop-blur-sm"
      @click.self="showMoveModal = false"
    >
      <div class="w-90% max-w-100 bg-bg-primary rounded-2xl p-6">
        <h3 class="text-lg font-semibold text-text-primary m-0 mb-4">移动到收藏夹</h3>
        <div class="max-h-75 overflow-y-auto mb-5">
          <button
            v-for="collection in collections"
            :key="collection.id"
            class="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-xl cursor-pointer transition-all duration-200 hover:bg-bg-secondary"
            :class="{ 'bg-brand-100': collection.id === selectedCollectionId }"
            @click="moveGameToCollection(collection.id)"
          >
            <div
              class="w-9 h-9 flex items-center justify-center rounded-lg"
              :style="{ backgroundColor: collection.iconColor + '20' }"
            >
              <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" :style="{ fill: collection.iconColor }">
                <path :d="getIconSvg(collection.icon)" />
              </svg>
            </div>
            <span class="flex-1 text-sm text-text-primary text-left">{{ collection.name }}</span>
            <svg
              v-if="collection.id === selectedCollectionId"
              viewBox="0 0 24 24"
              class="w-5 h-5 fill-brand-600"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </button>
        </div>
        <div class="flex items-center justify-end gap-3">
          <button
            class="h-10 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            @click="showMoveModal = false"
          >
            取消
          </button>
        </div>
      </div>
    </div>
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

.collection-card:hover .collection-actions {
  opacity: 1;
}

.action-menu-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 200ms ease;
}

.action-menu-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.action-menu-btn.delete:hover {
  background: var(--accent-danger-bg);
  color: var(--accent-danger);
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

.flc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.flc-game {
  position: relative;
}

.flc-move {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.flc-game:hover .flc-move {
  opacity: 1;
}

.flc-move:hover {
  background: rgba(0, 0, 0, 0.6);
}

svg {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
