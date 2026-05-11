<script setup lang="ts">
import { computed, ref } from 'vue'

interface Game {
  id: string
  title: string
  cover: string
  category: string
  rating: number
  size: string
  installed: boolean
  favorite: boolean
  lastPlayed?: string
  description?: string
  developer?: string
  publisher?: string
  releaseDate?: string
  playtime?: string
}

const props = defineProps<{
  games: Game[]
}>()

const emit = defineEmits<{
  (e: 'selectGame', game: Game): void
}>()

const searchQuery = ref('')
const showFilter = ref(false)
const showAddMenu = ref(false)

const filteredGames = computed(() => {
  if (!searchQuery.value) return props.games
  const query = searchQuery.value.toLowerCase()
  return props.games.filter(
    (game) =>
      game.title.toLowerCase().includes(query) || game.category.toLowerCase().includes(query)
  )
})

const handleGameClick = (game: Game): void => {
  emit('selectGame', game)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <svg
          viewBox="0 0 24 24"
          class="absolute left-3 w-4.5 h-4.5 fill-text-muted pointer-events-none"
        >
          <path
            d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </svg>
        <input v-model="searchQuery" type="text" placeholder="搜索游戏..." class="search-input" />
      </div>
      <div class="flex items-center gap-2">
        <button class="icon-btn" title="导入">
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current stroke-2 fill-none">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <button
          class="h-10 inline-flex items-center gap-1.5 px-3 bg-bg-primary border border-border rounded-lg text-sm text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-secondary"
          :class="{ 'bg-brand-100 border-brand-200 text-brand-700': showFilter }"
          @click="showFilter = !showFilter"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
            <path d="M3 4h18M6 4v10a6 6 0 006 6h0a6 6 0 006-6V4M12 20v-6" />
          </svg>
          <span>筛选</span>
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-current stroke-2 fill-none">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div class="relative">
          <button
            class="h-10 inline-flex items-center gap-1.5 px-4 bg-brand-600 border-none rounded-lg text-sm text-white font-medium cursor-pointer transition-all duration-200 hover:bg-brand-700 shadow-brand hover:shadow-brand-lg"
            @click="showAddMenu = !showAddMenu"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 stroke-current stroke-2 fill-none">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>添加游戏</span>
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-current stroke-2 fill-none">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 游戏网格 -->
    <div class="flex flex-wrap gap-5 overflow-y-auto overflow-x-hidden pr-2 flex-1 content-start">
      <div
        v-for="game in filteredGames"
        :key="game.id"
        class="game-card w-40 h-65 flex-shrink-0"
        @click="handleGameClick(game)"
      >
        <div
          class="relative w-full h-50 bg-gradient-to-br from-bg-secondary to-bg-tertiary overflow-hidden"
        >
          <div class="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-50">
              <path
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              />
            </svg>
          </div>
        </div>
        <div class="w-full h-15 p-3 box-border">
          <h3
            class="w-full h-5 text-sm font-semibold text-text-primary mb-1 whitespace-nowrap overflow-hidden text-ellipsis leading-5"
            :title="game.title"
          >
            {{ game.title }}
          </h3>
          <p
            class="w-full h-4 text-xs text-text-muted m-0 whitespace-nowrap overflow-hidden text-ellipsis leading-4"
          >
            {{ game.developer || 'Unknown Developer' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 320px;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 40px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 200ms ease;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.game-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 250ms ease;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--border-color-medium);
}

svg {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
