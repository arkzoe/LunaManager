<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { GameRecord, SaveSnapshot } from '../../../../shared/types'
import { formatDate, formatFileSize } from '../../utils/format'
import { useGameStore } from '../../stores/useGameStore'

const props = defineProps<{ game: GameRecord }>()
const store = useGameStore()

const snapshots = ref<SaveSnapshot[]>([])
const backingUp = ref(false)
const restoring = ref<string | null>(null)
const error = ref('')

let _unmounted = false
onUnmounted(() => {
  _unmounted = true
})
async function loadSnapshots(): Promise<void> {
  const data = await window.api.getSnapshots(props.game.id)
  if (!_unmounted) snapshots.value = data
}

async function handleSelectFolder(): Promise<void> {
  const dir = await window.api.pickDirectory()
  if (!dir) return
  await window.api.updateGame(props.game.id, { save_path: dir } as Partial<GameRecord>)
  const g = store.allGames.find((x) => x.id === props.game.id)
  if (g) g.save_path = dir
}

async function handleBackup(): Promise<void> {
  error.value = ''
  backingUp.value = true
  try {
    await window.api.backupSnapshot(props.game.id)
    await loadSnapshots()
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '备份失败'
  } finally {
    backingUp.value = false
  }
}

async function handleRestore(snapshotId: string): Promise<void> {
  if (!confirm('还原将覆盖当前存档，确定继续？')) return
  error.value = ''
  restoring.value = snapshotId
  try {
    await window.api.restoreSnapshotInPlace(snapshotId)
  } catch (e: unknown) {
    error.value = (e instanceof Error ? e.message : String(e)) || '还原失败'
  } finally {
    restoring.value = null
  }
}

async function handleDelete(snapshotId: string): Promise<void> {
  if (!confirm('确定删除此快照？')) return
  await window.api.deleteSnapshot(snapshotId)
  await loadSnapshots()
}

async function handleOpenBackupDir(): Promise<void> {
  const dir = await window.api.getBackupDir(props.game.id)
  await window.api.openPath(dir)
}

async function handleAutoMatchSaveDir(): Promise<void> {
  error.value = ''
  if (!props.game.executable_path) {
    error.value = '未设置可执行文件路径'
    return
  }
  const dir = await window.api.autoMatchSaveDir(props.game.executable_path)
  if (!dir) {
    error.value = '未找到存档目录'
    return
  }
  await window.api.updateGame(props.game.id, { save_path: dir } as Partial<GameRecord>)
  const g = store.allGames.find((x) => x.id === props.game.id)
  if (g) g.save_path = dir
}

async function handleOpenPath(path: string): Promise<void> {
  await window.api.openPath(path)
}

onMounted(() => {
  loadSnapshots()
})
</script>

<template>
  <div class="tab-panel">
    <div class="backup-section">
      <div class="form-field">
        <label>存档路径</label>
        <div class="input-row">
          <input
            type="text"
            :value="game.save_path"
            placeholder="未设置存档路径"
            class="form-input flex-1"
            readonly
          />
          <button class="btn-secondary btn-sm" @click="handleSelectFolder">选择文件夹</button>
        </div>
      </div>

      <div class="action-row">
        <button
          class="btn-primary btn-sm"
          :disabled="!game.save_path || backingUp"
          @click="handleBackup"
        >
          {{ backingUp ? '备份中...' : '立即备份' }}
        </button>
        <button class="btn-secondary btn-sm" @click="handleOpenBackupDir">打开备份文件夹</button>
        <button class="btn-secondary btn-sm" @click="handleAutoMatchSaveDir">自动匹配</button>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <div v-if="snapshots.length" class="snapshot-list">
        <div v-for="snap in snapshots" :key="snap.id" class="snapshot-item">
          <div class="snapshot-info">
            <span class="snapshot-date">{{ formatDate(snap.created_at) }}</span>
            <span v-if="snap.notes" class="snapshot-notes">{{ snap.notes }}</span>
            <span v-if="snap.file_size" class="snapshot-size">{{
              formatFileSize(snap.file_size)
            }}</span>
          </div>
          <div class="snapshot-actions">
            <button
              class="btn-secondary btn-xs"
              :disabled="restoring === snap.id"
              @click="handleRestore(snap.id)"
            >
              {{ restoring === snap.id ? '还原中...' : '还原' }}
            </button>
            <button
              class="btn-secondary btn-xs"
              :disabled="!snap.snapshot_path"
              @click="handleOpenPath(snap.snapshot_path)"
            >
              打开位置
            </button>
            <button class="btn-danger btn-xs" @click="handleDelete(snap.id)">删除</button>
          </div>
        </div>
      </div>

      <div v-else class="snapshot-empty">
        <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-20 mb-3">
          <path
            d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
          />
        </svg>
        <p>暂无备份快照</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backup-section {
  max-width: 100%;
}

.form-field {
  margin-bottom: 16px;
}

.form-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: var(--accent-primary);
}

.input-row {
  display: flex;
  gap: 8px;
}

.flex-1 {
  flex: 1;
}

.action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.error-msg {
  font-size: 12px;
  color: var(--danger, #e74c3c);
  margin-bottom: 12px;
}

.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snapshot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  gap: 12px;
}

.snapshot-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.snapshot-date {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.snapshot-notes {
  font-size: 12px;
  color: var(--text-secondary);
}

.snapshot-size {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 4px;
}

.snapshot-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.snapshot-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  text-align: center;
}

.snapshot-empty p {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.btn-xs {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 6px;
  height: 26px;
}

.btn-danger {
  background: var(--danger, #e74c3c);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-danger:hover {
  opacity: 0.85;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
