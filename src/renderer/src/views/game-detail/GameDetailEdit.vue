<script setup lang="ts">
import { computed } from 'vue'
import type { GameRecord } from '../../../../shared/types'
import SelectDropdown from '../../shared/SelectDropdown.vue'
import TagEditor from '../../shared/TagEditor.vue'

const props = defineProps<{
  game: GameRecord
  tempNotes: string
  tempTitle: string
  tempTitleCn: string
  tempDeveloper: string
  tempReleaseDate: string
  tempTags: string
  tempExecutablePath: string
  tempDescription: string
  tempDataSource: string
  tempVndbId: string
  tempBangumiId: string
  saving: boolean
  fetching: boolean
}>()

const emit = defineEmits<{
  (e: 'update:tempNotes', val: string): void
  (e: 'update:tempTitle', val: string): void
  (e: 'update:tempTitleCn', val: string): void
  (e: 'update:tempDeveloper', val: string): void
  (e: 'update:tempReleaseDate', val: string): void
  (e: 'update:tempTags', val: string): void
  (e: 'update:tempExecutablePath', val: string): void
  (e: 'update:tempDescription', val: string): void
  (e: 'update:tempDataSource', val: string): void
  (e: 'update:tempVndbId', val: string): void
  (e: 'update:tempBangumiId', val: string): void
  (e: 'save'): void
  (e: 'fetchMetadata'): void
  (e: 'deleteGame'): void
}>()

const hasChanges = computed(() => {
  return (
    props.tempTitle !== (props.game.title || '') ||
    props.tempTitleCn !== (props.game.title_cn || '') ||
    props.tempDeveloper !== (props.game.developer || '') ||
    props.tempReleaseDate !== (props.game.release_date || '') ||
    props.tempNotes !== (props.game.notes || '') ||
    props.tempTags !== (props.game.custom_tags || '[]') ||
    props.tempExecutablePath !== (props.game.executable_path || '') ||
    props.tempDescription !== (props.game.description || '') ||
    props.tempVndbId !== (props.game.vndb_id || '') ||
    props.tempBangumiId !== (props.game.bangumi_id || '') ||
    (() => {
      const cur = props.game.vndb_id ? 'vndb' : props.game.bangumi_id ? 'bangumi' : ''
      return props.tempDataSource !== cur
    })()
  )
})

const pickExecutable = async (): Promise<void> => {
  const path = await window.api.pickFile([{ name: 'Executable', extensions: ['exe'] }])
  if (path) emit('update:tempExecutablePath', path)
}

const dataSourceCurrent = computed(() => {
  return (
    props.tempDataSource || (props.game.vndb_id ? 'vndb' : props.game.bangumi_id ? 'bangumi' : '')
  )
})

const onSourceChange = (val: string): void => {
  emit('update:tempDataSource', val)
  if (val === 'vndb') {
    emit('update:tempBangumiId', '')
  } else if (val === 'bangumi') {
    emit('update:tempVndbId', '')
  }
}
</script>

<template>
  <div class="tab-panel">
    <div class="edit-form">
      <div class="form-field">
        <label>游戏名称</label>
        <input
          type="text"
          :value="tempTitle"
          class="form-input"
          @input="emit('update:tempTitle', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-field">
        <label>中文名称</label>
        <input
          type="text"
          :value="tempTitleCn"
          class="form-input"
          @input="emit('update:tempTitleCn', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>开发商</label>
          <input
            type="text"
            :value="tempDeveloper"
            class="form-input"
            @input="emit('update:tempDeveloper', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="form-field">
          <label>发行日期</label>
          <input
            type="text"
            :value="tempReleaseDate"
            class="form-input"
            @input="emit('update:tempReleaseDate', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <div class="form-field">
        <label>可执行路径</label>
        <div class="input-row">
          <input
            type="text"
            :value="tempExecutablePath"
            class="form-input flex-1"
            placeholder="选择游戏可执行文件..."
            @input="emit('update:tempExecutablePath', ($event.target as HTMLInputElement).value)"
          />
          <button class="btn-secondary btn-sm" @click="pickExecutable">选择文件</button>
        </div>
      </div>
      <div class="form-field">
        <label>简介</label>
        <textarea
          :value="tempDescription"
          class="form-textarea"
          rows="4"
          placeholder="游戏简介..."
          @input="emit('update:tempDescription', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <TagEditor :model-value="tempTags" @update:model-value="emit('update:tempTags', $event)" />

      <!-- 数据源 -->
      <div class="form-section-label">元数据</div>
      <div class="form-row">
        <div class="form-field">
          <label>数据源</label>
          <SelectDropdown
            :model-value="dataSourceCurrent"
            :options="[
              { value: '', label: '无' },
              { value: 'vndb', label: 'VNDB' },
              { value: 'bangumi', label: 'Bangumi' }
            ]"
            class="form-select"
            @update:model-value="onSourceChange($event as string)"
          />
        </div>
        <div class="form-field">
          <label>{{ dataSourceCurrent === 'bangumi' ? 'Bangumi ID' : 'VNDB ID' }}</label>
          <input
            v-if="dataSourceCurrent !== 'bangumi'"
            type="text"
            :value="tempVndbId"
            class="form-input"
            placeholder="例如 v12345"
            @input="emit('update:tempVndbId', ($event.target as HTMLInputElement).value)"
          />
          <input
            v-else
            type="text"
            :value="tempBangumiId"
            class="form-input"
            placeholder="例如 123456"
            @input="emit('update:tempBangumiId', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <button
        class="btn-secondary btn-sm mb-5"
        :disabled="!dataSourceCurrent || fetching"
        @click="emit('fetchMetadata')"
      >
        {{ fetching ? '获取中...' : '从远端更新信息' }}
      </button>

      <div class="form-field">
        <label>个人备注</label>
        <textarea
          :value="tempNotes"
          class="form-textarea"
          rows="4"
          placeholder="添加备注..."
          @input="emit('update:tempNotes', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <div class="form-actions">
        <button class="btn-primary" :disabled="!hasChanges || saving" @click="emit('save')">
          {{ saving ? '保存中...' : '保存修改' }}
        </button>
        <button class="btn-danger" @click="emit('deleteGame')">删除游戏</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-form {
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
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--accent-primary);
}

.form-select {
  height: 36px;
}

.form-select .sd-trigger {
  height: 36px;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  line-height: 1.5;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: var(--accent-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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

.form-section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-top: 4px;
  border-top: 1px solid var(--border-color-light);
}

/* Tag chips */
/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  height: 38px;
  padding: 0 20px;
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover {
  background: #ef4444;
  color: white;
}
</style>
