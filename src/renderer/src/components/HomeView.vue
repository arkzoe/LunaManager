<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import type { GameRecord } from '../../../shared/types'
import GameCard from './shared/GameCard.vue'
import { formatRelativeTime } from '../utils/format'

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
    <!-- 全局概览卡片 -->
    <div class="overview-cards">
      <div class="ov-card">
        <div class="ov-icon" style="background: var(--bg-active); color: var(--accent-primary)">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
            />
          </svg>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ overview.totalGames }}</div>
          <div class="ov-label">游戏总数</div>
        </div>
      </div>
      <div class="ov-card">
        <div class="ov-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
            />
          </svg>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ overview.totalHours }}<span class="ov-unit">h</span></div>
          <div class="ov-label">总游玩时长</div>
        </div>
      </div>
      <div class="ov-card">
        <div class="ov-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
            />
          </svg>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ overview.monthlyHours }}<span class="ov-unit">h</span></div>
          <div class="ov-label">本月时长</div>
        </div>
      </div>
      <div class="ov-card">
        <div
          class="ov-icon"
          style="background: rgba(139, 124, 232, 0.1); color: var(--accent-primary)"
        >
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div class="ov-info">
          <div class="ov-value">{{ overview.avgPerDay }}<span class="ov-unit">h</span></div>
          <div class="ov-label">日均时长</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="overview.totalGames === 0" class="empty-state">
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
        <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          <div
            v-for="game in recentAdded"
            :key="game.id"
            @click="emit('selectGame', game)"
            :title="game.title"
          >
            <GameCard :game="game" />
          </div>
        </div>
      </section>

      <!-- 活动动态 — 时间线 -->
      <section v-if="activities.length > 0" class="section-block">
        <div class="section-head">
          <h2>最近动态</h2>
        </div>
        <div class="timeline">
          <div
            v-for="(act, idx) in activities"
            :key="idx"
            class="tl-item"
            @click="emit('selectGame', act.game)"
          >
            <div class="tl-dot" :class="act.type" />
            <div class="tl-content">
              <div class="tl-text">
                <template v-if="act.type === 'played'">游玩了</template>
                <template v-else>新入库</template>
                <span class="tl-game">{{ act.game.title_cn || act.game.title }}</span>
              </div>
              <div class="tl-time">{{ act.time }}</div>
            </div>
          </div>
        </div>
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

/* ===== 概览卡片 ===== */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.ov-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px 18px;
  transition: border-color 0.15s;
}

.ov-card:hover {
  border-color: var(--border-color-medium);
}

.ov-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ov-info {
  min-width: 0;
}

.ov-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.ov-unit {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-left: 2px;
}

.ov-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
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

/* ===== 时间线 ===== */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.tl-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  cursor: pointer;
  transition: background 0.15s;
}

.tl-item:hover {
  background: var(--bg-hover);
}

.tl-item + .tl-item {
  border-top: 1px solid var(--border-color-light);
}

.tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.tl-dot.played {
  background: var(--accent-primary);
}

.tl-dot.added {
  background: var(--success);
}

.tl-content {
  min-width: 0;
}

.tl-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.tl-game {
  color: var(--text-primary);
  font-weight: 600;
}

.tl-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
