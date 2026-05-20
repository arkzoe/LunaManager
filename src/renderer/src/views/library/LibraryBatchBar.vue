<script setup lang="ts">
import type { GameStatus } from '../../../../shared/types'

defineProps<{
  batchCount: number
  allFilteredSelected: boolean
  statusFilters: { id: GameStatus; label: string }[]
  showBatchStatusMenu: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleSelectAll'): void
  (e: 'toggleBatchStatus'): void
  (e: 'handleBatchStatus', status: GameStatus): void
  (e: 'openCollectionPicker'): void
  (e: 'openDeleteConfirm'): void
  (e: 'closeBatchStatusMenu'): void
}>()
</script>

<template>
  <div class="batch-bar">
    <span class="bb-count">已选 {{ batchCount }} 项</span>
    <button class="bb-btn" @click="emit('toggleSelectAll')">
      {{ allFilteredSelected ? '取消全选' : '全选' }}
    </button>
    <div class="bb-status-wrap">
      <button class="bb-btn" :disabled="batchCount === 0" @click="emit('toggleBatchStatus')">
        修改状态
        <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current"><path d="M7 10l5 5 5-5z" /></svg>
      </button>
      <Transition name="dropdown">
        <div
          v-if="showBatchStatusMenu"
          class="context-overlay"
          @click="emit('closeBatchStatusMenu')"
        />
      </Transition>
      <Transition name="dropdown">
        <div v-if="showBatchStatusMenu" class="batch-status-menu">
          <button
            v-for="f in statusFilters"
            :key="f.id"
            class="ctx-item"
            @click="emit('handleBatchStatus', f.id)"
          >
            {{ f.label }}
          </button>
        </div>
      </Transition>
    </div>
    <button class="bb-btn" :disabled="batchCount === 0" @click="emit('openCollectionPicker')">
      添加到收藏夹
    </button>
    <button
      class="bb-btn bb-danger"
      :disabled="batchCount === 0"
      @click="emit('openDeleteConfirm')"
    >
      删除
    </button>
  </div>
</template>

<style scoped>
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
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
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

.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.batch-status-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  min-width: 120px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  overflow: hidden;
}

.dropdown-enter-active {
  animation: dropdown-in 0.18s ease;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease forwards;
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
  transition:
    background-color 0.1s,
    border-color 0.1s,
    color 0.1s,
    box-shadow 0.1s;
  text-align: left;
}

.ctx-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
