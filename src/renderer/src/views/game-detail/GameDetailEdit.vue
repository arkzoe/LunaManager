<script setup lang="ts">
import type { GameRecord } from '../../../../shared/types'

defineProps<{
  game: GameRecord
  tempNotes: string
}>()

defineEmits<{
  (e: 'update:tempNotes', val: string): void
}>()
</script>

<template>
  <div class="tab-panel">
    <div class="edit-form">
      <div class="form-field">
        <label>游戏名称</label>
        <input type="text" :value="game.title" class="form-input" />
      </div>
      <div class="form-field">
        <label>中文名称</label>
        <input type="text" :value="game.title_cn" class="form-input" />
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>开发商</label>
          <input type="text" :value="game.developer" class="form-input" />
        </div>
        <div class="form-field">
          <label>发行商</label>
          <input type="text" :value="game.publisher" class="form-input" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>发行日期</label>
          <input type="text" :value="game.release_date" class="form-input" />
        </div>
      </div>
      <div class="form-field">
        <label>个人备注</label>
        <textarea
          :value="tempNotes"
          class="form-textarea"
          rows="4"
          placeholder="添加备注..."
          @input="$emit('update:tempNotes', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
      <button class="btn-brand" disabled>保存修改</button>
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
</style>
