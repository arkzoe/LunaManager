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

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
}>()

const effectiveGames = computed(() => store.allGames)

// 搜索
const searchQuery = ref('')
const selectedCollectionId = ref<string | null>(null)

// 模态框
const showCreateModal = ref(false)
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const showMoveModal = ref(false)
const newCollectionName = ref('')
const renameCollectionName = ref('')
const selectedGameForMove = ref<GameRecord | null>(null)

// 默认收藏夹
const defaultCollections: Collection[] = [
  {
    id: 'default-favorites',
    name: '最喜欢的游戏',
    icon: 'heart',
    iconColor: '#ec4899',
    gameIds: [],
    createdAt: Date.now()
  }
]

const loadCollections = (): Collection[] => {
  const saved = localStorage.getItem('game-collections')
  if (saved) {
    try { return JSON.parse(saved) as Collection[] }
    catch { return defaultCollections }
  }
  return defaultCollections
}

const collections = ref<Collection[]>(loadCollections())
const saveCollections = (): void => {
  localStorage.setItem('game-collections', JSON.stringify(collections.value))
}
watch(collections, saveCollections, { deep: true })

// 同步收藏游戏到默认收藏夹
watch(
  () => effectiveGames.value,
  (games) => {
    const favs = games.filter((g) => g.favorite)
    const dc = collections.value.find((c) => c.id === 'default-favorites')
    if (dc) dc.gameIds = favs.map((g) => g.id)
  },
  { immediate: true, deep: true }
)

const filteredCollections = computed(() => {
  if (!searchQuery.value) return collections.value
  const q = searchQuery.value.toLowerCase()
  return collections.value.filter((c) => c.name.toLowerCase().includes(q))
})

const selectedCollection = computed(() =>
  collections.value.find((c) => c.id === selectedCollectionId.value)
)

const currentCollectionGames = computed(() => {
  if (!selectedCollection.value) return []
  return effectiveGames.value.filter((g) => selectedCollection.value!.gameIds.includes(g.id))
})

// 创建/重命名/删除
const createCollection = (): void => {
  if (!newCollectionName.value.trim()) return
  collections.value.push({
    id: `collection-${Date.now()}`,
    name: newCollectionName.value.trim(),
    icon: 'folder',
    iconColor: '#4f46e5',
    gameIds: [],
    createdAt: Date.now()
  })
  newCollectionName.value = ''
  showCreateModal.value = false
}

const startRename = (c: Collection): void => {
  selectedCollectionId.value = c.id
  renameCollectionName.value = c.name
  showRenameModal.value = true
}

const confirmRename = (): void => {
  if (!renameCollectionName.value.trim() || !selectedCollectionId.value) return
  const c = collections.value.find((x) => x.id === selectedCollectionId.value)
  if (c) c.name = renameCollectionName.value.trim()
  showRenameModal.value = false
}

const startDelete = (c: Collection): void => {
  selectedCollectionId.value = c.id
  showDeleteModal.value = true
}

const confirmDelete = (): void => {
  if (!selectedCollectionId.value) return
  collections.value = collections.value.filter((x) => x.id !== selectedCollectionId.value)
  if (selectedCollectionId.value === selectedCollectionId.value) selectedCollectionId.value = null
  showDeleteModal.value = false
}

// 移动游戏
const openMoveModal = (game: GameRecord): void => {
  selectedGameForMove.value = game
  showMoveModal.value = true
}

const moveGameToCollection = (targetId: string): void => {
  if (!selectedGameForMove.value) return
  const gameId = selectedGameForMove.value.id
  collections.value.forEach((c) => { c.gameIds = c.gameIds.filter((id) => id !== gameId) })
  const target = collections.value.find((c) => c.id === targetId)
  if (target && !target.gameIds.includes(gameId)) target.gameIds.push(gameId)
  showMoveModal.value = false
}

const getIconSvg = (name: string): string => {
  const icons: Record<string, string> = {
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    folder: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    game: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'
  }
  return icons[name] || icons.folder
}
</script>

<template>
  <div class="favorites-layout">
    <!-- ===== 左侧：分组列表 ===== -->
    <aside class="fl-sidebar">
      <div class="fls-head">
        <span class="fls-title">收藏夹</span>
        <button class="fls-add" title="新建收藏夹" @click="showCreateModal = true">
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>

      <div class="fls-search">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-text-muted"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input v-model="searchQuery" placeholder="搜索..." class="fls-input" />
      </div>

      <div class="fls-list">
        <button
          v-for="c in filteredCollections"
          :key="c.id"
          class="fls-item"
          :class="{ active: selectedCollectionId === c.id }"
          @click="selectedCollectionId = c.id"
        >
          <div class="fls-icon" :style="{ backgroundColor: c.iconColor + '18' }">
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" :style="{ fill: c.iconColor }">
              <path :d="getIconSvg(c.icon)" />
            </svg>
          </div>
          <span class="fls-name">{{ c.name }}</span>
          <span class="fls-count">{{ c.gameIds.length }}</span>

          <!-- 操作按钮 -->
          <div class="fls-actions" @click.stop>
            <button
              v-if="c.id !== 'default-favorites'"
              class="fls-act" title="重命名"
              @click="startRename(c)"
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button
              v-if="c.id !== 'default-favorites'"
              class="fls-act danger" title="删除"
              @click="startDelete(c)"
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </button>
      </div>
    </aside>

    <!-- ===== 右侧：游戏内容 ===== -->
    <div class="fl-content">
      <!-- 未选中 -->
      <div v-if="!selectedCollection" class="fl-empty">
        <svg viewBox="0 0 24 24" class="w-16 h-16 fill-text-muted opacity-15 mb-5">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
        <h3>选择一个收藏夹</h3>
        <p>从左侧列表选择一个收藏夹查看其中的游戏</p>
      </div>

      <!-- 已选中收藏夹 -->
      <template v-else>
        <div class="flc-head">
          <div class="flc-info">
            <div class="flc-icon" :style="{ backgroundColor: selectedCollection.iconColor + '18' }">
              <svg viewBox="0 0 24 24" class="w-5 h-5" :style="{ fill: selectedCollection.iconColor }">
                <path :d="getIconSvg(selectedCollection.icon)" />
              </svg>
            </div>
            <div>
              <h2>{{ selectedCollection.name }}</h2>
              <span>{{ selectedCollection.gameIds.length }} 个游戏</span>
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
              <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
          </div>
        </div>

        <div v-else class="fl-empty">
          <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-15 mb-4">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <p>这个收藏夹还没有游戏</p>
        </div>
      </template>
    </div>

    <!-- ===== 模态框 (复用) ===== -->
    <!-- 创建 -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-card">
          <h3>新建收藏夹</h3>
          <input v-model="newCollectionName" placeholder="输入收藏夹名称" class="modal-input" @keyup.enter="createCollection" />
          <div class="modal-btns">
            <button class="btn-secondary btn-sm" @click="showCreateModal = false">取消</button>
            <button class="btn-brand btn-sm" @click="createCollection">创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 重命名 -->
    <Teleport to="body">
      <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
        <div class="modal-card">
          <h3>重命名收藏夹</h3>
          <input v-model="renameCollectionName" placeholder="输入新名称" class="modal-input" @keyup.enter="confirmRename" />
          <div class="modal-btns">
            <button class="btn-secondary btn-sm" @click="showRenameModal = false">取消</button>
            <button class="btn-brand btn-sm" @click="confirmRename">确认</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除 -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-card">
          <h3>删除收藏夹</h3>
          <p class="modal-desc">确定要删除 "{{ selectedCollection?.name }}" 吗？收藏夹中的游戏不会被删除。</p>
          <div class="modal-btns">
            <button class="btn-secondary btn-sm" @click="showDeleteModal = false">取消</button>
            <button class="btn-danger btn-sm" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 移动 -->
    <Teleport to="body">
      <div v-if="showMoveModal" class="modal-overlay" @click.self="showMoveModal = false">
        <div class="modal-card">
          <h3>移动到收藏夹</h3>
          <div class="move-list">
            <button
              v-for="c in collections"
              :key="c.id"
              class="move-item"
              :class="{ current: c.id === selectedCollectionId }"
              @click="moveGameToCollection(c.id)"
            >
              <div class="mi-icon" :style="{ backgroundColor: c.iconColor + '18' }">
                <svg viewBox="0 0 24 24" class="w-4 h-4" :style="{ fill: c.iconColor }">
                  <path :d="getIconSvg(c.icon)" />
                </svg>
              </div>
              <span>{{ c.name }}</span>
              <svg v-if="c.id === selectedCollectionId" viewBox="0 0 24 24" class="w-4 h-4 fill-brand-500">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
          </div>
          <div class="modal-btns">
            <button class="btn-secondary btn-sm" @click="showMoveModal = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ===== 左右布局 ===== */
.favorites-layout {
  display: flex;
  gap: 0;
  height: 100%;
  max-width: 1000px;
}

/* ===== 左侧栏 ===== */
.fl-sidebar {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  margin-right: 16px;
}

.fls-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.fls-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.fls-add {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.fls-add:hover {
  background: var(--bg-active);
  color: var(--accent-primary);
}

.fls-search {
  position: relative;
  margin-bottom: 10px;
}

.fls-search svg {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.fls-input {
  width: 100%;
  height: 32px;
  padding: 0 8px 0 28px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.fls-input:focus {
  border-color: var(--accent-primary);
}

.fls-input::placeholder {
  color: var(--text-muted);
}

/* 分组列表 */
.fls-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fls-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.15s;
  position: relative;
}

.fls-item:hover {
  background: var(--bg-hover);
}

.fls-item.active {
  background: var(--bg-active);
}

.fls-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fls-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fls-count {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 1px 7px;
  border-radius: 10px;
}

.fls-actions {
  display: none;
  align-items: center;
  gap: 2px;
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-primary);
  border-radius: 6px;
  padding: 2px;
}

.fls-item:hover .fls-actions {
  display: flex;
}

.fls-act {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.1s;
}

.fls-act:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.fls-act.danger:hover {
  background: rgba(239,68,68,0.1);
  color: var(--danger);
}

/* ===== 右侧内容 ===== */
.fl-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.fl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px;
}

.fl-empty h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.fl-empty p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.flc-head {
  margin-bottom: 16px;
}

.flc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.flc-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flc-info h2 {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 2px;
}

.flc-info span {
  font-size: 12px;
  color: var(--text-tertiary);
}

.flc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.flc-game {
  position: relative;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.flc-game:hover {
  transform: translateY(-2px);
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
  background: rgba(0,0,0,0.45);
  border: none;
  border-radius: 5px;
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.flc-game:hover .flc-move {
  opacity: 1;
}

/* ===== 模态框 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 90%;
  max-width: 380px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 24px;
}

.modal-card h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.modal-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 16px;
}

.modal-input {
  width: 100%;
  height: 40px;
  padding: 0 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  margin-bottom: 16px;
  transition: border-color 0.15s;
}

.modal-input:focus {
  border-color: var(--accent-primary);
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 移动列表 */
.move-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.move-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  text-align: left;
}

.move-item:hover {
  background: var(--bg-hover);
}

.move-item.current {
  background: var(--bg-active);
}

.mi-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.move-item span {
  flex: 1;
}
</style>
