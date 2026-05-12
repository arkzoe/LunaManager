<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'

defineProps<{ game: GameRecord }>()
const emit = defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <div class="game-card" @click="emit('click')">
    <div class="cover">
      <div class="cover-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>
    <div class="info">
      <div class="title">{{ game.title }}</div>
      <div class="meta">{{ game.size || '-' }} · {{ game.category }}</div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}

.game-card:hover {
  border-color: var(--border-color-medium);
  box-shadow: var(--shadow-sm);
}

.cover {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--bg-secondary);
  overflow: hidden;
}

.cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.cover-placeholder svg {
  width: 32px;
  height: 32px;
  opacity: 0.4;
}

.info {
  padding: 8px 10px;
}

.title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.meta {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
