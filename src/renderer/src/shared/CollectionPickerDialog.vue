<script setup lang="ts">
import { ref, watch } from 'vue'

interface CollectionItem {
  id: string
  name: string
  gameIds: string[]
}

const props = withDefaults(
  defineProps<{
    show: boolean
    selectedCount?: number
  }>(),
  {
    selectedCount: 0
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', collectionId: string): void
}>()

const collections = ref<CollectionItem[]>([])
const loading = ref(false)

const loadCollections = async (): Promise<void> => {
  loading.value = true
  try {
    const dbCols = await window.api.getCollections()
    const items: CollectionItem[] = []
    for (const c of dbCols) {
      const games = await window.api.getCollectionGames(c.id)
      items.push({ id: c.id, name: c.name, gameIds: games.map((g) => g.id) })
    }
    collections.value = items
  } catch {
    collections.value = []
  } finally {
    loading.value = false
  }
}

const handleSelect = (id: string): void => {
  emit('select', id)
}

watch(
  () => props.show,
  (val) => {
    if (val) loadCollections()
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-card">
          <h3 class="modal-title">添加到收藏夹</h3>
          <div v-if="loading" class="modal-loading">加载中...</div>
          <div v-else class="modal-list">
            <button
              v-for="col in collections"
              :key="col.id"
              class="modal-list-item"
              @click="handleSelect(col.id)"
            >
              <span class="modal-list-name">{{ col.name }}</span>
              <span class="modal-list-count">{{ col.gameIds.length }} 个游戏</span>
            </button>
            <div v-if="collections.length === 0" class="modal-empty">
              暂无收藏夹，请先在收藏页面创建
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="emit('close')">取消</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-enter-active {
  animation: overlay-in 0.2s ease;
}

.modal-leave-active {
  animation: overlay-out 0.15s ease forwards;
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

.modal-enter-active .modal-card {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .modal-card {
  animation: modal-out 0.15s ease forwards;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px;
}
.modal-loading {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: var(--text-tertiary);
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
}
.btn-cancel {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
