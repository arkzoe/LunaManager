<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import GameCard from '../../shared/GameCard.vue'
import type { GameRecord } from '../../../../shared/types'

const props = defineProps<{
  filteredGames: GameRecord[]
  batchMode: boolean
  selectedIds: Set<string>
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
  (e: 'toggleSelectGame', id: string): void
  (e: 'contextMenu', ev: MouseEvent, game: GameRecord): void
}>()

const RENDER_BATCH = 40
const renderedCount = ref(RENDER_BATCH)

const visibleGames = computed(() => props.filteredGames.slice(0, renderedCount.value))

const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && renderedCount.value < props.filteredGames.length) {
        renderedCount.value = Math.min(
          renderedCount.value + RENDER_BATCH,
          props.filteredGames.length
        )
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

watch(
  () => props.filteredGames.length,
  () => {
    renderedCount.value = RENDER_BATCH
  }
)
</script>

<template>
  <div class="game-grid">
    <div
      v-for="(game, idx) in visibleGames"
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
    <div ref="sentinel" class="grid-sentinel" />
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

.grid-sentinel {
  width: 100%;
  height: 1px;
}
</style>
