<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
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

const recentScrollRef = ref<HTMLElement | null>(null)
const addedScrollRef = ref<HTMLElement | null>(null)
const recentScrollable = ref(false)
const addedScrollable = ref(false)

onMounted(() => {
  if (store.games.length === 0) store.loadGames()
  nextTick(() => {
    if (recentScrollRef.value) recentScrollable.value = recentScrollRef.value.scrollWidth > recentScrollRef.value.clientWidth
    if (addedScrollRef.value) addedScrollable.value = addedScrollRef.value.scrollWidth > addedScrollRef.value.clientWidth
  })
})

function onWheelScroll(e: WheelEvent) {
  const el = e.currentTarget as HTMLElement
  el.scrollBy({ left: e.deltaY, behavior: 'smooth' })
  e.preventDefault()
}

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
  [...store.allGames].sort((a, b) => (b.created_at || 0) - (a.created_at || 0)).slice(0, 10)
)

// 最近动态 — 游玩信息（左侧）
const playedActs = computed(() =>
  store.allGames
    .filter((g) => g.last_played)
    .sort((a, b) => (b.last_played || '').localeCompare(a.last_played || ''))
    .slice(0, 5)
    .map((g) => ({
      type: 'played' as const,
      game: g,
      time: formatRelativeTime(g.last_played || '')
    }))
)

// section 交错动画索引 — 先预计算可见性，仅对可见 section 递增 i
const sectionDelays = computed(() => {
  const visible: boolean[] = [
    recentGames.value.length > 0,
    recentAdded.value.length > 0,
    playedActs.value.length > 0 || addedActs.value.length > 0
  ]
  let i = 0
  return {
    recentGames: visible[0] ? i++ * 0.1 : -1,
    recentAdded: visible[1] ? i++ * 0.1 : -1,
    activity: visible[2] ? i++ * 0.1 : -1
  }
})

// 最近动态 — 新入库（右侧）
const addedActs = computed(() =>
  store.allGames
    .filter((g) => g.created_at)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    .slice(0, 5)
    .map((g) => ({
      type: 'added' as const,
      game: g,
      time: formatRelativeTime(g.created_at)
    }))
)
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
      <section
        v-if="recentGames.length > 0"
        class="section-block"
        :style="{ animationDelay: sectionDelays.recentGames + 's' }"
      >
        <div class="section-head">
          <h2>最近游玩</h2>
          <button class="section-link" @click="emit('navigateLibrary')">查看全部</button>
        </div>
        <div
          ref="recentScrollRef"
          class="h-scroll"
          :class="{ 'is-scrollable': recentScrollable }"
          @wheel="recentScrollable && onWheelScroll($event)"
        >
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

      <!-- 最近添加 — 横滑列表 -->
      <section
        v-if="recentAdded.length > 0"
        class="section-block"
        :style="{ animationDelay: sectionDelays.recentAdded + 's' }"
      >
        <div class="section-head">
          <h2>最近添加</h2>
          <button class="section-link" @click="emit('navigateLibrary')">查看全部</button>
        </div>
        <div
          ref="addedScrollRef"
          class="h-scroll"
          :class="{ 'is-scrollable': addedScrollable }"
          @wheel="addedScrollable && onWheelScroll($event)"
        >
          <div
            v-for="game in recentAdded"
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
        v-if="playedActs.length > 0 || addedActs.length > 0"
        class="section-block"
        :style="{ animationDelay: sectionDelays.activity + 's' }"
      >
        <div class="section-head">
          <h2>最近动态</h2>
        </div>
        <div class="activity-split">
          <HomeActivityTimeline
            :activities="playedActs"
            @select-game="(g) => emit('selectGame', g)"
          />
          <HomeActivityTimeline
            :activities="addedActs"
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
  overflow-x: hidden;
  padding: 6px 0 8px;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.h-scroll.is-scrollable {
  overflow-x: auto;
}

.h-scroll.is-scrollable::-webkit-scrollbar {
  height: 4px;
}

.h-scroll.is-scrollable::-webkit-scrollbar-thumb {
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
</style>
