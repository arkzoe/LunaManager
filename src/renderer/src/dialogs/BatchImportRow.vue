<script setup lang="ts">
import type { ImportRowState } from '../../../shared/types'

defineProps<{
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
</script>

<template>
  <div class="batch-row" :class="{ disabled: !row.selectedExe || row.isDuplicate }">
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
            <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" class="w-3 h-3 fill-current">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
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
  grid-template-columns: 32px 1fr 1fr 70px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: border-color 0.15s;
}

.batch-row.disabled {
  opacity: 0.5;
  border-style: dashed;
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
  transition: border-color 0.15s, box-shadow 0.15s;
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
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
