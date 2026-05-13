<script setup lang="ts">
import { ref } from 'vue'
import type { GameRecord, GameStatus } from '../../../shared/types'
import GameDetailHero from './game-detail/GameDetailHero.vue'
import GameDetailStats from './game-detail/GameDetailStats.vue'
import GameDetailEdit from './game-detail/GameDetailEdit.vue'
import GameDetailBackup from './game-detail/GameDetailBackup.vue'

const props = defineProps<{ game: GameRecord }>()
const emit = defineEmits<{ (e: 'back'): void }>()

const activeTab = ref<'stats' | 'edit' | 'backup'>('stats')
const showLaunchMenu = ref(false)
const showFullSummary = ref(false)
const tempStatus = ref<GameStatus>((props.game.status as GameStatus) || 'want')
const tempRating = ref(props.game.personal_rating || 0)
const tempNotes = ref(props.game.notes || '')

const tabs = [
  { id: 'stats' as const, label: '游玩统计', icon: 'chart' },
  { id: 'edit' as const, label: '编辑', icon: 'edit' },
  { id: 'backup' as const, label: '存档备份', icon: 'backup' }
]

const statuses: { id: GameStatus; label: string }[] = [
  { id: 'want', label: '想玩' },
  { id: 'playing', label: '在玩' },
  { id: 'played', label: '已玩' },
  { id: 'shelved', label: '搁置' },
  { id: 'abandoned', label: '抛弃' }
]

const launchModes = [
  { id: 'normal' as const, label: '直接启动', desc: '使用默认方式启动游戏' },
  { id: 'le' as const, label: 'Locale Emulator', desc: '转区启动，解决乱码问题' },
  { id: 'magpie' as const, label: 'Magpie 超分', desc: '放大窗口并优化画质' }
]

const toggleLaunchMenu = (): void => {
  showLaunchMenu.value = !showLaunchMenu.value
}

const handleLaunch = (mode: 'normal' | 'le' | 'magpie'): void => {
  showLaunchMenu.value = false
  // TODO: Phase 3 — call IPC launcher
  console.log('Launch with mode:', mode, 'game:', props.game.id)
}

const handleClickOutside = (): void => {
  showLaunchMenu.value = false
}

const iconPaths: Record<string, string> = {
  chart:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  backup:
    'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z'
}
</script>

<template>
  <div class="detail" @click="handleClickOutside">
    <GameDetailHero
      :game="game"
      :show-full-summary="showFullSummary"
      :temp-rating="tempRating"
      :temp-status="tempStatus"
      :show-launch-menu="showLaunchMenu"
      :statuses="statuses"
      :launch-modes="launchModes"
      @update:temp-rating="tempRating = $event"
      @update:temp-status="tempStatus = $event"
      @update:show-full-summary="showFullSummary = $event"
      @toggle-launch-menu="toggleLaunchMenu"
      @launch="handleLaunch"
    />

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
          <path :d="iconPaths[tab.icon]" />
        </svg>
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-body">
      <GameDetailStats v-if="activeTab === 'stats'" :game="game" />
      <GameDetailEdit
        v-else-if="activeTab === 'edit'"
        :game="game"
        :temp-notes="tempNotes"
        @update:temp-notes="tempNotes = $event"
      />
      <GameDetailBackup v-else-if="activeTab === 'backup'" :game="game" />
    </div>
  </div>
</template>

<style scoped>
.detail {
  max-width: 800px;
}

.tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}

.tab:hover {
  color: var(--text-primary);
}

.tab.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.tab-body {
  min-height: 200px;
}
</style>
