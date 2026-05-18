<script setup lang="ts">
import type { UICollection } from '../../composables/useCollections'
import { getIconSvg } from './icons'

defineProps<{
  collection: UICollection
  isDefault: boolean
  batchMode?: boolean
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'rename'): void
  (e: 'delete'): void
  (e: 'toggleSelect', id: string): void
}>()
</script>

<template>
  <div
    class="collection-card h-20 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-250 box-border hover:-translate-y-0.5 border"
    :class="{ 'ring-2 ring-accent-500/50': selected }"
    @click="batchMode ? !isDefault && emit('toggleSelect', collection.id) : emit('open')"
  >
    <div class="flex-shrink-0 batch-check-wrap" :class="{ 'cb-hidden': !batchMode }">
      <div
        class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 cursor-pointer cb-box"
        :class="[isDefault ? 'cb-default' : '', selected ? 'cb-selected' : '']"
        @click.stop="!isDefault && emit('toggleSelect', collection.id)"
      >
        <svg v-if="selected" viewBox="0 0 24 24" class="w-3 h-3 fill-white">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>
    </div>
    <div
      class="w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0"
      :style="{ backgroundColor: collection.iconColor + '20' }"
    >
      <svg viewBox="0 0 24 24" class="w-6 h-6" :style="{ fill: collection.iconColor }">
        <path :d="getIconSvg(collection.icon)" />
      </svg>
    </div>
    <div class="flex-1 min-w-0 h-12 flex flex-col justify-center">
      <h3
        class="w-full h-5.5 text-15px font-semibold m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis leading-5.5 card-name"
      >
        {{ collection.name }}
      </h3>
      <p class="w-full h-4.5 text-13px m-0 leading-4.5 card-count">
        {{ collection.gameIds.length }} 个游戏
      </p>
    </div>
    <div
      class="collection-actions flex items-center gap-1"
      :class="{ 'cb-hidden': batchMode }"
      @click.stop
    >
      <button v-if="!isDefault" class="action-menu-btn" title="重命名" @click="emit('rename')">
        <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
          <path
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
          />
        </svg>
      </button>
      <button v-if="!isDefault" class="action-menu-btn delete" title="删除" @click="emit('delete')">
        <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.collection-card {
  background: var(--bg-primary);
  border-color: var(--border-color-medium);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.collection-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--accent-primary);
}

.batch-check-wrap,
.collection-actions {
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

.collection-actions {
  opacity: 0;
  visibility: hidden;
}

.batch-check-wrap.cb-hidden,
.collection-actions.cb-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.collection-card:hover .collection-actions:not(.cb-hidden) {
  opacity: 1;
}

.action-menu-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 200ms ease;
}

.action-menu-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.action-menu-btn.delete:hover {
  background: var(--accent-danger-bg);
  color: var(--accent-danger);
}

.card-name {
  color: var(--text-primary);
}
.card-count {
  color: var(--text-muted);
}

.cb-box {
  border-color: var(--border-color-medium);
}
.cb-box:hover {
  border-color: var(--accent-primary);
}
.cb-default {
  border-color: var(--text-muted);
  opacity: 0.3;
  cursor: not-allowed;
}
.cb-selected {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}
.card-count {
  color: var(--text-muted);
}
</style>
