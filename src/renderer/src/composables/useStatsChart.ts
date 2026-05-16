import { computed, type Ref, type ComputedRef } from 'vue'
import type { PlaySession } from '../../../shared/types'
import type { TooltipItem } from 'chart.js'

export function useStatsChart(
  allSessions: Ref<PlaySession[]>,
  timeRange: Ref<'week' | 'month' | 'year' | 'all'>
) {
  const chartData = computed(() => {
    if (allSessions.value.length === 0) return null

    const now = Date.now()
    let cutoff: number
    if (timeRange.value === 'week') cutoff = now - 7 * 24 * 60 * 60 * 1000
    else if (timeRange.value === 'month') cutoff = now - 30 * 24 * 60 * 60 * 1000
    else if (timeRange.value === 'year') cutoff = now - 365 * 24 * 60 * 60 * 1000
    else cutoff = 0

    const sessions = cutoff ? allSessions.value.filter((s) => s.start_time >= cutoff) : allSessions.value
    if (sessions.length === 0) return null

    type GroupEntry = { total: number; sortKey: number }
    const grouped = new Map<string, GroupEntry>()

    for (const s of sessions) {
      if (s.duration <= 0) continue
      const d = new Date(s.start_time)
      let key: string
      let sortKey: number
      if (timeRange.value === 'all') {
        key = `${d.getFullYear()}/${d.getMonth() + 1}`
        sortKey = d.getFullYear() * 12 + d.getMonth()
      } else {
        key = `${d.getMonth() + 1}/${d.getDate()}`
        sortKey = d.getTime()
      }
      const prev = grouped.get(key)
      if (prev) prev.total += s.duration
      else grouped.set(key, { total: s.duration, sortKey })
    }

    const entries = [...grouped.entries()].sort((a, b) => a[1].sortKey - b[1].sortKey)
    const labels = entries.map(([k]) => k)
    const values = entries.map(([, v]) => Math.round((v.total / 3600000) * 10) / 10)

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
