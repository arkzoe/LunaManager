<script setup lang="ts">
import type { ScanResult, GameRecord } from '../../../shared/types'

export interface MetadataForm {
  selectedExe: string
  title: string
  titleCn: string
  developer: string
  publisher: string
  releaseDate: string
  description: string
  notes: string
  customTags: string
  savePath: string
  status: GameRecord['status']
}

const props = defineProps<{
  scanResult: ScanResult
  form: MetadataForm
  coverUrl: string
  searching: boolean
  searchNoResults: boolean
  metadataFilled: boolean
  searchSource: 'vndb' | 'bangumi'
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  (e: 'update:form', val: MetadataForm): void
  (e: 'search'): void
  (e: 'pickSavePath'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const update = <K extends keyof MetadataForm>(key: K, val: MetadataForm[K]): void => {
  emit('update:form', { ...props.form, [key]: val })
}
</script>

<template>
  <div class="import-form">
    <div v-if="error" class="form-error">{{ error }}</div>

    <div class="form-group">
      <label class="form-label">文件夹路径</label>
      <div class="form-path">{{ scanResult.folderPath }}</div>
    </div>

    <div class="form-group">
      <label class="form-label">游戏大小</label>
      <div class="form-value">{{ scanResult.totalSize }}</div>
    </div>

    <div class="form-group">
      <label class="form-label">主程序 <span class="text-danger">*</span></label>
      <div v-if="scanResult.executables.length === 0" class="form-warning">未检测到可执行文件</div>
      <div v-else class="exe-list">
        <label
          v-for="exe in scanResult.executables"
          :key="exe.fullPath"
          class="exe-item"
          :class="{ selected: form.selectedExe === exe.fullPath }"
        >
          <input v-model="form.selectedExe" type="radio" :value="exe.fullPath" class="exe-radio" />
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current exe-icon">
            <path
              d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"
            />
          </svg>
          <span class="exe-name">{{ exe.name }}</span>
        </label>
      </div>
    </div>

    <div v-if="coverUrl" class="form-group">
      <label class="form-label">封面预览</label>
      <div class="cover-preview-wrap">
        <img
          :src="coverUrl"
          class="cover-preview-img"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </div>
    </div>

    <div class="form-group">
      <div class="form-label-row">
        <label class="form-label" for="input-title"
          >游戏名称 <span class="text-danger">*</span></label
        >
        <button class="search-btn" :disabled="searching" title="识别源数据" @click="emit('search')">
          <svg v-if="searching" viewBox="0 0 24 24" class="w-3.5 h-3.5 spin">
            <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
          识别源数据
        </button>
      </div>
      <input
        id="input-title"
        :value="form.title"
        class="form-input"
        placeholder="输入游戏名称"
        @input="update('title', ($event.target as HTMLInputElement).value)"
      />
      <div v-if="metadataFilled" class="metadata-hint">
        已从 {{ searchSource === 'vndb' ? 'VNDB' : 'Bangumi' }} 获取元数据
      </div>
      <div v-if="searchNoResults" class="search-no-results">未找到匹配结果，请尝试调整搜索名称</div>
    </div>

    <div class="form-group">
      <label class="form-label" for="input-title-cn">中文名称</label>
      <input
        id="input-title-cn"
        :value="form.titleCn"
        class="form-input"
        placeholder="输入中文名称（可选）"
        @input="update('titleCn', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="input-developer">开发商</label>
      <input
        id="input-developer"
        :value="form.developer"
        class="form-input"
        placeholder="开发商（可自动获取）"
        @input="update('developer', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="input-publisher">发行商</label>
      <input
        id="input-publisher"
        :value="form.publisher"
        class="form-input"
        placeholder="发行商（可自动获取）"
        @input="update('publisher', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="input-date">发行日期</label>
      <input
        id="input-date"
        :value="form.releaseDate"
        class="form-input"
        placeholder="发行日期（可自动获取）"
        @input="update('releaseDate', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="input-status">游戏状态</label>
      <select
        id="input-status"
        :value="form.status"
        class="form-select"
        @change="
          update('status', ($event.target as HTMLSelectElement).value as GameRecord['status'])
        "
      >
        <option value="want">想玩</option>
        <option value="playing">在玩</option>
        <option value="played">玩过</option>
        <option value="shelved">搁置</option>
        <option value="abandoned">弃坑</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label" for="input-description">游戏描述</label>
      <textarea
        id="input-description"
        :value="form.description"
        class="form-textarea"
        placeholder="游戏描述（可自动获取）"
        rows="3"
        @input="update('description', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="input-notes">备注</label>
      <textarea
        id="input-notes"
        :value="form.notes"
        class="form-textarea"
        placeholder="输入备注信息（可选）"
        rows="2"
        @input="update('notes', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="input-tags">自定义标签</label>
      <input
        id="input-tags"
        :value="form.customTags"
        class="form-input"
        placeholder="标签（JSON 数组，可自动获取）"
        @input="update('customTags', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label">存档路径</label>
      <div class="save-path-row">
        <div class="form-path save-path-text" :class="{ empty: !form.savePath }">
          {{ form.savePath || '未设置' }}
        </div>
        <button class="btn-pick-path" :disabled="isLoading" @click="emit('pickSavePath')">
          选择
        </button>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-cancel" :disabled="isLoading" @click="emit('cancel')">取消</button>
      <button class="btn-brand" :disabled="isLoading" @click="emit('confirm')">
        {{ isLoading ? '导入中...' : '确认导入' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-error {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--danger);
  font-size: 12px;
}

.search-no-results {
  margin-top: 4px;
  font-size: 11px;
  color: var(--warning);
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.form-label-row .form-label {
  margin-bottom: 0;
}

.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.search-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.search-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.metadata-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #22c55e;
}

.form-path {
  padding: 8px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  word-break: break-all;
}
.form-value {
  font-size: 13px;
  color: var(--text-primary);
}

.form-input,
.form-select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.form-input:focus,
.form-select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.form-select {
  cursor: pointer;
}

.form-textarea {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}
.form-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-warning {
  font-size: 12px;
  color: var(--warning);
}

.exe-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.exe-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
}
.exe-item:hover {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.04);
}
.exe-item.selected {
  border-color: var(--accent-primary);
  background: rgba(99, 102, 241, 0.08);
}
.exe-radio {
  accent-color: var(--accent-primary);
}
.exe-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.exe-name {
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-all;
}

.cover-preview-wrap {
  width: 120px;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
.cover-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.save-path-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.save-path-text {
  flex: 1;
  min-width: 0;
}
.save-path-text.empty {
  color: var(--text-tertiary);
  font-style: italic;
}
.btn-pick-path {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.btn-pick-path:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color-light);
}
.text-danger {
  color: var(--danger);
}
</style>
