<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { GameRecord, GameStatus, LaunchMode } from '../../../shared/types'
import { STATUS_OPTIONS } from '../utils/constants'
import { useGameStore } from '../stores/useGameStore'
import { useToast } from '../composables/useToast'
import { useGameDetailForm } from '../composables/useGameDetailForm'
import ToastNotification from '../shared/ToastNotification.vue'
import ConfirmDialog from '../shared/ConfirmDialog.vue'
import GameDetailHero from './game-detail/GameDetailHero.vue'
import GameDetailStats from './game-detail/GameDetailStats.vue'
import GameDetailEdit from './game-detail/GameDetailEdit.vue'
import GameDetailBackup from './game-detail/GameDetailBackup.vue'

const props = defineProps<{ game: GameRecord }>()
const emit = defineEmits<{ (e: 'back'): void; (e: 'updated', game: GameRecord): void }>()

const store = useGameStore()

const activeTab = ref<'stats' | 'edit' | 'backup'>('stats')
const showLaunchMenu = ref(false)
const isRunning = ref(false)
const selectedLaunchModes = ref<string[]>([])
const {
  tempStatus,
  tempRating,
  tempNotes,
  tempTitle,
  tempTitleCn,
  tempDeveloper,
  tempReleaseDate,
  tempTags,
  tempExecutablePath,
  tempDescription,
  tempDataSource,
  tempVndbId,
  tempBangumiId,
  resetForm
} = useGameDetailForm()

const saving = ref(false)
const fetching = ref(false)
const showDeleteConfirm = ref(false)

watch(
  () => props.game.id,
  () => {
    resetForm(props.game)
    selectedLaunchModes.value = props.game.last_launch_method
      ? props.game.last_launch_method.split(',').filter((m) => m && m !== 'normal')
      : []
  },
  { immediate: true }
)

// Toast
const {
  show: showToast,
  message: toastMessage,
  type: toastType,
  showToast: showToastMsg
} = useToast()

const tabs = [
  { id: 'stats' as const, label: '游玩统计', icon: 'chart' },
  { id: 'edit' as const, label: '编辑', icon: 'edit' },
  { id: 'backup' as const, label: '存档备份', icon: 'backup' }
]

const statuses: { id: GameStatus; label: string }[] = STATUS_OPTIONS.map((o) => ({
  id: o.value as GameStatus,
  label: o.label
}))

interface LaunchModeItem {
  id: LaunchMode | 'le' | 'magpie'
  label: string
  desc: string
  disabled: boolean
}

const launchModes: LaunchModeItem[] = [
  { id: 'normal', label: '直接启动', desc: '使用默认方式启动游戏', disabled: false },
  {
    id: 'le',
    label: 'Locale Emulator',
    desc: '转区启动，解决乱码问题',
    disabled: false
  },
  { id: 'magpie', label: 'Magpie 超分', desc: '使用 Magpie 自动超分放大游戏窗口', disabled: false }
]

const toggleLaunchMenu = (): void => {
  showLaunchMenu.value = !showLaunchMenu.value
}

const selectLaunchMode = (mode: string): void => {
  if (mode === 'normal') {
    selectedLaunchModes.value = []
    return
  }
  const current = [...selectedLaunchModes.value]
  const normalIdx = current.indexOf('normal')
  if (normalIdx >= 0) {
    current.splice(normalIdx, 1)
  }
  const modeIdx = current.indexOf(mode)
  if (modeIdx >= 0) {
    current.splice(modeIdx, 1)
  } else {
    current.push(mode)
  }
  selectedLaunchModes.value = current
}

const handleLaunch = async (): Promise<void> => {
  showLaunchMenu.value = false
  const modes = selectedLaunchModes.value.length > 0 ? [...selectedLaunchModes.value] : ['normal']
  try {
    await window.api.launchGame(props.game.id, modes as LaunchMode[])
    showToastMsg('游戏已启动', 'success')
    const updated = await window.api.getGameById(props.game.id)
    if (updated) emit('updated', updated)
  } catch (err: unknown) {
    showToastMsg((err instanceof Error ? err.message : String(err)) || '启动失败', 'error')
  }
}

const handleStop = async (): Promise<void> => {
  try {
    await window.api.stopGame(props.game.id)
    isRunning.value = false
    showToastMsg('游戏已停止', 'success')
  } catch (err: unknown) {
    showToastMsg((err instanceof Error ? err.message : String(err)) || '停止失败', 'error')
  }
}

let ratingTimer: ReturnType<typeof setTimeout> | null = null

const handleRatingChange = async (val: number): Promise<void> => {
  tempRating.value = val
  if (ratingTimer) clearTimeout(ratingTimer)
  ratingTimer = setTimeout(async () => {
    try {
      await window.api.updateGame(props.game.id, { personal_rating: val })
      const idx = store.games.findIndex((g) => g.id === props.game.id)
      if (idx !== -1) {
        const copy = [...store.games]
        copy[idx] = { ...copy[idx], personal_rating: val }
        store.games = copy
      }
      emit('updated', { ...props.game, personal_rating: val })
    } catch {
      /* ignore */
    }
  }, 500)
}

const handleSave = async (extraUpdates?: Partial<GameRecord>): Promise<void> => {
  saving.value = true
  try {
    const tagsJson = tempTags.value.trim() || '[]'

    const updates: Partial<GameRecord> = {
      title: tempTitle.value,
      title_cn: tempTitleCn.value,
      developer: tempDeveloper.value,
      release_date: tempReleaseDate.value,
      description: tempDescription.value,
      executable_path: tempExecutablePath.value,
      vndb_id: tempVndbId.value,
      bangumi_id: tempBangumiId.value,
      notes: tempNotes.value,
      custom_tags: tagsJson,
      personal_rating: tempRating.value,
      status: tempStatus.value,
      ...extraUpdates
    }

    await window.api.updateGame(props.game.id, updates)

    // Update store and notify parent
    const gIdx = store.games.findIndex((g) => g.id === props.game.id)
    if (gIdx !== -1) {
      const copy = [...store.games]
      copy[gIdx] = { ...copy[gIdx], ...updates }
      store.games = copy
    }
    emit('updated', { ...props.game, ...updates })
    showToastMsg('保存成功', 'success')
  } catch (err: unknown) {
    console.error('保存失败:', err)
    showToastMsg('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

const handleFetchMetadata = async (): Promise<void> => {
  const source = tempDataSource.value as 'vndb' | 'bangumi'
  const sourceId = source === 'vndb' ? tempVndbId.value : tempBangumiId.value
  if (!source || !sourceId) {
    showToastMsg('请先选择数据源并输入对应 ID', 'error')
    return
  }

  const token =
    source === 'bangumi'
      ? await window.api.getConfig('bangumiToken')
      : await window.api.getConfig('vndbApiKey')

  if (source === 'bangumi' && !token) {
    showToastMsg('请先在「设置 → 数据源」中配置 Bangumi Token', 'error')
    return
  }

  fetching.value = true
  try {
    const detail = await window.api.fetchMetadataDetail(
      sourceId,
      source,
      token || undefined,
      undefined
    )
    if (detail.title) tempTitle.value = detail.title
    if (detail.title_cn) tempTitleCn.value = detail.title_cn
    if (detail.developer) tempDeveloper.value = detail.developer
    if (detail.release_date) tempReleaseDate.value = detail.release_date
    if (detail.description) tempDescription.value = detail.description
    if (detail.custom_tags) tempTags.value = detail.custom_tags

    const extraUpdates: Partial<GameRecord> = {}
    if (detail.cover) {
      const coverPath = await window.api.downloadCover(props.game.id, detail.cover)
      if (coverPath) extraUpdates.cover = coverPath
    }
    showToastMsg('远端信息已回填', 'success')
    await handleSave(Object.keys(extraUpdates).length > 0 ? extraUpdates : undefined)
  } catch (err: unknown) {
    showToastMsg((err instanceof Error ? err.message : String(err)) || '获取失败', 'error')
  } finally {
    fetching.value = false
  }
}

const handleDeleteGame = async (): Promise<void> => {
  showDeleteConfirm.value = false
  try {
    await window.api.deleteGame(props.game.id)
    const gIdx = store.games.findIndex((g) => g.id === props.game.id)
    if (gIdx !== -1) {
      const copy = [...store.games]
      copy.splice(gIdx, 1)
      store.games = copy
    }
    emit('back')
  } catch (err: unknown) {
    showToastMsg((err instanceof Error ? err.message : String(err)) || '删除失败', 'error')
  }
}

let unmounted = false
let cleanupGameUpdated: (() => void) | null = null
let cleanupGameStarted: (() => void) | null = null

onUnmounted(() => {
  unmounted = true
  cleanupGameUpdated?.()
  cleanupGameStarted?.()
  if (ratingTimer) clearTimeout(ratingTimer)
})

onMounted(async () => {
  try {
    const running = await window.api.isGameRunning(props.game.id)
    if (unmounted) return
    isRunning.value = running
  } catch {
    /* ignore */
  }

  // 监听后端推送的游戏启动事件，即时更新运行状态
  cleanupGameStarted = window.api.onGameRunningStarted((gameId) => {
    if (unmounted || gameId !== props.game.id) return
    isRunning.value = true
  })

  // 监听游戏数据更新事件（进程退出时后端推送），主动检查 running 状态
  cleanupGameUpdated = window.api.onGameUpdated((updated) => {
    if (unmounted || updated.id !== props.game.id) return
    window.api
      .isGameRunning(props.game.id)
      .then((running) => {
        if (!unmounted) isRunning.value = running
      })
      .catch(() => {})
  })
})

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
      :is-running="isRunning"
      :temp-rating="tempRating"
      :temp-status="tempStatus"
      :show-launch-menu="showLaunchMenu"
      :statuses="statuses"
      :launch-modes="launchModes"
      :selected-modes="selectedLaunchModes"
      @update:temp-rating="handleRatingChange($event)"
      @update:temp-status="tempStatus = $event"
      @toggle-launch-menu="toggleLaunchMenu"
      @launch="handleLaunch"
      @stop="handleStop"
      @select-mode="selectLaunchMode"
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

    <ToastNotification
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
    <!-- hideToast unused by design -->

    <div key="tab-body" class="tab-body">
      <GameDetailStats v-if="activeTab === 'stats'" :game="game" />
      <GameDetailEdit
        v-else-if="activeTab === 'edit'"
        :game="game"
        :temp-notes="tempNotes"
        :temp-title="tempTitle"
        :temp-title-cn="tempTitleCn"
        :temp-developer="tempDeveloper"
        :temp-release-date="tempReleaseDate"
        :temp-tags="tempTags"
        :temp-executable-path="tempExecutablePath"
        :temp-description="tempDescription"
        :temp-data-source="tempDataSource"
        :temp-vndb-id="tempVndbId"
        :temp-bangumi-id="tempBangumiId"
        :saving="saving"
        :fetching="fetching"
        @update:temp-notes="tempNotes = $event"
        @update:temp-title="tempTitle = $event"
        @update:temp-title-cn="tempTitleCn = $event"
        @update:temp-developer="tempDeveloper = $event"
        @update:temp-release-date="tempReleaseDate = $event"
        @update:temp-tags="tempTags = $event"
        @update:temp-executable-path="tempExecutablePath = $event"
        @update:temp-description="tempDescription = $event"
        @update:temp-data-source="tempDataSource = $event"
        @update:temp-vndb-id="tempVndbId = $event"
        @update:temp-bangumi-id="tempBangumiId = $event"
        @save="handleSave"
        @fetch-metadata="handleFetchMetadata"
        @delete-game="showDeleteConfirm = true"
      />
      <GameDetailBackup
        v-else-if="activeTab === 'backup'"
        :game="game"
        @updated="(g) => emit('updated', g)"
      />
    </div>

    <ConfirmDialog
      :show="showDeleteConfirm"
      title="确认删除"
      :message="`确定要删除 ${game.title} 吗？此操作不可恢复。`"
      confirm-text="确认删除"
      danger
      @confirm="handleDeleteGame"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<style scoped>
.detail {
  max-width: 100%;
  padding-top: 16px;
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
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
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
  animation: fade-in-up 0.3s ease;
}
</style>
