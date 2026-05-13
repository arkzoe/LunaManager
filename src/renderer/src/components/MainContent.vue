<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameRecord } from '../../../shared/types'
import LibraryView from './LibraryView.vue'
import FavoritesView from './FavoritesView.vue'
import StatsView from './StatsView.vue'
import SettingsView from './SettingsView.vue'
import GameDetailView from './GameDetailView.vue'
import HomeView from './HomeView.vue'

const props = defineProps<{ activeTab: string }>()
const emit = defineEmits<{ (e: 'update:activeTab', tab: string): void }>()

const selectedGame = ref<GameRecord | null>(null)

watch(
  () => props.activeTab,
  () => {
    selectedGame.value = null
  }
)

const tabTitle = computed(() => {
  if (selectedGame.value) return selectedGame.value.title
  const map: Record<string, string> = {
    home: '首页',
    library: '游戏库',
    favorites: '收藏',
    stats: '统计',
    settings: '设置'
  }
  return map[props.activeTab] || ''
})

const handleSelectGame = (game: GameRecord): void => {
  selectedGame.value = game
}
const handleBack = (): void => {
  selectedGame.value = null
}
</script>

<template>
  <main class="main-area">
    <header class="header">
      <h1 class="title">{{ tabTitle }}</h1>
      <div v-if="selectedGame" class="header-right">
        <button class="back-btn" @click="handleBack">← 返回</button>
      </div>
    </header>
    <div class="content">
      <Transition name="page" mode="out-in">
        <GameDetailView v-if="selectedGame" :key="'detail-'+selectedGame.id" :game="selectedGame" @back="handleBack" />
        <HomeView
          v-else-if="activeTab === 'home'"
          key="home"
          @select-game="handleSelectGame"
          @navigate-library="() => emit('update:activeTab', 'library')"
        />
        <LibraryView v-else-if="activeTab === 'library'" key="library" @select-game="handleSelectGame" />
        <FavoritesView v-else-if="activeTab === 'favorites'" key="favorites" @select-game="handleSelectGame" />
        <StatsView v-else-if="activeTab === 'stats'" key="stats" />
        <SettingsView v-else-if="activeTab === 'settings'" key="settings" />
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-base);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-shrink: 0;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.back-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px;
  min-height: 0;
}

/* ===== 页面过渡 ===== */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
