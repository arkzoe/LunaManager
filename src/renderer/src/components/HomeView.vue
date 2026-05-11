<script setup lang="ts">
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
  (e: 'navigateLibrary'): void
}>()

const recentGames = props.games.filter((g) => g.lastPlayed).slice(0, 6)
</script>

<template>
  <div class="h-full overflow-y-auto pr-2">
    <!-- 空状态 -->
    <div
      v-if="recentGames.length === 0"
      class="h-full flex flex-col items-center justify-center text-center p-10"
    >
      <div class="w-20 h-20 flex items-center justify-center bg-brand-100 rounded-2xl mb-6">
        <svg viewBox="0 0 24 24" class="w-10 h-10 fill-brand-400">
          <path
            d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-text-primary mb-2">还没有游玩记录</h3>
      <p class="text-sm text-text-tertiary mb-6">去游戏库选择一款游戏开始吧</p>
      <button class="btn-brand" @click="emit('navigateLibrary')">
        <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
          <path
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        浏览游戏库
      </button>
    </div>

    <!-- 最近游玩 -->
    <div v-else class="py-2">
      <h2 class="text-lg font-semibold text-text-primary mb-5">最近游玩</h2>
      <div class="flex flex-wrap gap-5">
        <div
          v-for="game in recentGames"
          :key="game.id"
          class="game-card w-40 h-60 flex-shrink-0"
          @click="emit('selectGame', game)"
        >
          <div
            class="w-full h-45 bg-gradient-to-br from-bg-secondary to-bg-tertiary overflow-hidden"
          >
            <div class="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-50">
                <path
                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                />
              </svg>
            </div>
          </div>
          <div class="w-full h-15 p-3 box-border">
            <h4
              class="w-full h-5 text-sm font-semibold text-text-primary mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis leading-5"
              :title="game.title"
            >
              {{ game.title }}
            </h4>
            <span class="w-full h-4 text-xs text-text-muted leading-4">{{ game.lastPlayed }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 250ms ease;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

html.dark .game-card {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.2);
}

html.dark .game-card:hover {
  border-color: rgba(148, 163, 184, 0.3);
}
</style>
