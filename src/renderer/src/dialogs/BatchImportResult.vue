<script setup lang="ts">
import type { ImportResult, ImportResultItem } from '../../../shared/types'

defineProps<{
  result: ImportResult
}>()

const emit = defineEmits<{ (e: 'finish'): void }>()

const successItems = (items: ImportResultItem[]) => items.filter((i) => i.status === 'success')
const failedItems = (items: ImportResultItem[]) => items.filter((i) => i.status === 'failed')
const skippedItems = (items: ImportResultItem[]) => items.filter((i) => i.status === 'skipped')
</script>

<template>
  <div class="result-panel">
    <div class="result-summary">
      <div class="result-stat success">
        <span class="result-num">{{ result.successCount }}</span>
        <span class="result-label">成功</span>
      </div>
      <div class="result-stat skipped">
        <span class="result-num">{{ result.skippedCount }}</span>
        <span class="result-label">跳过</span>
      </div>
      <div class="result-stat failed">
        <span class="result-num">{{ result.failedCount }}</span>
        <span class="result-label">失败</span>
      </div>
      <div class="result-stat">
        <span class="result-num">{{ (result.totalDuration / 1000).toFixed(1) }}s</span>
        <span class="result-label">耗时</span>
      </div>
    </div>
    <div v-if="result.successCount > 0" class="result-detail">
      <div class="result-section-title">成功详情 ({{ result.successCount }})</div>
      <div
        v-for="item in successItems(result.items)"
        :key="item.title + item.id"
        class="result-item success"
      >
        <span class="result-item-icon">✓</span>
        <span class="result-item-title">{{ item.title || '(未知)' }}</span>
      </div>
    </div>
    <div v-if="result.failedCount > 0" class="result-detail">
      <div class="result-section-title">失败详情 ({{ result.failedCount }})</div>
      <div
        v-for="item in failedItems(result.items)"
        :key="item.title + item.reason"
        class="result-item failed"
      >
        <span class="result-item-icon">✗</span>
        <span class="result-item-title">{{ item.title || '(未知)' }}</span>
        <span class="result-item-reason">{{ item.reason }}</span>
      </div>
    </div>
    <div v-if="result.skippedCount > 0" class="result-detail">
      <div class="result-section-title">跳过详情 ({{ result.skippedCount }})</div>
      <div
        v-for="item in skippedItems(result.items)"
        :key="item.title + item.reason"
        class="result-item skipped"
      >
        <span class="result-item-icon">⏭</span>
        <span class="result-item-title">{{ item.title }}</span>
        <span class="result-item-reason">{{ item.reason }}</span>
      </div>
    </div>
    <div class="result-actions">
      <button class="btn-brand" @click="emit('finish')">完成</button>
    </div>
  </div>
</template>

<style scoped>
.result-panel {
  padding: 0;
}

.result-summary {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 16px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.result-stat.success .result-num {
  color: #22c55e;
}
.result-stat.skipped .result-num {
  color: #f59e0b;
}
.result-stat.failed .result-num {
  color: var(--danger);
}

.result-num {
  font-size: 22px;
  font-weight: 700;
}

.result-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.result-detail {
  margin-top: 12px;
}

.result-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.result-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 4px;
  align-items: center;
}

.result-item.success {
  background: rgba(34, 197, 94, 0.06);
}

.result-item.failed {
  background: rgba(239, 68, 68, 0.08);
}

.result-item.skipped {
  background: rgba(245, 158, 11, 0.08);
}

.result-item-icon {
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.result-item.success .result-item-icon {
  color: #22c55e;
}

.result-item.failed .result-item-icon {
  color: var(--danger);
}

.result-item.skipped .result-item-icon {
  color: #f59e0b;
}

.result-item-title {
  color: var(--text-primary);
  font-weight: 500;
  flex-shrink: 0;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-item-reason {
  color: var(--text-tertiary);
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
  margin-top: 16px;
}
</style>
