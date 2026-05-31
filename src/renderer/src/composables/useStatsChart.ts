import type { ChartDataResult } from '../../../shared/types'
import type { TooltipItem } from 'chart.js'

function hexToRgba(hex: string, alpha: number): string {
  const v = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`
}

/**
 * 图表数据由后端 getChartData IPC 预聚合，渲染进程仅负责格式转换。
 * 将后端返回的 labels/values 组装为 Chart.js 所需的数据格式。
 */
export function buildChartData(
  result: ChartDataResult,
  accentColor?: string
): {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill: boolean
    tension: number
    pointRadius: number
    pointHitRadius: number
    pointBackgroundColor: string
  }[]
} | null {
  if (result.labels.length === 0) return null

  const ac = accentColor ?? '#3b82f6'

  return {
    labels: result.labels,
    datasets: [
      {
        label: '游玩时长 (小时)',
        data: result.values,
        borderColor: ac,
        backgroundColor: hexToRgba(ac, 0.08),
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHitRadius: 20,
        pointBackgroundColor: ac
      }
    ]
  }
}

export function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => `时长: ${(ctx.parsed.y ?? 0).toFixed(1)} 小时`
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
}
