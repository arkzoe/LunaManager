<script setup lang="ts">
import GameCard from '../../shared/GameCard.vue'
import type { GameRecord } from '../../../../shared/types'

defineProps<{
  filteredGames: GameRecord[]
  batchMode: boolean
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
  (e: 'toggleSelectGame', id: string): void
  (e: 'contextMenu', ev: MouseEvent, game: GameRecord): void
}>()
</script>

<template>
  <div class="game-grid">
    <div
      v-for="(game, idx) in filteredGames"
      :key="game.id"
      class="grid-item"
      :class="{ 'batch-active': batchMode }"
      :style="{ animationDelay: Math.min(idx * 0.04, 0.6) + 's' }"
      @click="emit('selectGame', game)"
      @contextmenu="emit('contextMenu', $event, game)"
    >
      <label class="grid-check" :class="{ 'cb-hidden': !batchMode }">
        <input
          type="checkbox"
          :checked="selectedIds.has(game.id)"
          class="grid-cb"
          @change="emit('toggleSelectGame', game.id)"
        />
      </label>
      <GameCard :game="game" :selected="batchMode && selectedIds.has(game.id)" />
    </div>
  </div>
</template>

<style scoped>
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

@media (max-width: 899px) {
  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }
}

@media (max-width: 699px) {
  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 6px;
  }
}

.grid-item {
  position: relative;
  cursor: pointer;
  border-radius: 10px;
  opacity: 0;
  animation: fade-in-up 0.4s ease forwards;
}

.grid-item.batch-active {
  cursor: default;
}

.grid-check {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

.grid-check.cb-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.grid-cb {
  accent-color: var(--accent-primary);
}
</style>
