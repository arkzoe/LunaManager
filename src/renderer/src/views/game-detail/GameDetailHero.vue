<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameRecord, GameStatus } from '../../../../shared/types'
import { formatDate } from '../../utils/format'

const isCoverWide = ref(false)

const onCoverLoad = (e: Event): void => {
  const img = e.target as HTMLImageElement
  isCoverWide.value = img.naturalWidth >= img.naturalHeight
}

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
    <div class="hero-cover" :class="{ 'hero-cover-wide': isCoverWide }">
      <img
        v-if="game.cover"
        :src="game.cover"
        :alt="game.title"
        class="cover-img"
        @load="onCoverLoad"
      />
      <div v-else class="cover-ph">
        <svg viewBox="0 0 24 24" class="w-16 h-16 fill-text-muted opacity-20">
          <path
            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          />
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
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
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
          @change="
            $emit('update:tempStatus', ($event.target as HTMLSelectElement).value as GameStatus)
          "
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
          <span v-for="tag in parsedTags" :key="tag" class="tag-badge">{{ tag }}</span>
        </template>
        <span v-else class="tag-empty">暂无标签</span>
      </div>

      <div class="hi-summary">
        <div class="hi-summary-label">简介</div>
        <p>{{ game.description || '暂无简介' }}</p>
      </div>

      <div class="launch-area">
        <div class="launch-group">
          <button v-if="!isRunning" class="launch-main" @click.stop="$emit('launch', 'normal')">
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
            开始游戏
          </button>
          <button v-else class="launch-main stop" @click.stop="$emit('stop')">
            <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path d="M6 6h12v12H6z" />
            </svg>
            停止游戏
          </button>
          <button
            v-if="!isRunning"
            class="launch-dropdown"
            title="更多启动方式"
            @click.stop="$emit('toggleLaunchMenu')"
          >
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

<style scoped src="./GameDetailHero.css"></style>
