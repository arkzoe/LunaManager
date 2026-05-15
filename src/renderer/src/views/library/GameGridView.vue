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
      v-for="game in filteredGames"
      :key="game.id"
      class="grid-item"
      :class="{ 'batch-active': batchMode }"
      @click="emit('selectGame', game)"
      @contextmenu="emit('contextMenu', $event, game)"
    >
      <label v-if="batchMode" class="grid-check">
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

.grid-item {
  position: relative;
  cursor: pointer;
  border-radius: 10px;
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
}

.grid-cb {
  accent-color: var(--accent-primary);
}
</style>
