<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'
import type { UICollection } from '../../composables/useCollections'
import { getIconSvg } from './icons'
import CollectionGameGrid from './CollectionGameGrid.vue'

defineProps<{
  collection: UICollection | null
  games: GameRecord[]
  collections: UICollection[]
  gameBatchMode: boolean
  gameSelectedIds: string[]
  allGamesSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'selectGame', game: GameRecord): void
  (e: 'toggleGameBatchMode'): void
  (e: 'toggleSelectAllGames'): void
  (e: 'toggleGameSelect', id: string): void
  (e: 'openGameBatchRemoveConfirm'): void
  (e: 'openBatchMoveModal'): void
  (e: 'moveGame', game: GameRecord): void
}>()
</script>

<template>
  <div>
    <div class="mb-6">
      <button class="back-btn" @click="emit('back')">
        <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        <span>返回收藏夹</span>
      </button>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 flex items-center justify-center rounded-lg"
            :style="{ backgroundColor: collection?.iconColor + '20' }"
          >
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" :style="{ fill: collection?.iconColor }">
              <path :d="getIconSvg(collection?.icon || 'folder')" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-text-primary m-0 mb-1">{{ collection?.name }}</h2>
            <span class="text-sm text-text-muted">{{ collection?.gameIds.length }} 个游戏</span>
          </div>
        </div>
        <button
          class="icon-btn"
          :class="{ 'bg-brand-500/10 border-brand-500 text-brand-500': gameBatchMode }"
          title="批量管理"
          @click="emit('toggleGameBatchMode')"
        >
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
            <path d="M4 6h4v2H4zm0 5h4v2H4zm0 5h4v2H4zm6-10h10v2H10zm0 5h10v2H10zm0 5h10v2H10z" />
          </svg>
        </button>
      </div>
    </div>

    <div class="batch-bar-stage" :class="{ 'batch-open': gameBatchMode }">
      <div class="batch-bar">
        <span class="bb-count">已选 {{ gameSelectedIds.length }} 项</span>
        <button class="bb-btn" @click="emit('toggleSelectAllGames')">
          {{ allGamesSelected ? '取消全选' : '全选' }}
        </button>
        <button
          class="bb-btn bb-danger"
          :disabled="gameSelectedIds.length === 0"
          @click="emit('openGameBatchRemoveConfirm')"
        >
          移出收藏夹
        </button>
        <button
          class="bb-btn"
          :disabled="gameSelectedIds.length === 0"
          @click="emit('openBatchMoveModal')"
        >
          移动到...
        </button>
      </div>
    </div>

    <CollectionGameGrid
      :games="games"
      :collections="collections"
      :batch-mode="gameBatchMode"
      :selected-ids="gameSelectedIds"
      @card-click="emit('selectGame', $event)"
      @move-game="emit('moveGame', $event)"
      @toggle-select="emit('toggleGameSelect', $event)"
    />
  </div>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  transition: all 200ms ease;
}
.back-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 200ms ease;
}
.icon-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color-medium);
}

.batch-bar-stage {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease;
  pointer-events: none;
}
.batch-bar-stage.batch-open {
  max-height: 500px;
  opacity: 1;
  pointer-events: auto;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  will-change: transform, opacity;
}

.bb-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 4px;
}
.bb-btn {
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.bb-btn:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.bb-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.bb-danger:hover:not(:disabled) {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
