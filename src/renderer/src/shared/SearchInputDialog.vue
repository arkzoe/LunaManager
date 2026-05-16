<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SearchResult } from '../../../shared/types'
import SelectDropdown from './SelectDropdown.vue'

const emit = defineEmits<{
  (e: 'select', result: SearchResult): void
  (e: 'close'): void
}>()

const props = defineProps<{
  show: boolean
  initialQuery?: string
  initialSource?: 'vndb' | 'bangumi'
}>()

const query = ref(props.initialQuery || '')
const source = ref<'vndb' | 'bangumi'>(props.initialSource || 'vndb')
const searching = ref(false)
const results = ref<SearchResult[]>([])
const searched = ref(false)
const selectedId = ref<string | null>(null)
const error = ref('')

watch(
  () => props.show,
  (val) => {
    if (val) {
      query.value = props.initialQuery || ''
      source.value = props.initialSource || 'vndb'
      searching.value = false
      results.value = []
      searched.value = false
      selectedId.value = null
      error.value = ''
    }
  }
)

const handleSearch = async (): Promise<void> => {
  const q = query.value.trim()
  if (!q) return

  searching.value = true
  searched.value = true
  error.value = ''
  results.value = []
  selectedId.value = null

  try {
    const token =
      source.value === 'bangumi'
        ? await window.api.getConfig('bangumiToken')
        : await window.api.getConfig('vndbApiKey')

    if (source.value === 'bangumi' && !token) {
      error.value = '请先在「设置 → 数据源」中配置 Bangumi Token'
      return
    }

    results.value = await window.api.searchMetadata(q, source.value, token || undefined)
  } catch (err: unknown) {
    error.value = (err instanceof Error ? err.message : String(err)) || '搜索失败'
  } finally {
    searching.value = false
  }
}

const handleSelect = (): void => {
  const found = results.value.find((r) => r.id === selectedId.value)
  if (found) emit('select', found)
}

const handleOverlayClick = (e: MouseEvent): void => {
  if ((e.target as HTMLElement).classList.contains('dialog-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="dialog-overlay"
        @click="handleOverlayClick"
        @keydown.esc="emit('close')"
      >
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 class="dialog-title">手动搜索元数据</h2>
            <button class="dialog-close" @click="emit('close')">&times;</button>
          </div>

          <div class="dialog-body">
            <div v-if="error" class="search-error">{{ error }}</div>

            <div class="search-form">
              <div class="sf-row">
                <label class="sf-label">数据源</label>
                <SelectDropdown
                  v-model="source"
                  :options="[
                    { value: 'vndb', label: 'VNDB' },
                    { value: 'bangumi', label: 'Bangumi' }
                  ]"
                  :disabled="searching"
                  class="sf-select"
                />
              </div>
              <div class="sf-row">
                <label class="sf-label">关键词</label>
                <input
                  v-model="query"
                  class="sf-input"
                  placeholder="输入游戏名称搜索..."
                  :disabled="searching"
                  @keydown.enter="handleSearch"
                />
              </div>
              <button
                class="btn-primary sf-btn"
                :disabled="searching || !query.trim()"
                @click="handleSearch"
              >
                <svg v-if="searching" viewBox="0 0 24 24" class="w-3.5 h-3.5 spin">
                  <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
                  <path
                    d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                  />
                </svg>
                {{ searching ? '搜索中...' : '搜索' }}
              </button>
            </div>

            <div
              v-if="searched && !searching && results.length === 0 && !error"
              class="picker-empty"
            >
              未找到相关结果
            </div>

            <div v-else-if="results.length > 0" class="picker-list">
              <label
                v-for="item in results"
                :key="item.id"
                class="picker-item"
                :class="{ selected: selectedId === item.id }"
              >
                <input v-model="selectedId" type="radio" :value="item.id" class="picker-radio" />
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
            <button class="btn-primary" :disabled="!selectedId || searching" @click="handleSelect">
              确认选择
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1002;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-enter-active {
  animation: overlay-in 0.2s ease;
}

.modal-leave-active {
  animation: overlay-out 0.15s ease forwards;
}

.dialog-card {
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.modal-enter-active .dialog-card {
  animation: modal-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .dialog-card {
  animation: modal-out 0.15s ease forwards;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.dialog-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.1s;
}

.dialog-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dialog-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.search-error {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--danger);
  font-size: 12px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.sf-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sf-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  width: 56px;
  flex-shrink: 0;
}

.sf-input {
  flex: 1;
  height: 34px;
  padding: 0 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.sf-select {
  flex: 1;
  height: 34px;
  font-size: 13px;
}

.sf-select .sd-trigger {
  height: 34px;
}

.sf-input:focus {
  border-color: var(--accent-primary);
}

.sf-select:disabled,
.sf-input:disabled {
  opacity: 0.6;
}

.sf-btn {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.picker-empty {
  text-align: center;
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
  transition: all 0.1s;
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

.spin {
  animation: spin 0.8s linear infinite;
}
</style>
