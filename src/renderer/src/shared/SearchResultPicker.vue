<script setup lang="ts">
import { ref } from 'vue'
import type { SearchResult } from '../../../shared/types'

const props = defineProps<{
  show: boolean
  results: SearchResult[]
  loading: boolean
  source: string
}>()

const emit = defineEmits<{
  (e: 'select', result: SearchResult): void
  (e: 'close'): void
}>()

const selectedId = ref<string | null>(null)

const sourceLabel = props.source === 'vndb' ? 'VNDB' : props.source === 'bangumi' ? 'Bangumi' : ''

const sourceBadge = (s: string): string => (s === 'vndb' ? 'VNDB' : 'Bangumi')

const handleSelect = (): void => {
  const found = props.results.find((r) => r.id === selectedId.value)
  if (found) emit('select', found)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="dialog-overlay" @keydown.esc="emit('close')">
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 class="dialog-title">
              {{ sourceLabel ? `选择 ${sourceLabel} 条目` : '选择条目' }}
            </h2>
            <button class="dialog-close" @click="emit('close')">&times;</button>
          </div>

          <div class="dialog-body">
            <div v-if="loading" class="picker-loading">
              <svg viewBox="0 0 24 24" class="w-5 h-5 spin">
                <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
              </svg>
              <span>搜索中...</span>
            </div>

            <div v-else-if="results.length === 0" class="picker-empty">未找到相关结果</div>

            <div v-else class="picker-list">
              <label
                v-for="item in results"
                :key="item.id"
                class="picker-item"
                :class="{ selected: selectedId === item.id }"
              >
                <input v-model="selectedId" type="radio" :value="item.id" class="picker-radio" />
                <span class="source-badge" :class="`source-${item.source}`">{{
                  sourceBadge(item.source)
                }}</span>
                <div class="picker-info">
                  <div class="picker-title">{{ item.title }}</div>
                  <div v-if="item.titleCn && item.titleCn !== item.title" class="picker-subtitle">
                    {{ item.titleCn }}
                  </div>
                  <div class="picker-meta">
                    <span v-if="item.date">{{ item.date }}</span>
                    <span v-if="item.rating > 0" class="picker-rating"
                      >★ {{ item.rating.toFixed(1) }}</span
                    >
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-ghost" @click="emit('close')">取消</button>
            <button class="btn-primary" :disabled="!selectedId || loading" @click="handleSelect">
              确认选择
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  animation: overlay-in 0.2s ease;
}

.modal-leave-active {
  animation: overlay-out 0.15s ease forwards;
}

.dialog-card {
  width: 480px;
  max-width: 90vw;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.modal-enter-active .dialog-card {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .dialog-card {
  animation: modal-out 0.15s ease forwards;
}

.dialog-body {
  padding: 16px 20px;
}

.picker-loading,
.picker-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.1s,
    border-color 0.1s,
    color 0.1s,
    box-shadow 0.1s;
}

.picker-item:hover {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.04);
}

.picker-item.selected {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.08);
}

.picker-radio {
  accent-color: var(--accent-primary);
  flex-shrink: 0;
}

.picker-info {
  min-width: 0;
}

.picker-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.picker-rating {
  color: #f59e0b;
  font-weight: 600;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1.4;
}

.source-badge.source-vndb {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}

.source-badge.source-bangumi {
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
}

.spin {
  animation: spin 0.8s linear infinite;
}
</style>
