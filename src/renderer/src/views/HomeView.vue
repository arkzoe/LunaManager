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

function onWheelScroll(e: WheelEvent): void {
  const el = e.currentTarget as HTMLElement
  if (el.scrollWidth <= el.clientWidth) return
  el.scrollBy({ left: e.deltaY, behavior: 'smooth' })
  e.preventDefault()
}

// section 交错动画索引
const sectionDelays = computed(() => {
  const d = homeData.value
  const visible = [
    d.recentGames.length > 0,
    d.recentAdded.length > 0,
    d.playedActs.length > 0 || d.addedActs.length > 0
  ]
  let i = 0
  return {
    recentGames: visible[0] ? i++ * 0.1 : -1,
    recentAdded: visible[1] ? i++ * 0.1 : -1,
    activity: visible[2] ? i++ * 0.1 : -1
  }
})

const homeData = computed(() => {
  const all = store.allGames
  const total = all.length
  const totalMinutes = all.reduce((sum, g) => sum + Math.floor((g.playtime_seconds || 0) / 60), 0)
  const totalHours = Math.floor(totalMinutes / 60) || 0
  const avgPerDay = total > 0 ? Math.round((totalHours / Math.max(total, 1)) * 10) / 10 : 0
  const overview = { totalGames: total, totalHours, monthlyHours: 0, avgPerDay }

  const withPlayed = all.filter((g) => g.last_played)
  const sortedByPlayed = [...withPlayed].sort((a, b) =>
    (b.last_played || '').localeCompare(a.last_played || '')
  )
  const sortedByAdded = [...all].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

  return {
    overview,
    recentGames: sortedByPlayed.slice(0, 10),
    recentAdded: sortedByAdded.slice(0, 10),
    playedActs: sortedByPlayed.slice(0, 5).map((g) => ({
      type: 'played' as const,
      game: g,
      time: formatRelativeTime(g.last_played || '')
    })),
    addedActs: sortedByAdded.slice(0, 5).map((g) => ({
      type: 'added' as const,
      game: g,
      time: formatRelativeTime(g.created_at)
    }))
  }
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

    <!-- 错误提示 -->
    <div v-if="store.error" class="error-banner">
      <span
        >加载游戏失败：{{ store.error }}。请尝试重新启动应用，或检查 data/lunamanager.db
        数据库文件。</span
      >
    </div>

    <HomeOverviewCards v-else-if="!store.isLoading" :overview="homeData.overview" />

    <!-- 空状态 -->
    <div
      v-if="!store.isLoading && !store.error && homeData.overview.totalGames === 0"
      class="empty-state"
    >
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" class="w-12 h-12 home-empty-svg-icon">
          <path
            d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          />
        </svg>
      </div>
      <h3>还没有游戏</h3>
      <p>去游戏库添加或导入游戏开始管理吧</p>
      <button class="btn-primary" @click="emit('navigateLibrary')">浏览游戏库</button>
    </div>

    <template v-else-if="!store.error">
      <!-- 最近游玩 — 横滑列表 -->
      <section
        v-if="homeData.recentGames.length > 0"
        class="section-block"
        :style="{ animationDelay: sectionDelays.recentGames + 's' }"
      >
        <div class="section-head">
          <h2>最近游玩</h2>
          <button class="section-link" @click="emit('navigateLibrary')">查看全部</button>
        </div>
        <div class="h-scroll" @wheel="onWheelScroll">
          <div
            v-for="game in homeData.recentGames"
            :key="game.id"
            class="scroll-card"
            @click="emit('selectGame', game)"
          >
            <GameCard :game="game" />
          </div>
        </div>
      </section>

      <!-- 最近添加 — 横滑列表 -->
      <section
        v-if="homeData.recentAdded.length > 0"
        class="section-block"
        :style="{ animationDelay: sectionDelays.recentAdded + 's' }"
      >
        <div class="section-head">
          <h2>最近添加</h2>
          <button class="section-link" @click="emit('navigateLibrary')">查看全部</button>
        </div>
        <div class="h-scroll" @wheel="onWheelScroll">
          <div
            v-for="game in homeData.recentAdded"
            :key="game.id"
            class="scroll-card"
            @click="emit('selectGame', game)"
          >
            <GameCard :game="game" />
          </div>
        </div>
      </section>

      <!-- 最近动态 — 左：游玩信息 / 右：新入库 -->
      <section
        v-if="homeData.playedActs.length > 0 || homeData.addedActs.length > 0"
        class="section-block"
        :style="{ animationDelay: sectionDelays.activity + 's' }"
      >
        <div class="section-head">
          <h2>最近动态</h2>
        </div>
        <div class="activity-split">
          <HomeActivityTimeline
            :activities="homeData.playedActs"
            empty-text="还没有游玩记录"
            @select-game="(g) => emit('selectGame', g)"
          />
          <HomeActivityTimeline
            :activities="homeData.addedActs"
            empty-text="还没有导入游戏"
            @select-game="(g) => emit('selectGame', g)"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 100%;
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
  animation: fade-in-up 0.5s ease;
}

.empty-icon {
  transition: transform 0.3s ease;
}

.empty-state:hover .empty-icon {
  transform: scale(1.08) rotate(-4deg);
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
  opacity: 0;
  animation: fade-in-up 0.5s ease forwards;
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
  padding: 6px 0 8px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
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

/* ===== 动态两栏 ===== */
.activity-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 899px) {
  .activity-split {
    grid-template-columns: 1fr;
    gap: 12px;
  }
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

.home-empty-svg-icon {
  fill: var(--accent-primary);
  opacity: 0.65;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--text-primary);
  font-size: 13px;
}
</style>
