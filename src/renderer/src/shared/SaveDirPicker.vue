<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  show: boolean
  dirs: string[]
}>()

const emit = defineEmits<{
  (e: 'select', dir: string): void
  (e: 'close'): void
}>()

const basename = (p: string) => p.split('\\').pop()!.split('/').pop()!

const selectedDir = ref<string | null>(null)

const handleSelect = (): void => {
  if (selectedDir.value) emit('select', selectedDir.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="dialog-overlay" @keydown.esc="emit('close')">
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 class="dialog-title">选择存档目录</h2>
            <button class="dialog-close" @click="emit('close')">&times;</button>
          </div>

          <div class="dialog-body">
            <p class="dialog-hint">发现多个可能的存档目录，请选择一个：</p>
            <div class="dir-list">
              <label
                v-for="dir in dirs"
                :key="dir"
                class="dir-item"
                :class="{ selected: selectedDir === dir }"
              >
                <input v-model="selectedDir" type="radio" :value="dir" class="dir-radio" />
                <span class="dir-name">{{ basename(dir) }}</span>
                <span class="dir-path">{{ dir }}</span>
              </label>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-ghost" @click="emit('close')">取消</button>
            <button class="btn-primary" :disabled="!selectedDir" @click="handleSelect">
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
  z-index: 1000;
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
  width: 440px;
  max-width: 90vw;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  overflow: hidden;
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.dialog-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 0 4px;
  line-height: 1;
}

.dialog-close:hover {
  color: var(--text-primary);
}

.dialog-body {
  padding: 16px 20px;
}

.dialog-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px;
}

.dir-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dir-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.1s,
    border-color 0.1s;
}

.dir-item:hover {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.04);
}

.dir-item.selected {
  border-color: var(--accent-primary);
  background: rgba(59, 130, 246, 0.08);
}

.dir-radio {
  accent-color: var(--accent-primary);
  flex-shrink: 0;
}

.dir-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.dir-path {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
}

.btn-ghost {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.btn-ghost:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-primary {
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent-primary);
  color: white;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlay-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modal-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
