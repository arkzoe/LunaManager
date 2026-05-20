<script setup lang="ts">
import type { GameStatus } from '../../../../shared/types'

defineProps<{
  filters: { id: GameStatus | 'all'; label: string }[]
  activeFilter: GameStatus | 'all'
}>()

const emit = defineEmits<{
  (e: 'update:activeFilter', val: GameStatus | 'all'): void
}>()
</script>

<template>
  <div class="filters-bar">
    <button
      v-for="f in filters"
      :key="f.id"
      class="filter-btn"
      :class="{ active: activeFilter === f.id }"
      @click="emit('update:activeFilter', f.id)"
    >
      {{ f.label }}
    </button>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
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
}

.filter-btn:hover {
  border-color: var(--border-color-medium);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}
</style>
