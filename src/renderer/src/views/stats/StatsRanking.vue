<script setup lang="ts">
interface RankingItem {
  rank: number
  title: string
  playtime: string
}

defineProps<{
  rankings: RankingItem[]
  topGame: RankingItem | undefined
  rankRange: 'week' | 'month'
}>()

const emit = defineEmits<{
  (e: 'update:rankRange', val: 'week' | 'month'): void
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
      </div>
    </div>
    <div class="rankings">
      <div v-if="topGame" class="rank-top">
        <div class="rt-badge">#1</div>
        <div class="rt-cover">
          <svg viewBox="0 0 24 24" class="w-8 h-8 fill-text-muted opacity-25">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        </div>
        <div class="rt-name">{{ topGame.title }}</div>
        <div class="rt-time">{{ topGame.playtime }}</div>
      </div>

      <div class="rank-list">
        <div class="rl-header">
          <span class="rl-rank">#</span>
          <span class="rl-title">游戏</span>
          <span class="rl-time">时长</span>
        </div>
        <div v-for="g in rankings.slice(1)" :key="g.rank" class="rl-row">
          <span class="rl-rank">{{ g.rank }}</span>
          <span class="rl-title">{{ g.title }}</span>
          <span class="rl-time">{{ g.playtime }}</span>
        </div>
        <div v-if="rankings.length <= 1" class="rl-empty">暂无排行数据</div>
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
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.panel-header:hover {
  background: var(--bg-hover);
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

.rankings {
  padding: 0 18px 18px;
  border-top: 1px solid var(--border-color-light);
}

.rank-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 20px;
  text-align: center;
}

.rt-badge {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 12px;
}

.rt-cover {
  width: 100px;
  height: 140px;
  background: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border: 1px solid var(--border-color);
}

.rt-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.rt-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.rank-list {
  margin-top: 8px;
}

.rl-header {
  display: grid;
  grid-template-columns: 40px 1fr 80px;
  padding: 8px 12px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rl-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.1s;
}

.rl-row:hover {
  background: var(--bg-hover);
}

.rl-rank {
  font-size: 13px;
  color: var(--text-secondary);
}

.rl-title {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rl-time {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

.rl-empty {
  padding: 30px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
