<script setup lang="ts">
import type { GameStatus } from '../../../../shared/types'

defineProps<{
  show: boolean
  x: number
  y: number
  statusFilters: { id: GameStatus; label: string }[]
  gameStatus: GameStatus | null
}>()

const emit = defineEmits<{
  (e: 'viewDetail'): void
  (e: 'statusChange', status: GameStatus): void
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="context-overlay"
      @click="emit('close')"
      @contextmenu.prevent="emit('close')"
    />
    <div
      v-if="show"
      class="context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
    >
      <button class="ctx-item" @click="emit('viewDetail')">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
        查看详情
      </button>
      <div class="ctx-divider" />
      <div class="ctx-label">更改状态</div>
      <button
        v-for="s in statusFilters"
        :key="s.id"
        class="ctx-item"
        :class="{ current: gameStatus === s.id }"
        @click="emit('statusChange', s.id)"
      >
        {{ s.label }}
      </button>
      <div class="ctx-divider" />
      <button class="ctx-item danger" @click="emit('close')">
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
        删除
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
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
</style>
