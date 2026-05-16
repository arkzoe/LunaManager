<script setup lang="ts">
import type { UICollection } from '../../composables/useCollections'
import CollectionCard from './CollectionCard.vue'

defineProps<{
  collections: UICollection[]
  searchQuery: string
  batchMode: boolean
  colSelectedIds: Set<string>
  hasBatchable: boolean
  allColsSelected: boolean
  showSortMenu: boolean
  sortField: string
  sortOptions: { field: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'toggleBatchMode'): void
  (e: 'toggleSortMenu'): void
  (e: 'sort', field: string): void
  (e: 'toggleSelectAllCols'): void
  (e: 'toggleColSelect', id: string): void
  (e: 'openColBatchDeleteConfirm'): void
  (e: 'openCollection', col: UICollection): void
  (e: 'renameCollection', col: UICollection): void
  (e: 'deleteCollection', col: UICollection): void
  (e: 'createCollection'): void
}>()

const isDefault = (col: UICollection): boolean => col.name === '最喜欢的游戏'

const handleSortSelect = (field: string): void => {
  emit('sort', field)
}
</script>

<template>
  <div>
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
          :value="searchQuery"
          type="text"
          placeholder="搜索收藏夹..."
          class="search-input"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="toolbar-actions">
        <button
          class="icon-btn"
          :class="{ 'bg-accent-500/10 border-accent-500 text-accent-500': batchMode }"
          title="批量管理"
          @click="emit('toggleBatchMode')"
        >
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
            <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
          </svg>
        </button>
        <div class="filter-wrap">
          <button class="filter-btn" @click="emit('toggleSortMenu')">
            <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
              <path d="M3 4h18M6 4v10a6 6 0 006 6h0a6 6 0 006-6V4M12 20v-6" />
            </svg>
            <span>{{ sortOptions.find((o) => o.field === sortField)?.label }}</span>
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-current stroke-2 fill-none">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <Transition name="ctx">
            <div v-if="showSortMenu" class="context-overlay" @click="emit('toggleSortMenu')" />
          </Transition>
          <Transition name="dropdown">
            <div v-if="showSortMenu" class="sort-menu">
              <button
                v-for="opt in sortOptions"
                :key="opt.field"
                class="sort-option"
                :class="{ active: sortField === opt.field }"
                @click="handleSortSelect(opt.field)"
              >
                <span>{{ opt.label }}</span>
                <span v-if="sortField === opt.field" class="sort-arrow">↕</span>
                <span v-else class="sort-arrow-dim">↕</span>
              </button>
            </div>
          </Transition>
        </div>
        <button class="add-btn" @click="emit('createCollection')">
          <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>新建收藏夹</span>
        </button>
      </div>
    </div>

    <div class="batch-bar-stage" :class="{ 'batch-open': batchMode }">
      <div class="batch-bar">
        <span class="bb-count">已选 {{ colSelectedIds.size }} 项</span>
        <button class="bb-btn" @click="emit('toggleSelectAllCols')">
          {{ allColsSelected ? '取消全选' : '全选' }}
        </button>
        <button
          class="bb-btn bb-danger"
          :disabled="colSelectedIds.size === 0"
          @click="emit('openColBatchDeleteConfirm')"
        >
          删除选中
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-4 overflow-y-auto overflow-x-hidden pr-2 flex-1 content-start">
      <CollectionCard
        v-for="collection in collections"
        :key="collection.id"
        :collection="collection"
        :is-default="isDefault(collection)"
        :batch-mode="batchMode"
        :selected="colSelectedIds.has(collection.id)"
        @open="emit('openCollection', collection)"
        @rename="emit('renameCollection', collection)"
        @delete="emit('deleteCollection', collection)"
        @toggle-select="emit('toggleColSelect', $event)"
      />
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

@media (max-width: 899px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 16px;
  }
  .toolbar .search-box {
    max-width: 100%;
    flex-basis: 100%;
    order: 1;
  }
  .toolbar .toolbar-actions {
    order: 2;
    width: 100%;
    justify-content: flex-start;
  }
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
.ctx-enter-active {
  animation: overlay-in 0.1s ease;
}
.ctx-leave-active {
  animation: overlay-out 0.1s ease forwards;
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
.dropdown-enter-active {
  animation: dropdown-in 0.18s ease;
}
.dropdown-leave-active {
  animation: dropdown-out 0.15s ease forwards;
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
  background: #3b82f6;
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
  will-change: transform, opacity;
}

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
</style>
