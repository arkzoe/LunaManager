<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'
import type { UICollection } from '../../composables/useCollections'
import GameCard from '../../shared/GameCard.vue'

defineProps<{
  games: GameRecord[]
  collections: UICollection[]
  batchMode?: boolean
  selectedIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'cardClick', game: GameRecord): void
  (e: 'moveGame', game: GameRecord): void
  (e: 'toggleSelect', gameId: string): void
}>()
</script>

<template>
  <div v-if="games.length > 0" class="flc-grid">
    <div v-for="game in games" :key="game.id" class="flc-game" @click="emit('cardClick', game)">
      <div
        class="flc-check"
        :class="{ 'cb-hidden': !batchMode }"
        @click.stop="emit('toggleSelect', game.id)"
      >
        <div
          class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer cb-box"
          :class="selectedIds?.includes(game.id) ? 'cb-selected' : ''"
        >
          <svg v-if="selectedIds?.includes(game.id)" viewBox="0 0 24 24" class="w-3 h-3 fill-white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      </div>
      <GameCard :game="game" :selected="batchMode && selectedIds?.includes(game.id)" />
      <button v-if="!batchMode" class="flc-move" title="移动" @click.stop="emit('moveGame', game)">
        <svg viewBox="0 0 24 24" class="w-3 h-3 fill-current">
          <path
            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
          />
        </svg>
      </button>
    </div>
  </div>
  <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-15">
    <div class="w-20 h-20 flex items-center justify-center rounded-2xl mb-5 empty-icon-bg">
      <svg viewBox="0 0 24 24" class="w-10 h-10 empty-icon">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </svg>
    </div>
    <h3 class="text-lg font-semibold m-0 mb-2 empty-title">收藏夹是空的</h3>
    <p class="text-sm m-0 empty-desc">去游戏库添加游戏到这个收藏夹吧</p>
  </div>
</template>

<style scoped>
.flc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.flc-game {
  position: relative;
}

.flc-check {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

.flc-check.cb-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
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
  background: var(--bg-overlay);
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.flc-game:hover .flc-move {
  opacity: 1;
}

.flc-move:hover {
  background: rgba(0, 0, 0, 0.6);
}

.cb-box {
  border-color: var(--border-color-medium);
}
.cb-box:hover {
  border-color: var(--accent-primary);
}
.cb-selected {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.empty-icon-bg {
  background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
}
.empty-icon {
  fill: var(--accent-primary);
}
.empty-title {
  color: var(--text-primary);
}
.empty-desc {
  color: var(--text-muted);
}
</style>
