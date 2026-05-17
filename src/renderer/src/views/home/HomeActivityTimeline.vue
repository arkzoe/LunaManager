<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'

defineProps<{
  activities: { type: string; game: GameRecord; time: string }[]
  emptyText?: string
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
}>()
</script>

<template>
  <div class="timeline">
    <div v-if="activities.length === 0" class="tl-empty">
      <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current tl-empty-icon">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.37V7z"
        />
      </svg>
      <p class="tl-empty-text">{{ emptyText || '暂无记录' }}</p>
    </div>
    <div
      v-for="(act, idx) in activities"
      :key="idx"
      class="tl-item"
      :style="{ animationDelay: idx * 0.06 + 's' }"
      @click="emit('selectGame', act.game)"
    >
      <div class="tl-dot" :class="act.type" />
      <div class="tl-content">
        <div class="tl-text">
          <template v-if="act.type === 'played'">游玩了</template>
          <template v-else>新入库</template>
          <span class="tl-game">{{ act.game.title_cn || act.game.title }}</span>
        </div>
        <div class="tl-time">{{ act.time }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.tl-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  animation: fade-in-left 0.4s ease forwards;
}

.tl-item:hover {
  background: var(--bg-hover);
  padding-left: 22px;
}

.tl-item + .tl-item {
  border-top: 1px solid var(--border-color-light);
}

.tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.tl-dot.played {
  background: var(--accent-primary);
}

.tl-item:hover .tl-dot.played {
  animation: pulse-dot 1.2s ease infinite;
}

.tl-dot.added {
  background: var(--success);
}

.tl-item:hover .tl-dot.added {
  animation: pulse-dot-green 1.2s ease infinite;
}

.tl-content {
  min-width: 0;
}

.tl-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.tl-game {
  color: var(--text-primary);
  font-weight: 600;
}

.tl-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.tl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 8px;
}

.tl-empty-icon {
  color: var(--text-muted);
  opacity: 0.3;
}

.tl-empty-text {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}
</style>
