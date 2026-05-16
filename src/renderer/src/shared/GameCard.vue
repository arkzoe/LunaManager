<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { GameRecord } from '../../../shared/types'

const props = defineProps<{ game: GameRecord; selected?: boolean }>()
const emit = defineEmits<{ (e: 'click'): void }>()

const coverImg = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)

const handleImageLoad = (): void => {
  imageLoaded.value = true
}

// 浏览器缓存图片时 @load 在 Vue 绑定监听前同步触发，需通过 complete 属性兜底
const checkCached = (): void => {
  if (coverImg.value?.complete && props.game.cover) {
    imageLoaded.value = true
  }
}

onMounted(checkCached)
watch(
  () => props.game.cover,
  () => {
    imageLoaded.value = false
    requestAnimationFrame(checkCached)
  }
)
</script>

<template>
  <div class="game-card" :class="{ selected }" @click="emit('click')">
    <div class="cover">
      <img
        v-if="game.cover"
        ref="coverImg"
        :src="game.cover"
        :alt="game.title"
        class="cover-img"
        :class="{ loaded: imageLoaded }"
        @load="handleImageLoad"
      />
      <div v-else class="cover-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>
    <div class="info">
      <div class="title">{{ game.title }}</div>
      <div class="meta">{{ game.size || '-' }}</div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  background: var(--bg-primary);
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.game-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  will-change: transform;
}

.game-card:hover .cover-img {
  transform: scale(1.08);
  will-change: transform;
}

.game-card.selected {
  box-shadow: 0 0 0 2px var(--accent-primary);
}

.cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--bg-secondary);
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.cover-img.loaded {
  opacity: 1;
}

.cover-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.cover-placeholder svg {
  width: 28px;
  height: 28px;
  opacity: 0.35;
}

.info {
  padding: 6px 8px;
}

.title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 1px;
}

.meta {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
