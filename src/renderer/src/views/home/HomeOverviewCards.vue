<script setup lang="ts">
import { useCountUp } from '../../composables/useCountUp'

const props = defineProps<{
  overview: {
    totalGames: number
    totalHours: number
    monthlyHours: number
    avgPerDay: number
  }
}>()

const { display: gamesDisplay } = useCountUp(() => props.overview.totalGames, 700)
const { display: hoursDisplay } = useCountUp(() => props.overview.totalHours, 700)
const { display: monthlyDisplay } = useCountUp(() => props.overview.monthlyHours, 700)
const { display: avgDisplay } = useCountUp(() => props.overview.avgPerDay, 700)
</script>

<template>
  <div class="overview-cards">
    <div class="ov-card" :style="{ animationDelay: '0s' }">
      <div class="ov-icon" style="background: var(--bg-active); color: var(--accent-primary)">
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path
            d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
          />
        </svg>
      </div>
      <div class="ov-info">
        <div class="ov-value">{{ gamesDisplay }}<span class="ov-unit">个</span></div>
        <div class="ov-label">游戏总数</div>
      </div>
    </div>
    <div class="ov-card" :style="{ animationDelay: '0.1s' }">
      <div class="ov-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success)">
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path
            d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
          />
        </svg>
      </div>
      <div class="ov-info">
        <div class="ov-value">{{ hoursDisplay }}<span class="ov-unit">h</span></div>
        <div class="ov-label">总游玩时长</div>
      </div>
    </div>
    <div class="ov-card" :style="{ animationDelay: '0.2s' }">
      <div class="ov-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning)">
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path
            d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
          />
        </svg>
      </div>
      <div class="ov-info">
        <div class="ov-value">{{ monthlyDisplay }}<span class="ov-unit">h</span></div>
        <div class="ov-label">本月时长</div>
      </div>
    </div>
    <div class="ov-card" :style="{ animationDelay: '0.3s' }">
      <div
        class="ov-icon"
        style="background: rgba(59, 130, 246, 0.1); color: var(--accent-primary)"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <div class="ov-info">
        <div class="ov-value">{{ avgDisplay }}<span class="ov-unit">h</span></div>
        <div class="ov-label">日均时长</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 899px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
}

@media (max-width: 599px) {
  .overview-cards {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
}

.ov-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px 18px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: fade-in-up 0.5s ease forwards;
}

.ov-card:hover {
  border-color: var(--border-color-medium);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  will-change: transform;
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
</style>
