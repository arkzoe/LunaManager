<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>()
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-card">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-desc">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="emit('cancel')">{{ cancelText || '取消' }}</button>
          <button class="btn-danger" :class="{ 'btn-brand': !danger }" @click="emit('confirm')">
            {{ confirmText || '确认' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  width: 360px;
  max-width: 90vw;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  padding: 20px;
}
.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px;
}
.modal-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn-cancel {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.btn-danger {
  height: 34px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: var(--danger);
  color: white;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-danger:hover {
  opacity: 0.85;
}
.btn-brand {
  background: var(--accent-primary);
}
</style>
