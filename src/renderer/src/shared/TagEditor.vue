<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const tagInput = ref('')

const parsedTags = computed<string[]>(() => {
  try {
    const arr = JSON.parse(props.modelValue || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
})

const addTag = (): void => {
  const val = tagInput.value.trim()
  if (!val) return
  const tags = [...parsedTags.value]
  if (!tags.includes(val)) {
    tags.push(val)
    emit('update:modelValue', JSON.stringify(tags))
  }
  tagInput.value = ''
}

const removeTag = (tag: string): void => {
  const tags = parsedTags.value.filter((t) => t !== tag)
  emit('update:modelValue', JSON.stringify(tags))
}

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  }
}
</script>

<template>
  <div>
    <div class="mb-2 text-xs font-semibold text-text-secondary">标签</div>
    <div class="flex flex-wrap gap-2 mb-2">
      <span
        v-for="tag in parsedTags"
        :key="tag"
        class="tag-chip"
      >
        {{ tag }}
        <button class="tag-remove" @click="removeTag(tag)">&times;</button>
      </span>
      <span v-if="parsedTags.length === 0" class="tag-empty">暂无标签</span>
    </div>
    <input
      v-model="tagInput"
      type="text"
      placeholder="输入标签后按 Enter 添加"
      class="tag-input"
      @keydown="handleKeydown"
    />
  </div>
</template>

<style scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  font-size: 11px;
  color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 20px;
}

.tag-remove {
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.tag-remove:hover {
  color: var(--danger);
}

.tag-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

.tag-input {
  width: 100%;
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

.tag-input:focus {
  border-color: var(--accent-primary);
}
</style>
