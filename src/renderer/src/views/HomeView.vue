<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import type { GameRecord } from '../../../shared/types'
import GameCard from '../shared/GameCard.vue'
import { formatRelativeTime } from '../utils/format'
import HomeOverviewCards from './home/HomeOverviewCards.vue'
import HomeActivityTimeline from './home/HomeActivityTimeline.vue'

const store = useGameStore()

const emit = defineEmits<{
  (e: 'selectGame', game: GameRecord): void
  (e: 'navigateLibrary'): void
}>()

onMounted(() => {
  if (store.games.length === 0) store.loadGames()
})

// 全局概览
const overview = computed(() => {
  const total = store.allGames.length
  const totalMinutes = store.allGames.reduce((sum, g) => {
    const m = g.playtime?.match(/(\d+)/)
    return sum + (m ? parseInt(m[1]) : 0)
  }, 0)
  const totalHours = Math.floor(totalMinutes / 60) || 0
  const avgPerDay = total > 0 ? Math.round((totalHours / Math.max(total, 1)) * 10) / 10 : 0

  return { totalGames: total, totalHours, monthlyHours: 0, avgPerDay }
})

// 最近游玩 — 按 last_played 排序
const recentGames = computed(() =>
  store.allGames
    .filter((g) => g.last_played)
    .sort((a, b) => (b.last_played || '').localeCompare(a.last_played || ''))
    .slice(0, 10)
)

// 最近添加 — 按 created_at 排序
const recentAdded = computed(() =>
  [...store.allGames].sort((a, b) => (b.created_at || 0) - (a.created_at || 0)).slice(0, 6)
)

// 活动动态
const activities = computed(() => {
  const list: { type: string; game: GameRecord; time: string }[] = []

  store.allGames
    .filter((g) => g.last_played)
    .sort((a, b) => (b.last_played || '').localeCompare(a.last_played || ''))
    .slice(0, 3)
    .forEach((g) => {
      list.push({ type: 'played', game: g, time: formatRelativeTime(g.last_played || '') })
    })

  store.allGames
    .filter((g) => g.created_at)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    .slice(0, 2)
    .forEach((g) => {
      list.push({
        type: 'added',
        game: g,
        time: formatRelativeTime(g.created_at)
      })
    })

  return list.slice(0, 5)
})
</script>

<template>
  <div class="home-view">
    <!-- 骨架屏 -->
    <template v-if="store.isLoading && store.games.length === 0">
      <div class="skeleton-grid">
        <div v-for="i in 4" :key="i" class="skeleton-ov-card" />
      </div>
      <div class="skeleton-section">
        <div class="skeleton-title" />
        <div class="skeleton-row">
          <div v-for="i in 5" :key="i" class="skeleton-scroll-card" />
        </div>
      </div>
    </template>

    <HomeOverviewCards v-else :overview="overview" />

    <!-- 空状态 -->
    <div v-if="!store.isLoading && overview.totalGames === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" class="w-12 h-12 fill-brand-300">
          <path
            d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          />
        </svg>
      </div>
      <h3>还没有游戏</h3>
      <p>去游戏库添加或导入游戏开始管理吧</p>
      <button class="btn-brand" @click="emit('navigateLibrary')">浏览游戏库</button>
    </div>

    <template v-else>
      <!-- 最近游玩 — 横滑列表 -->
      <section v-if="recentGames.length > 0" class="section-block">
        <div class="section-head">
          <h2>最近游玩</h2>
          <button class="section-link" @click="emit('navigateLibrary')">查看全部</button>
        </div>
        <div class="h-scroll">
          <div
            v-for="game in recentGames"
            :key="game.id"
            class="scroll-card"
            @click="emit('selectGame', game)"
          >
            <GameCard :game="game" />
          </div>
        </div>
      </section>

      <!-- 最近添加 — 封面墙 -->
      <section class="section-block">
        <div class="section-head">
          <h2>最近添加</h2>
        </div>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3"
          :style="{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }"
        >
          <div
            v-for="game in recentAdded"
            :key="game.id"
            :title="game.title"
            @click="emit('selectGame', game)"
          >
            <GameCard :game="game" />
          </div>
        </div>
      </section>

      <section v-if="activities.length > 0" class="section-block">
        <div class="section-head">
          <h2>最近动态</h2>
        </div>
        <HomeActivityTimeline
          :activities="activities"
          @select-game="(g) => emit('selectGame', g)"
        />
      </section>
    </template>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 960px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.empty-icon {
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-active);
  border-radius: 22px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0 0 24px;
}

/* ===== 区块 ===== */
.section-block {
  margin-bottom: 28px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-head h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-link {
  font-size: 12px;
  color: var(--accent-primary);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
}

.section-link:hover {
  text-decoration: underline;
}

/* ===== 横滑列表 ===== */
.h-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x mandatory;
}

.h-scroll::-webkit-scrollbar {
  height: 4px;
}

.h-scroll::-webkit-scrollbar-thumb {
  background: var(--border-color-medium);
  border-radius: 2px;
}

.scroll-card {
  flex-shrink: 0;
  width: 150px;
  scroll-snap-align: start;
}

/* ===== 骨架屏 ===== */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.skeleton-ov-card {
  height: 74px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-section {
  margin-bottom: 28px;
}

.skeleton-title {
  width: 120px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 14px;
}

.skeleton-row {
  display: flex;
  gap: 12px;
}

.skeleton-scroll-card {
  width: 150px;
  aspect-ratio: 3/4;
  border-radius: 8px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
