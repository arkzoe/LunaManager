<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { GameRecord, PlaySession } from '../../../../shared/types'
import { formatPlaytime, formatRelativeTime } from '../../utils/format'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{ game: GameRecord }>()

const sessions = ref<PlaySession[]>([])
const totalSessions = ref(0)
const totalDuration = ref(0)
const lastPlayed = ref<number | null>(null)
const loading = ref(true)
const timeRange = ref<'week' | 'month' | 'all'>('month')

const totalPlaytimeDisplay = computed(() => {
  if (totalDuration.value <= 0) return '-'
  return formatPlaytime(Math.floor(totalDuration.value / 1000))
})

const lastPlayedDisplay = computed(() => {
  if (lastPlayed.value) return formatRelativeTime(lastPlayed.value)
  if (props.game.last_played) return formatRelativeTime(props.game.last_played)
  return '-'
})

const timeRangeOptions = [
  { id: 'week' as const, label: '按周' },
  { id: 'month' as const, label: '按月' },
  { id: 'all' as const, label: '总计' }
]

const chartData = computed(() => {
  if (sessions.value.length === 0) return null

  const now = Date.now()
  let cutoff = 0
  if (timeRange.value === 'week') {
    cutoff = now - 7 * 24 * 60 * 60 * 1000
  } else if (timeRange.value === 'month') {
    cutoff = now - 30 * 24 * 60 * 60 * 1000
  }

  const filtered = timeRange.value === 'all'
    ? sessions.value
    : sessions.value.filter((s) => s.start_time >= cutoff)

  if (filtered.length === 0) return null

  const grouped = new Map<string, number>()
  for (const s of filtered) {
    if (s.duration <= 0) continue
    const d = new Date(s.start_time)
    let key: string
    if (timeRange.value === 'week') {
      key = `${d.getMonth() + 1}/${d.getDate()}`
    } else if (timeRange.value === 'month') {
      key = `${d.getMonth() + 1}/${d.getDate()}`
    } else {
      key = `${d.getFullYear()}/${d.getMonth() + 1}`
    }
    grouped.set(key, (grouped.get(key) || 0) + s.duration)
  }

  const labels = [...grouped.keys()]
  const values = [...grouped.values()].map((d) => Math.round(d / 3600000 * 10) / 10)

  return {
    labels,
    datasets: [
      {
        label: '游玩时长 (小时)',
        data: values,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1'
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.parsed.y} 小时`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' }
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(156, 163, 175, 0.1)' },
      ticks: {
        font: { size: 11 },
        color: '#9ca3af',
        callback: (v: any) => `${v}h`
      }
    }
  }
}))

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

    <div v-if="chartData" class="chart-area">
      <div class="chart-header">
        <div class="chart-title">游玩时长趋势</div>
        <div class="chart-toggles">
          <button
            v-for="opt in timeRangeOptions"
            :key="opt.id"
            class="toggle-btn"
            :class="{ active: timeRange === opt.id }"
            @click="timeRange = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <div class="chart-container">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
    <div v-else-if="!loading" class="chart-placeholder">
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

.chart-area {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 20px 18px 14px;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.chart-toggles {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-color-medium);
}

.toggle-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.chart-container {
  height: 200px;
  position: relative;
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
