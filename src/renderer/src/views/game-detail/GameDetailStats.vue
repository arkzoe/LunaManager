<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'
import { formatRelativeTime } from '../../utils/format'

defineProps<{ game: GameRecord }>()
</script>

<template>
  <div class="tab-panel">
    <div class="stats-grid">
      <div class="stat-box">
        <div class="sb-value">{{ game.playtime || '-' }}</div>
        <div class="sb-label">总游玩时长</div>
      </div>
      <div class="stat-box">
        <div class="sb-value">-</div>
        <div class="sb-label">总启动次数</div>
      </div>
      <div class="stat-box">
        <div class="sb-value">{{ formatRelativeTime(game.last_played) || '-' }}</div>
        <div class="sb-label">最后游玩</div>
      </div>
    </div>
    <div class="chart-placeholder">
      <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-20 mb-3">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
      </svg>
      <p>游玩时长趋势图将在接入真实数据后显示</p>
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
