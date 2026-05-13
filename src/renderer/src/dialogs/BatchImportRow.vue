<script setup lang="ts">
interface RowState {
  folderPath: string
  folderName: string
  executables: { name: string; fullPath: string }[]
  totalSize: string
  selected: boolean
  title: string
  selectedExe: string
  isDuplicate: boolean
}

defineProps<{
  row: RowState
}>()

const emit = defineEmits<{
  (e: 'update:selected', val: boolean): void
  (e: 'update:title', val: string): void
  (e: 'update:selectedExe', val: string): void
}>()
</script>

<template>
  <div class="batch-row" :class="{ disabled: !row.selectedExe || row.isDuplicate }">
    <div class="br-check">
      <input
        :checked="row.selected"
        type="checkbox"
        :disabled="!row.selectedExe || row.isDuplicate"
        class="br-cb"
        @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
      />
    </div>

    <div class="br-title">
      <input
        :value="row.title"
        class="br-input"
        :placeholder="row.folderName"
        @input="emit('update:title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="br-exe">
      <select
        :value="row.selectedExe"
        class="br-select"
        :disabled="row.executables.length === 0"
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
</style>
