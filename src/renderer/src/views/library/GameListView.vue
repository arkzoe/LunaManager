<script setup lang="ts">
import type { GameRecord, GameStatus } from '../../../../shared/types'
import { formatRelativeTime } from '../../utils/format'

defineProps<{
  filteredGames: GameRecord[]
  batchMode: boolean
  selectedIds: Set<string>
  allFilteredSelected: boolean
  statusLabels: Record<GameStatus, string>
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
  (e: 'toggleSelectGame', id: string): void
  (e: 'toggleSelectAll'): void
  (e: 'contextMenu', ev: MouseEvent, game: GameRecord): void
}>()
</script>

<template>
  <div class="game-list">
    <div class="list-header">
      <span class="lh-check" :class="{ 'cb-hidden': !batchMode }">
        <input
          type="checkbox"
          :checked="allFilteredSelected"
          class="list-cb"
          @change="emit('toggleSelectAll')"
        />
      </span>
      <span class="lh-col lh-cover">&nbsp;</span>
      <span class="lh-col lh-name">名称</span>
      <span class="lh-col lh-status">状态</span>
      <span class="lh-col lh-rating">评分</span>
      <span class="lh-col lh-playtime">时长</span>
      <span class="lh-col lh-last">最后游玩</span>
    </div>
    <div
      v-for="(game, idx) in filteredGames"
      :key="game.id"
      class="list-row"
      :class="{ selected: batchMode && selectedIds.has(game.id) }"
      :style="{ animationDelay: Math.min(idx * 0.03, 0.45) + 's' }"
      @click="emit('selectGame', game)"
      @contextmenu="emit('contextMenu', $event, game)"
    >
      <div class="lr-check" :class="{ 'cb-hidden': !batchMode }">
        <input
          type="checkbox"
          :checked="selectedIds.has(game.id)"
          class="list-cb"
          @change="emit('toggleSelectGame', game.id)"
        />
      </div>
      <div class="lr-cover">
        <img v-if="game.cover" :src="game.cover" :alt="game.title" class="lr-cover-img" />
        <div v-else class="lr-cover-ph">
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-text-muted opacity-30">
            <path
              d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
            />
          </svg>
        </div>
      </div>
      <span class="lr-name">{{ game.title_cn || game.title }}</span>
      <span class="lr-status">
        <span class="status-tag" :class="game.status">{{ statusLabels[game.status] }}</span>
      </span>
      <span class="lr-rating">{{ game.personal_rating ? game.personal_rating + '/10' : '-' }}</span>
      <span class="lr-playtime">{{ game.playtime || '-' }}</span>
      <span class="lr-last">{{ formatRelativeTime(game.last_played) || '-' }}</span>
    </div>
  </div>
</template>

<style scoped>
.game-list {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 36px 40px 2fr 80px 60px 70px 100px;
  align-items: center;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.list-row {
  display: grid;
  grid-template-columns: 36px 40px 2fr 80px 60px 70px 100px;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-color-light);
  opacity: 0;
  animation: fade-in-left 0.35s ease forwards;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row:hover {
  background: var(--bg-hover);
}

.list-row.selected {
  background: rgba(59, 130, 246, 0.06);
  border-left: 3px solid var(--accent-primary);
}

.lr-cover {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lr-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lr-cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lr-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

.lr-rating,
.lr-playtime,
.lr-last {
  font-size: 12px;
  color: var(--text-tertiary);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-tag.want {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary);
}
.status-tag.playing {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.status-tag.played {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}
.status-tag.shelved {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}
.status-tag.abandoned {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.lh-check {
  display: flex;
  align-items: center;
}

.lr-check {
  display: flex;
  align-items: center;
}

.lh-check,
.lr-check {
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.lh-check.cb-hidden,
.lr-check.cb-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.list-cb {
  accent-color: var(--accent-primary);
}
</style>
