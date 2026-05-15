<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import { formatPlaytime } from '../utils/format'
import StatsRanking from './stats/StatsRanking.vue'

const store = useGameStore()
const timeRange = ref<'week' | 'month' | 'year' | 'all'>('week')
const rankRange = ref<'week' | 'month'>('week')
const showLibraryOverview = ref(true)

interface AggregatedStat {
  game_id: string
  total_sessions: number
  total_duration: number
  last_played: number | null
}

const allStats = ref<AggregatedStat[]>([])
const totalSessionCount = ref(0)

onMounted(async () => {
  if (store.games.length === 0) await store.loadGames()
  const [stats, count] = await Promise.all([
    window.api.getAllAggregatedStats(),
    window.api.getTotalSessionCount()
  ])
  allStats.value = stats
  totalSessionCount.value = count
})

const libraryStats = computed(() => {
  const totalGames = store.allGames.length
  let totalMs = 0
  for (const s of allStats.value) {
    totalMs += s.total_duration
  }
  const totalHours = Math.floor(totalMs / 3600000) || 0
  const completedGames = store.allGames.filter((g) => g.status === 'played').length
  return {
    totalGames,
    totalHours,
    completedGames,
    avgPerDay: totalGames > 0 ? Math.round(totalHours / Math.max(totalGames, 1)) : 0
  }
})

const rankings = computed(() => {
  const gameMap = new Map(store.allGames.map((g) => [g.id, g]))
  const ranked = allStats.value
    .filter((s) => s.total_duration > 0)
    .slice(0, 5)
    .map((s, idx) => {
      const game = gameMap.get(s.game_id)
      return {
        rank: idx + 1,
        title: game ? game.title_cn || game.title : s.game_id,
        playtime: formatPlaytime(Math.floor(s.total_duration / 1000))
      }
    })

  if (ranked.length === 0) {
    return [
      { rank: 1, title: '-', playtime: '-' },
      { rank: 2, title: '-', playtime: '-' }
    ]
  }
  return ranked
})

const topGame = computed(() => rankings.value[0])

const timeRanges = [
  { id: 'week' as const, label: '周' },
  { id: 'month' as const, label: '月' },
  { id: 'year' as const, label: '年' },
  { id: 'all' as const, label: '全部' }
]
</script>

<template>
  <div class="stats-page">
    <!-- 总览卡片行 -->
    <div class="overview-row">
      <div class="ov-card">
        <div class="ov-icon ac">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
            />
          </svg>
        </div>
        <div class="ov-num">{{ libraryStats.totalGames }}</div>
        <div class="ov-lbl">游戏总数</div>
      </div>
      <div class="ov-card">
        <div class="ov-icon gr">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
            />
          </svg>
        </div>
        <div class="ov-num">{{ libraryStats.totalHours }}<span class="ov-u">h</span></div>
        <div class="ov-lbl">总时长</div>
      </div>
      <div class="ov-card">
        <div class="ov-icon am">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
            />
          </svg>
        </div>
        <div class="ov-num">{{ libraryStats.completedGames }}</div>
        <div class="ov-lbl">已通关</div>
      </div>
      <div class="ov-card">
        <div class="ov-icon pu">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div class="ov-num">{{ libraryStats.avgPerDay }}<span class="ov-u">h</span></div>
        <div class="ov-lbl">日均</div>
      </div>
    </div>

    <!-- 库概览折叠面板 -->
    <div class="panel">
      <div class="panel-header" @click="showLibraryOverview = !showLibraryOverview">
        <span>库概览</span>
        <svg
          viewBox="0 0 24 24"
          class="w-4 h-4 fill-text-tertiary transition-transform duration-300"
          :class="{ 'rotate-180': showLibraryOverview }"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
      <div v-show="showLibraryOverview" class="panel-body overview-grid">
        <div class="og-item">
          <div class="og-val">{{ libraryStats.totalGames }}</div>
          <div class="og-lbl">库中所有游戏</div>
        </div>
        <div class="og-item">
          <div class="og-val">{{ totalSessionCount || '-' }}</div>
          <div class="og-lbl">总游玩次数</div>
        </div>
        <div class="og-item">
          <div class="og-val">{{ libraryStats.totalHours }}h</div>
          <div class="og-lbl">总游玩时长</div>
        </div>
        <div class="og-item">
          <div class="og-val">{{ libraryStats.completedGames }}</div>
          <div class="og-lbl">通关游戏数</div>
        </div>
      </div>
    </div>

    <!-- 时间范围 + 时长趋势图表 -->
    <div class="panel">
      <div class="panel-header">
        <span>游玩时长趋势</span>
        <div class="time-toggle">
          <button
            v-for="r in timeRanges"
            :key="r.id"
            class="tt-btn"
            :class="{ active: timeRange === r.id }"
            @click="timeRange = r.id"
          >
            {{ r.label }}
          </button>
        </div>
      </div>
      <div class="chart-ph">
        <svg viewBox="0 0 24 24" class="w-12 h-12 fill-text-muted opacity-15 mb-3">
          <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
        </svg>
        <p>游玩时长趋势图将在接入真实数据后显示</p>
      </div>
    </div>

    <!-- 排行榜 -->
    <StatsRanking v-model:rank-range="rankRange" :rankings="rankings" :top-game="topGame" />
  </div>
</template>

<style scoped>
.stats-page {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 总览卡片 ===== */
.overview-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.ov-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: border-color 0.15s;
  cursor: default;
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
  margin-bottom: 10px;
}

.ov-icon.ac {
  background: var(--bg-active);
  color: var(--accent-primary);
}
.ov-icon.gr {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}
.ov-icon.am {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}
.ov-icon.pu {
  background: rgba(139, 124, 232, 0.1);
  color: var(--accent-primary);
}

.ov-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.ov-u {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-left: 2px;
}

.ov-lbl {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* ===== 面板 ===== */
.panel {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.panel-header:hover {
  background: var(--bg-hover);
}

.panel-body {
  padding: 18px;
  border-top: 1px solid var(--border-color-light);
}

/* 库概览网格 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  text-align: center;
}

.og-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.og-lbl {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 时间切换 */
.time-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 2px;
}

.tt-btn {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.tt-btn:hover {
  color: var(--text-primary);
}

.tt-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* ===== 图表占位 ===== */
.chart-ph {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.chart-ph p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}
</style>
