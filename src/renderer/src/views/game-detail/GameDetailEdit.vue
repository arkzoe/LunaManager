<script setup lang="ts">
import { computed } from 'vue'
import type { GameRecord } from '../../../../shared/types'

const props = defineProps<{
  game: GameRecord
  tempNotes: string
  tempTitle: string
  tempTitleCn: string
  tempDeveloper: string
  tempPublisher: string
  tempReleaseDate: string
  tempTags: string
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:tempNotes', val: string): void
  (e: 'update:tempTitle', val: string): void
  (e: 'update:tempTitleCn', val: string): void
  (e: 'update:tempDeveloper', val: string): void
  (e: 'update:tempPublisher', val: string): void
  (e: 'update:tempReleaseDate', val: string): void
  (e: 'update:tempTags', val: string): void
  (e: 'save'): void
}>()

const hasChanges = computed(() => {
  return (
    props.tempTitle !== (props.game.title || '') ||
    props.tempTitleCn !== (props.game.title_cn || '') ||
    props.tempDeveloper !== (props.game.developer || '') ||
    props.tempPublisher !== (props.game.publisher || '') ||
    props.tempReleaseDate !== (props.game.release_date || '') ||
    props.tempNotes !== (props.game.notes || '') ||
    props.tempTags !== (props.game.custom_tags || '[]')
  )
})
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
          <label>发行商</label>
          <input
            type="text"
            :value="tempPublisher"
            class="form-input"
            @input="emit('update:tempPublisher', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <div class="form-row">
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
        <label>标签（逗号分隔）</label>
        <input
          type="text"
          :value="tempTags"
          class="form-input"
          placeholder="冒险, 悬疑, 治愈"
          @input="emit('update:tempTags', ($event.target as HTMLInputElement).value)"
        />
      </div>
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
      <button
        class="btn-brand"
        :disabled="!hasChanges || saving"
        @click="emit('save')"
      >
        {{ saving ? '保存中...' : '保存修改' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.edit-form {
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
}

.form-textarea:focus {
  border-color: var(--accent-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-brand:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
