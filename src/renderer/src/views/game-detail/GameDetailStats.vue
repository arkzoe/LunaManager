<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { GameRecord, PlaySession } from '../../../../shared/types'
import { formatPlaytime, formatRelativeTime, formatDate } from '../../utils/format'

const props = defineProps<{ game: GameRecord }>()

const sessions = ref<PlaySession[]>([])
const totalSessions = ref(0)
const totalDuration = ref(0)
const lastPlayed = ref<number | null>(null)
const loading = ref(true)

const totalPlaytimeDisplay = computed(() => {
  if (totalDuration.value <= 0) return '-'
  return formatPlaytime(Math.floor(totalDuration.value / 1000))
})

const lastPlayedDisplay = computed(() => {
  if (lastPlayed.value) return formatRelativeTime(lastPlayed.value)
  if (props.game.last_played) return formatRelativeTime(props.game.last_played)
  return '-'
})

// Build simple chart data: group sessions by day
const chartData = computed(() => {
  const dayMap = new Map<string, number>()
  for (const s of sessions.value) {
    if (s.duration <= 0) continue
    const day = formatDate(s.start_time)
    dayMap.set(day, (dayMap.get(day) || 0) + s.duration)
  }
  const sorted = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  if (sorted.length === 0) return null

  const maxDur = Math.max(...sorted.map(([, d]) => d))
  return sorted.map(([day, dur]) => ({
    day: day.slice(5), // MM-DD
    duration: dur,
    hours: (dur / 3600000).toFixed(1),
    pct: maxDur > 0 ? Math.round((dur / maxDur) * 100) : 0
  }))
})

onMounted(async () => {
  try {
    const [stats, allSessions] = await Promise.all([
      window.api.getAggregatedStats(props.game.id),
      window.api.getSessionsByGame(props.game.id)
    ])
    totalSessions.value = stats.total_sessions
    totalDuration.value = stats.total_duration
    lastPlayed.value = stats.last_played
    sessions.value = allSessions
  } catch (err) {
    console.error('Failed to load play stats:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="tab-panel">
    <div class="stats-grid">
      <div class="stat-box">
        <div class="sb-value">{{ totalPlaytimeDisplay }}</div>
        <div class="sb-label">总游玩时长</div>
      </div>
      <div class="stat-box">
        <div class="sb-value">{{ totalSessions || '-' }}</div>
        <div class="sb-label">总启动次数</div>
      </div>
      <div class="stat-box">
        <div class="sb-value">{{ lastPlayedDisplay }}</div>
        <div class="sb-label">最后游玩</div>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="chartData && chartData.length > 0" class="chart-area">
      <div class="chart-title">游玩时长趋势</div>
      <div class="bar-chart">
        <div v-for="bar in chartData" :key="bar.day" class="bar-col">
          <div class="bar-val">{{ bar.hours }}h</div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ height: bar.pct + '%' }" />
          </div>
          <div class="bar-label">{{ bar.day }}</div>
        </div>
      </div>
    </div>
    <div v-else class="chart-placeholder">
      <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-20 mb-3">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
      </svg>
      <p>还没有游玩记录，快去启动游戏吧</p>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-box {
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 18px 14px;
}

.sb-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.sb-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* Chart */
.chart-area {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 20px 18px 14px;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-val {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 32px;
  display: flex;
  align-items: flex-end;
  background: var(--bg-secondary);
  border-radius: 4px 4px 0 0;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  background: var(--accent-primary);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 9px;
  color: var(--text-tertiary);
  margin-top: 4px;
  flex-shrink: 0;
  white-space: nowrap;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.chart-placeholder p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}
</style>
