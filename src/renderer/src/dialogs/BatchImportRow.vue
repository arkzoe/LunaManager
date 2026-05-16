<script setup lang="ts">
import type { ImportRowState } from '../../../shared/types'

const props = defineProps<{
  row: ImportRowState
  searching: boolean
  importing: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selected', val: boolean): void
  (e: 'update:title', val: string): void
  (e: 'update:selectedExe', val: string): void
  (e: 'search'): void
}>()

const matchStatusIcon = (status?: string): string => {
  if (status === 'matched') return '✓'
  if (status === 'noresult') return '✗'
  return ''
}

const matchStatusClass = (status?: string): string => {
  if (status === 'matched') return 'ms-matched'
  if (status === 'noresult') return 'ms-noresult'
  return ''
}
</script>

<template>
  <div
    class="batch-row"
    :class="{
      disabled: !row.selectedExe || row.isDuplicate,
      'row-importing': row.importStatus === 'importing',
      'row-success': row.importStatus === 'success',
      'row-failed': row.importStatus === 'failed',
      'row-skipped': row.importStatus === 'skipped'
    }"
  >
    <div class="br-status">
      <span v-if="row.importStatus === 'importing'" class="br-status-spin" title="导入中">
        <svg viewBox="0 0 24 24" class="w-3 h-3 spin">
          <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
        </svg>
      </span>
      <span
        v-else-if="row.importStatus === 'success'"
        class="br-status-icon br-status-ok"
        title="导入成功"
        >✓</span
      >
      <span
        v-else-if="row.importStatus === 'failed'"
        class="br-status-icon br-status-fail"
        :title="row.importMessage || '导入失败'"
        >✗</span
      >
      <span
        v-else-if="row.importStatus === 'skipped'"
        class="br-status-icon br-status-skip"
        :title="row.importMessage || '已跳过'"
        >⏭</span
      >
      <span v-else-if="row.matchStatus === 'searching'" class="br-status-spin" title="匹配中">
        <svg viewBox="0 0 24 24" class="w-3 h-3 spin">
          <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
        </svg>
      </span>
      <span
        v-else-if="row.matchStatus"
        class="br-status-icon"
        :class="matchStatusClass(row.matchStatus)"
        :title="row.matchStatus === 'matched' ? '已匹配' : '无匹配结果'"
        >{{ matchStatusIcon(row.matchStatus) }}</span
      >
    </div>

    <div class="br-check">
      <input
        :checked="row.selected"
        type="checkbox"
        :disabled="!row.selectedExe || row.isDuplicate || importing"
        class="br-cb"
        @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
      />
    </div>

    <div class="br-title">
      <div class="br-title-row">
        <input
          :value="row.title"
          class="br-input"
          :placeholder="row.folderName"
          :disabled="importing"
          @input="emit('update:title', ($event.target as HTMLInputElement).value)"
        />
        <button
          class="br-search-btn"
          :disabled="searching || importing"
          title="识别源数据"
          @click="emit('search')"
        >
          <svg v-if="searching" viewBox="0 0 24 24" class="w-3 h-3 spin">
            <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="w-3 h-3 fill-current">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="br-exe">
      <select
        :value="row.selectedExe"
        class="br-select"
        :disabled="row.executables.length === 0 || importing"
        @change="emit('update:selectedExe', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="exe in row.executables" :key="exe.fullPath" :value="exe.fullPath">
          {{ exe.name }}
        </option>
      </select>
      <span v-if="row.executables.length === 0" class="br-warning">未检测到可执行文件</span>
      <span v-if="row.isDuplicate" class="br-duplicate">已存在</span>
    </div>

    <div class="br-size">{{ row.totalSize }}</div>
  </div>
</template>

<style scoped>
.batch-row {
  display: grid;
  grid-template-columns: 24px 32px 1fr 1fr 70px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.batch-row.disabled {
  opacity: 0.5;
  border-style: dashed;
}

.batch-row.row-importing {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.05);
}

.batch-row.row-success {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.04);
}

.batch-row.row-failed {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.04);
}

.batch-row.row-skipped {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.04);
}

.br-status {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  height: 24px;
}

.br-status-spin {
  display: flex;
  align-items: center;
  justify-content: center;
}

.br-status-icon {
  font-weight: 700;
  line-height: 1;
}

.br-status-ok {
  color: #22c55e;
}

.br-status-fail {
  color: var(--danger);
}

.br-status-skip {
  color: #f59e0b;
}

.ms-matched {
  color: #22c55e;
}

.ms-noresult {
  color: var(--danger);
}

.br-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.br-cb {
  accent-color: var(--accent-primary);
}

.br-title-row {
  display: flex;
  gap: 4px;
  align-items: center;
}

.br-input {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.br-input:focus {
  border-color: var(--accent-primary);
}

.br-search-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.br-search-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.br-search-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.br-select {
  width: 100%;
  height: 30px;
  padding: 0 24px 0 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.br-select:hover {
  border-color: var(--border-color-medium);
}

.br-select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
}

.br-select:disabled {
  opacity: 0.5;
  cursor: default;
}

.br-warning {
  font-size: 11px;
  color: var(--danger);
}

.br-duplicate {
  font-size: 11px;
  color: var(--warning);
  font-weight: 600;
}

.br-size {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: right;
  white-space: nowrap;
}

.spin {
  animation: spin 0.8s linear infinite;
}
</style>
