<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameRecord } from '../../../shared/types'
import { useGameStore } from '../stores/useGameStore'
import GameCard from './shared/GameCard.vue'

interface Collection {
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

// 搜索和视图状态
const searchQuery = ref('')
const viewMode = ref<'collections' | 'games'>('collections')
const selectedCollectionId = ref<string | null>(null)

// 分组管理状态
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const showMoveModal = ref(false)
// const showAddToCollectionModal = ref(false)
const newCollectionName = ref('')
const renameCollectionName = ref('')
const selectedGameForMove = ref<GameRecord | null>(null)
// const selectedGamesForAdd = ref<string[]>([])
// const targetCollectionId = ref<string | null>(null)

// 默认收藏夹数据
const defaultCollections: Collection[] = [
  {
    id: 'default-favorites',
    name: '最喜欢的游戏',
    icon: 'heart',
    iconColor: '#ec4899', // pink-500
    gameIds: [],
    createdAt: Date.now()
  }
]

// 从 localStorage 加载收藏夹
const loadCollections = (): Collection[] => {
  const saved = localStorage.getItem('game-collections')
  if (saved) {
    try {
      return JSON.parse(saved) as Collection[]
    } catch {
      return defaultCollections
    }
  }
  return defaultCollections
}

const collections = ref<Collection[]>(loadCollections())

// 保存收藏夹到 localStorage
const saveCollections = (): void => {
  localStorage.setItem('game-collections', JSON.stringify(collections.value))
}

// 监听收藏夹变化并保存
watch(collections, saveCollections, { deep: true })

// 同步收藏游戏到默认收藏夹
watch(
  () => effectiveGames.value,
  (games) => {
    const favoriteGames = games.filter((g) => g.favorite)
    const defaultCollection = collections.value.find((c) => c.id === 'default-favorites')
    if (defaultCollection) {
      defaultCollection.gameIds = favoriteGames.map((g) => g.id)
    }
  },
  { immediate: true, deep: true }
)

// 过滤后的收藏夹
const filteredCollections = computed(() => {
  if (!searchQuery.value) return collections.value
  const query = searchQuery.value.toLowerCase()
  return collections.value.filter((c) => c.name.toLowerCase().includes(query))
})

// 当前选中的收藏夹
const selectedCollection = computed(() => {
  return collections.value.find((c) => c.id === selectedCollectionId.value)
})

// 当前收藏夹中的游戏
const currentCollectionGames = computed(() => {
  if (!selectedCollection.value) return []
  return effectiveGames.value.filter((g) => selectedCollection.value!.gameIds.includes(g.id))
})

// 收藏游戏总数
// const totalFavorites = computed(() => {
//   return collections.value.reduce((sum, c) => sum + c.gameIds.length, 0)
// })

// 创建新收藏夹
const createCollection = (): void => {
  if (!newCollectionName.value.trim()) return

  const newCollection: Collection = {
    id: `collection-${Date.now()}`,
    name: newCollectionName.value.trim(),
    icon: 'folder',
    iconColor: '#4f46e5', // accent-500
    gameIds: [],
    createdAt: Date.now()
  }

  collections.value.push(newCollection)
  newCollectionName.value = ''
  showCreateModal.value = false
}

// 重命名收藏夹
const startRename = (collection: Collection): void => {
  selectedCollectionId.value = collection.id
  renameCollectionName.value = collection.name
  showRenameModal.value = true
}

const confirmRename = (): void => {
  if (!renameCollectionName.value.trim() || !selectedCollectionId.value) return

  const collection = collections.value.find((c) => c.id === selectedCollectionId.value)
  if (collection) {
    collection.name = renameCollectionName.value.trim()
  }

  renameCollectionName.value = ''
  showRenameModal.value = false
}

// 删除收藏夹
const startDelete = (collection: Collection): void => {
  selectedCollectionId.value = collection.id
  showDeleteModal.value = true
}

const confirmDelete = (): void => {
  if (!selectedCollectionId.value) return

  collections.value = collections.value.filter((c) => c.id !== selectedCollectionId.value)

  if (viewMode.value === 'games' && selectedCollectionId.value) {
    viewMode.value = 'collections'
  }

  selectedCollectionId.value = null
  showDeleteModal.value = false
}

// 打开收藏夹
const openCollection = (collection: Collection): void => {
  selectedCollectionId.value = collection.id
  viewMode.value = 'games'
}

// 返回收藏夹列表
const backToCollections = (): void => {
  viewMode.value = 'collections'
  selectedCollectionId.value = null
}

// 打开移动游戏对话框
const openMoveModal = (game: GameRecord): void => {
  selectedGameForMove.value = game
  showMoveModal.value = true
}

// 移动游戏到指定收藏夹
const moveGameToCollection = (targetId: string): void => {
  if (!selectedGameForMove.value) return

  const gameId = selectedGameForMove.value.id

  // 从所有收藏夹中移除该游戏
  collections.value.forEach((c) => {
    c.gameIds = c.gameIds.filter((id) => id !== gameId)
  })

  // 添加到目标收藏夹
  const targetCollection = collections.value.find((c) => c.id === targetId)
  if (targetCollection && !targetCollection.gameIds.includes(gameId)) {
    targetCollection.gameIds.push(gameId)
  }

  selectedGameForMove.value = null
  showMoveModal.value = false
}

// 从收藏夹中移除游戏
// const removeFromCollection = (gameId: string): void => {
//   if (!selectedCollection.value) return
//
//   selectedCollection.value.gameIds = selectedCollection.value.gameIds.filter((id) => id !== gameId)
// }

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
              v-if="collection.id !== 'default-favorites'"
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
              v-if="collection.id !== 'default-favorites'"
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
