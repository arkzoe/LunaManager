import { computed, type Ref } from 'vue'
import type { PlaySession } from '../../../shared/types'
import type { TooltipItem } from 'chart.js'

export function useStatsChart(
  allSessions: Ref<PlaySession[]>,
  timeRange: Ref<'week' | 'month' | 'year' | 'all'>
) {
  const CUTOFFS: Record<string, number> = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000
  }

  const chartData = computed(() => {
    const sessions = allSessions.value
    if (sessions.length === 0) return null

    const range = timeRange.value
    const rangeMs = CUTOFFS[range]
    const cutoff = rangeMs ? Date.now() - rangeMs : 0

    let filtered = sessions
    if (cutoff) {
      filtered = cutoff ? sessions.filter((s) => s.start_time >= cutoff) : sessions
    }
    if (filtered.length === 0) return null

    const grouped = new Map<string, number>()
    const keyMap = new Map<string, number>()

    for (let i = 0; i < filtered.length; i++) {
      const s = filtered[i]
      if (s.duration <= 0) continue
      const d = new Date(s.start_time)
      let key: string
      let sortKey: number
      if (range === 'all') {
        key = `${d.getFullYear()}/${d.getMonth() + 1}`
        sortKey = d.getFullYear() * 12 + d.getMonth()
      } else {
        key = `${d.getMonth() + 1}/${d.getDate()}`
        sortKey = d.getTime()
      }
      grouped.set(key, (grouped.get(key) || 0) + s.duration)
      keyMap.set(key, sortKey)
    }

    const labels: string[] = []
    const values: number[] = []
    const keys = [...grouped.keys()].sort((a, b) => (keyMap.get(a) || 0) - (keyMap.get(b) || 0))
    for (let i = 0; i < keys.length; i++) {
      labels.push(keys[i])
      values.push(Math.round(((grouped.get(keys[i]) || 0) / 3600000) * 10) / 10)
    }

    return {
      labels,
      datasets: [{
        label: '游玩时长 (小时)',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }]
    }
  })

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => `${ctx.parsed.y ?? 0} 小时`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        ticks: { font: { size: 11 }, color: '#9ca3af', callback: (v: number | string) => `${v}h` }
      }
    }
  }

  return { chartData, chartOptions }
}
