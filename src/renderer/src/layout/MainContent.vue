<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
import type { GameRecord } from '../../../shared/types'
import HomeView from '../views/HomeView.vue'

const LibraryView = defineAsyncComponent(() => import('../views/LibraryView.vue'))
const FavoritesView = defineAsyncComponent(() => import('../views/FavoritesView.vue'))
const StatsView = defineAsyncComponent(() => import('../views/StatsView.vue'))
const SettingsView = defineAsyncComponent(() => import('../views/SettingsView.vue'))
const GameDetailView = defineAsyncComponent(() => import('../views/GameDetailView.vue'))

// 挂载后立即预加载所有视图 chunk，确保导航即点即开
onMounted(() => {
  import('../views/LibraryView.vue')
  import('../views/FavoritesView.vue')
  import('../views/StatsView.vue')
  import('../views/SettingsView.vue')
  import('../views/GameDetailView.vue')
})

const props = defineProps<{ activeTab: string }>()
const emit = defineEmits<{ (e: 'update:activeTab', tab: string): void }>()

const selectedGame = ref<GameRecord | null>(null)
const contentRef = ref<HTMLElement | null>(null)

watch(
  () => props.activeTab,
  () => {
    selectedGame.value = null
    nextTick(() => {
      contentRef.value?.scrollTo(0, 0)
    })
  }
)

const tabTitle = computed(() => {
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
const handleUpdated = (game: GameRecord): void => {
  selectedGame.value = game
}
</script>

<template>
  <main class="main-area">
    <header class="header">
      <div class="header-left">
        <button v-if="selectedGame" class="back-btn" @click="handleBack">← 返回</button>
        <h1 v-else class="title">{{ tabTitle }}</h1>
      </div>
    </header>
    <div ref="contentRef" class="content">
      <Transition name="page" mode="out-in">
        <GameDetailView
          v-if="selectedGame"
          :key="'detail-' + selectedGame.id"
          :game="selectedGame"
          @back="handleBack"
          @updated="handleUpdated"
        />
        <HomeView
          v-else-if="activeTab === 'home'"
          key="home"
          @select-game="handleSelectGame"
          @navigate-library="() => emit('update:activeTab', 'library')"
        />
        <LibraryView
          v-else-if="activeTab === 'library'"
          key="library"
          @select-game="handleSelectGame"
        />
        <FavoritesView
          v-else-if="activeTab === 'favorites'"
          key="favorites"
          @select-game="handleSelectGame"
        />
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
  padding: 20px 24px 0;
  flex-shrink: 0;
}

@media (max-width: 899px) {
  .header {
    padding: 16px 16px 0;
  }
}

@media (max-width: 699px) {
  .header {
    padding: 12px 12px 0;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
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

@media (max-width: 899px) {
  .content {
    padding: 12px 16px 20px;
  }
}

@media (max-width: 699px) {
  .content {
    padding: 8px 12px 16px;
  }
}

/* ===== 页面过渡 ===== */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
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
