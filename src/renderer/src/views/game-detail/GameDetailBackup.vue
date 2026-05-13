<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'

defineProps<{ game: GameRecord }>()
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
          />
          <button class="btn-secondary btn-sm" disabled>选择文件夹</button>
        </div>
      </div>
      <button class="btn-brand btn-sm mb-5" disabled>自动检测存档路径</button>

      <div class="snapshot-list">
        <div class="snapshot-empty">
          <svg viewBox="0 0 24 24" class="w-10 h-10 fill-text-muted opacity-20 mb-3">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
          </svg>
          <p>暂无备份快照</p>
          <button class="btn-brand btn-sm mt-4" disabled>立即备份</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backup-section {
  max-width: 500px;
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

.mb-5 {
  margin-bottom: 20px;
}

.mt-4 {
  margin-top: 16px;
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
</style>
