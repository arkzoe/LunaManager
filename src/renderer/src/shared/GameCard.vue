<script setup lang="ts">
import type { GameRecord } from '../../../shared/types'

defineProps<{ game: GameRecord }>()
const emit = defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <div class="game-card" @click="emit('click')">
    <div class="cover">
      <img v-if="game.cover" :src="game.cover" :alt="game.title" class="cover-img" />
      <div v-else class="cover-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>
    <div class="info">
      <div class="title">{{ game.title }}</div>
      <div class="meta">{{ game.size || '-' }}</div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  background: var(--bg-primary);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}

.game-card:hover {
  box-shadow: var(--shadow-sm);
}

.cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--bg-secondary);
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  width: 28px;
  height: 28px;
  opacity: 0.35;
}

.info {
  padding: 6px 8px;
}

.title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 1px;
}

.meta {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
