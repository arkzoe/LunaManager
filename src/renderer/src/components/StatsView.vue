<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChartOptions } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
  playtime?: string
}

const props = defineProps<{
  games: Game[]
}>()

const timeRange = ref<'week' | 'month' | 'custom'>('week')

// 概览数据
// const totalGames = computed(() => props.games.length)
const installedGames = computed(() => props.games.filter((g) => g.installed).length)
// const favoriteGames = computed(() => props.games.filter((g) => g.favorite).length)

// 计算总游戏时长（分钟）
const totalPlaytimeMinutes = computed(() => {
  let total = 0
  props.games.forEach((game) => {
    if (game.playtime && game.playtime !== '未知') {
      const match = game.playtime.match(/(\d+)/)
      if (match) {
        total += parseInt(match[1]) * 60
      }
    }
  })
  return total
})

// 格式化游戏时长显示
const formatPlaytime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (remainingHours === 0) return `${days}天`
  return `${days}天${remainingHours}小时`
}

// 分类统计
const categoryStats = computed(() => {
  const stats: Record<string, number> = {}
  props.games.forEach((game) => {
    stats[game.category] = (stats[game.category] || 0) + 1
  })
  return stats
})

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    action: '动作',
    rpg: '角色扮演',
    strategy: '策略',
    sports: '体育',
    adventure: '冒险',
    simulation: '模拟'
  }
  return labels[category] || category
}

// 获取分类颜色 - 使用更鲜明的配色
const getCategoryColor = (index: number): string => {
  const colors = [
    '#4f46e5', // accent-600
    '#7c3aed', // purple-600
    '#db2777', // pink-600
    '#ea580c', // warning-600
    '#059669', // success-600
    '#0891b2', // info-600
    '#dc2626', // danger-600
    '#4338ca' // accent-700
  ]
  return colors[index % colors.length]
}

// 分类饼图数据
const categoryChartData = computed(() => {
  const entries = Object.entries(categoryStats.value)
  return {
    labels: entries.map(([cat]) => getCategoryLabel(cat)),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map((_, i) => getCategoryColor(i)),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }
})

const categoryChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 12 }
      }
    }
  },
  cutout: '60%'
}

// 生成最近7天的日期
const generateDates = (days: number): string[] => {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
  }
  return dates
}

// 模拟每日游戏时长数据（实际应从数据库获取）
const generateDailyData = (days: number): number[] => {
  return Array.from({ length: days }, () => Math.floor(Math.random() * 180))
}

// 游玩时长趋势图数据
const trendChartData = computed(() => {
  const days = timeRange.value === 'week' ? 7 : 30
  const dates = generateDates(days)
  const data = generateDailyData(days)

  return {
    labels: dates,
    datasets: [
      {
        label: '游戏时长（分钟）',
        data: data,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6
      }
    ]
  }
})

const trendChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, color: '#6b7280' }
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        font: { size: 11 },
        color: '#6b7280',
        callback: (value: number | string) => `${value}分`
      }
    }
  }
}

// 游戏时长排行榜数据
const topGamesChartData = computed(() => {
  const sortedGames = [...props.games]
    .filter((g) => g.playtime && g.playtime !== '未知')
    .sort((a, b) => {
      const aMatch = a.playtime?.match(/(\d+)/)
      const bMatch = b.playtime?.match(/(\d+)/)
      const aHours = aMatch ? parseInt(aMatch[1]) : 0
      const bHours = bMatch ? parseInt(bMatch[1]) : 0
      return bHours - aHours
    })
    .slice(0, 5)

  return {
    labels: sortedGames.map((g) => (g.title.length > 8 ? g.title.slice(0, 8) + '...' : g.title)),
    datasets: [
      {
        label: '游戏时长（小时）',
        data: sortedGames.map((g) => {
          const match = g.playtime?.match(/(\d+)/)
          return match ? parseInt(match[1]) : 0
        }),
        backgroundColor: '#4f46e5',
        borderRadius: 6,
        barThickness: 24,
        hoverBackgroundColor: '#4338ca'
      }
    ]
  }
})

const topGamesChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { font: { size: 11 }, color: '#6b7280' }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 12 }, color: '#374151' }
    }
  }
}

// 最近游玩游戏
// const recentlyPlayed = computed(() => {
//   return props.games
//     .filter((g) => g.lastPlayed && g.installed)
//     .sort((a, b) => {
//       const order = ['天前', '周前', '月前']
//       const getPriority = (str: string | undefined): number => {
//         if (!str) return 999
//         for (let i = 0; i < order.length; i++) {
//           if (str.includes(order[i])) return i
//         }
//         return 999
//       }
//       return getPriority(a.lastPlayed) - getPriority(b.lastPlayed)
//     })
//     .slice(0, 5)
// })
</script>

<template>
  <div class="stats-view">
    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <button
        class="range-btn"
        :class="{ active: timeRange === 'week' }"
        @click="timeRange = 'week'"
      >
        周
      </button>
      <button
        class="range-btn"
        :class="{ active: timeRange === 'month' }"
        @click="timeRange = 'month'"
      >
        月
      </button>
      <button
        class="range-btn"
        :class="{ active: timeRange === 'custom' }"
        @click="timeRange = 'custom'"
      >
        <svg viewBox="0 0 24 24" class="calendar-icon">
          <path
            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
          />
        </svg>
        自定义
      </button>
    </div>

    <!-- 概览卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total">
          <svg viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">0</span>
          <span class="stat-label">总游玩次数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon playtime">
          <svg viewBox="0 0 24 24">
            <path
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
            />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ formatPlaytime(totalPlaytimeMinutes) }}</span>
          <span class="stat-label">总游玩时长</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon games">
          <svg viewBox="0 0 24 24">
            <path
              d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
            />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ installedGames }}</span>
          <span class="stat-label">游玩游戏数量</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon completed">
          <svg viewBox="0 0 24 24">
            <path
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
            />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">0</span>
          <span class="stat-label">通关游戏</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <!-- 分类统计饼图 -->
      <div class="chart-card category-chart">
        <h3 class="chart-title">
          <svg viewBox="0 0 24 24" class="title-icon">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            />
          </svg>
          游戏分类分布
        </h3>
        <div class="chart-container">
          <Doughnut
            v-if="Object.keys(categoryStats).length > 0"
            :data="categoryChartData"
            :options="categoryChartOptions"
          />
          <div v-else class="empty-chart">暂无数据</div>
        </div>
      </div>

      <!-- 游玩时长趋势图 -->
      <div class="chart-card trend-chart">
        <h3 class="chart-title">
          <svg viewBox="0 0 24 24" class="title-icon">
            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
          </svg>
          游玩时长趋势
        </h3>
        <div class="chart-container">
          <Line :data="trendChartData" :options="trendChartOptions" />
        </div>
      </div>
    </div>

    <!-- 游戏时长排行榜 -->
    <div class="chart-card ranking-chart">
      <h3 class="chart-title">
        <svg viewBox="0 0 24 24" class="title-icon">
          <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z" />
        </svg>
        游玩时长排行榜
      </h3>
      <div class="chart-container ranking-container">
        <Bar
          v-if="props.games.some((g) => g.playtime && g.playtime !== '未知')"
          :data="topGamesChartData"
          :options="topGamesChartOptions"
        />
        <div v-else class="empty-chart">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-view {
  height: 100%;
  min-height: 400px;
  overflow-y: auto;
  padding: 0 8px 8px 0;
}

.stats-view::-webkit-scrollbar {
  width: 6px;
}

.stats-view::-webkit-scrollbar-track {
  background: transparent;
}

.stats-view::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* 时间范围选择器 */
.time-range-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.range-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-btn:hover {
  border-color: #cbd5e1;
  color: #334155;
}

.range-btn.active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

.calendar-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* 概览卡片 */
.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  width: 200px;
  height: 80px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-sizing: border-box;
}

.stat-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}
.stat-icon.playtime {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}
.stat-icon.games {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}
.stat-icon.completed {
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

/* 图表区域 */
.charts-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.category-chart {
  width: 380px;
  height: 280px;
  flex-shrink: 0;
}

.trend-chart {
  flex: 1;
  min-width: 400px;
  height: 280px;
}

.ranking-chart {
  width: 100%;
  height: 320px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px 0;
}

.title-icon {
  width: 20px;
  height: 20px;
  fill: #64748b;
}

.chart-container {
  height: calc(100% - 40px);
  position: relative;
}

.ranking-container {
  height: calc(100% - 40px);
}

.empty-chart {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
}
</style>
