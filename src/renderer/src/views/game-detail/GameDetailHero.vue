<script setup lang="ts">
import { computed } from 'vue'
import type { GameRecord, GameStatus } from '../../../../shared/types'
import { formatDate } from '../../utils/format'

const props = defineProps<{
  game: GameRecord
  isRunning: boolean
  tempRating: number
  tempStatus: GameStatus
  showLaunchMenu: boolean
  statuses: { id: GameStatus; label: string }[]
  launchModes: { id: string; label: string; desc: string }[]
}>()

defineEmits<{
  (e: 'update:tempRating', val: number): void
  (e: 'update:tempStatus', val: GameStatus): void
  (e: 'toggleLaunchMenu'): void
  (e: 'launch', mode: string): void
  (e: 'stop'): void
}>()

const dataSourceLabel = computed(() => {
  if (props.game.vndb_id) return 'VNDB'
  if (props.game.bangumi_id) return 'Bangumi'
  return '未刮擦'
})

const parsedTags = computed<string[]>(() => {
  try {
    const arr = JSON.parse(props.game.custom_tags || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
})

const hasMetadata = computed(() => {
  return props.game.vndb_id || props.game.bangumi_id
})
</script>

<template>
  <div class="hero">
    <div class="hero-cover">
      <img v-if="game.cover" :src="game.cover" :alt="game.title" class="cover-img" />
      <div v-else class="cover-ph">
        <svg viewBox="0 0 24 24" class="w-16 h-16 fill-text-muted opacity-20">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </div>
    </div>

    <div class="hero-info">
      <div class="hi-title-row">
        <h1 class="hi-title">{{ game.title }}</h1>
        <div class="star-rating">
          <button
            v-for="i in 5"
            :key="i"
            class="star"
            :class="{ filled: i <= Math.round(tempRating / 2) }"
            @click.stop="$emit('update:tempRating', i * 2)"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
          <span class="star-score">{{ tempRating }}/10</span>
        </div>
      </div>

      <div class="hi-status">
        <span class="hi-label">状态</span>
        <select
          :value="tempStatus"
          class="status-select"
          @change="$emit('update:tempStatus', ($event.target as HTMLSelectElement).value as GameStatus)"
        >
          <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
      </div>

      <div class="hi-meta">
        <div v-if="game.developer" class="meta-item">
          <span class="meta-k">开发商</span>
          <span class="meta-v">{{ game.developer }}</span>
        </div>
        <div v-if="game.release_date" class="meta-item">
          <span class="meta-k">发行日期</span>
          <span class="meta-v">{{ game.release_date }}</span>
        </div>
        <div v-if="game.size" class="meta-item">
          <span class="meta-k">大小</span>
          <span class="meta-v">{{ game.size }}</span>
        </div>
        <div v-if="game.playtime" class="meta-item">
          <span class="meta-k">时长</span>
          <span class="meta-v">{{ game.playtime }}</span>
        </div>
        <div v-if="hasMetadata" class="meta-item">
          <span class="meta-k">数据源</span>
          <span class="meta-v">{{ dataSourceLabel }}</span>
        </div>
        <div v-if="game.created_at" class="meta-item">
          <span class="meta-k">添加日期</span>
          <span class="meta-v">{{ formatDate(game.created_at) }}</span>
        </div>
      </div>

      <div class="hi-tags">
        <template v-if="parsedTags.length > 0">
          <span class="tag-badge" v-for="tag in parsedTags" :key="tag">{{ tag }}</span>
        </template>
        <span v-else class="tag-empty">暂无标签</span>
      </div>

      <div class="hi-summary">
        <div class="hi-summary-label">简介</div>
        <p>{{ game.description || '暂无简介' }}</p>
      </div>

      <div class="launch-area">
        <div class="launch-group">
          <button
            v-if="!isRunning"
            class="launch-main"
            @click.stop="$emit('launch', 'normal')"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
            开始游戏
          </button>
          <button
            v-else
            class="launch-main stop"
            @click.stop="$emit('stop')"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M6 6h12v12H6z" />
            </svg>
            停止游戏
          </button>
          <button v-if="!isRunning" class="launch-dropdown" title="更多启动方式" @click.stop="$emit('toggleLaunchMenu')">
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        <div v-if="showLaunchMenu" class="launch-menu" @click.stop>
          <button
            v-for="mode in launchModes"
            :key="mode.id"
            class="lm-item"
            @click="$emit('launch', mode.id)"
          >
            <div class="lm-label">{{ mode.label }}</div>
            <div class="lm-desc">{{ mode.desc }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  gap: 24px;
  margin-bottom: 28px;
}

.hero-cover {
  flex-shrink: 0;
  width: 200px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hi-title-row {
  margin-bottom: 14px;
}

.hi-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
  line-height: 1.3;
}

.star-rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.star {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--border-color-medium);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.star.filled {
  color: #f59e0b;
}

.star:hover {
  color: #fbbf24;
}

.star-score {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-left: 6px;
}

.hi-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.hi-label {
  font-size: 12px;
  color: var(--text-tertiary);
  width: 50px;
  flex-shrink: 0;
}

.status-select {
  height: 30px;
  padding: 0 30px 0 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  outline: none;
}

.hi-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.meta-k {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.meta-v {
  color: var(--text-secondary);
}

.hi-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 11px;
  color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 20px;
}

.tag-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

.hi-summary {
  margin-bottom: 16px;
}

.hi-summary-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.hi-summary p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  max-height: 80px;
  overflow-y: auto;
}

.launch-area {
  position: relative;
  margin-top: auto;
}

.launch-group {
  display: flex;
}

.launch-main {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 20px;
  background: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}

.launch-main:only-child {
  border-radius: 8px;
}

.launch-main.stop {
  background: #ef4444;
  border-radius: 8px;
}

.launch-main:hover {
  opacity: 0.9;
}

.launch-dropdown {
  width: 32px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  opacity: 0.85;
  color: white;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: opacity 0.15s;
}

.launch-dropdown:hover {
  opacity: 1;
}

.launch-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 100;
}

.lm-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}

.lm-item:hover {
  background: var(--bg-hover);
}

.lm-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.lm-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}
</style>
