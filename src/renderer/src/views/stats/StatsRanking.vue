<script setup lang="ts">
interface RankingItem {
  rank: number
  title: string
  playtime: string
  cover: string
}

defineProps<{
  rankings: RankingItem[]
  topGame: RankingItem | undefined
  rankRange: 'week' | 'month' | 'all'
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rankRange', val: 'week' | 'month' | 'all'): void
}>()
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <span>游戏时长排行</span>
      <div class="time-toggle">
        <button
          class="tt-btn"
          :class="{ active: rankRange === 'week' }"
          @click="emit('update:rankRange', 'week')"
        >
          本周
        </button>
        <button
          class="tt-btn"
          :class="{ active: rankRange === 'month' }"
          @click="emit('update:rankRange', 'month')"
        >
          本月
        </button>
        <button
          class="tt-btn"
          :class="{ active: rankRange === 'all' }"
          @click="emit('update:rankRange', 'all')"
        >
          总计
        </button>
      </div>
    </div>
    <div v-if="loading" class="loading-placeholder">
      <p>加载中...</p>
    </div>
    <div v-else-if="topGame" class="rankings">
      <div class="rank-left">
        <div class="rl-cover">
          <img
            v-if="topGame.cover"
            :src="topGame.cover"
            :alt="topGame.title"
            class="rl-cover-img"
          />
          <div v-else class="rl-cover-ph">
            <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-25">
              <path
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              />
            </svg>
          </div>
        </div>
        <div class="rl-name">{{ topGame.title }}</div>
        <div class="rl-time">{{ topGame.playtime }}</div>
      </div>
      <div class="rank-right">
        <div class="rr-header">
          <span class="rr-rank">#</span>
          <span class="rr-title">游戏</span>
          <span class="rr-time">时长</span>
        </div>
        <div v-for="g in rankings.slice(1)" :key="g.rank" class="rr-row">
          <span class="rr-rank">{{ g.rank }}</span>
          <span class="rr-title">{{ g.title }}</span>
          <span class="rr-time">{{ g.playtime }}</span>
        </div>
        <div v-if="rankings.length <= 1" class="rr-empty">暂无排行数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  user-select: none;
}

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
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
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

.rankings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 1px solid var(--border-color-light);
}

/* ===== 左栏 — #1 大封面 ===== */
.rank-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  border-right: 1px solid var(--border-color-light);
  text-align: center;
}

.rl-badge {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 12px;
}

.rl-cover {
  width: 240px;
  height: 336px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rl-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rl-cover-ph {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rl-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rl-time {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* ===== 右栏 — 其余排行 ===== */
.rank-right {
  padding: 16px 14px;
}

.rr-header {
  display: grid;
  grid-template-columns: 32px 1fr 72px;
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rr-row {
  display: grid;
  grid-template-columns: 32px 1fr 72px;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.1s;
}

.rr-row:hover {
  background: var(--bg-hover);
}

.rr-rank {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.rr-title {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rr-time {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

.rr-empty {
  padding: 30px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
}

.loading-placeholder {
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
  border-top: 1px solid var(--border-color-light);
}
</style>
