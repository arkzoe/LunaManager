<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  message: string
  type: 'success' | 'error'
}>()

const emit = defineEmits<{ (e: 'close'): void }>()
const closing = ref(false)

const onAnimationEnd = (): void => {
  if (closing.value) emit('close')
}

onMounted(() => {
  setTimeout(() => {
    closing.value = true
  }, 1500)
})
</script>

<template>
  <Teleport to="body">
    <div class="toast" :class="[type, { closing }]" @animationend="onAnimationEnd">
      <svg v-if="type === 'success'" viewBox="0 0 24 24" class="toast-icon">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" class="toast-icon">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        />
      </svg>
      <div class="toast-body">
        <span>{{ message }}</span>
        <div class="toast-bar" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  animation: toast-in 0.25s ease-out;
  overflow: hidden;
}

.toast.closing {
  animation: toast-out 0.25s ease-in forwards;
}

.toast.success {
  background: #10b981;
  color: white;
}

.toast.error {
  background: #ef4444;
  color: white;
}

.toast-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex-shrink: 0;
}

.toast-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 100px;
}

.toast-bar {
  height: 2px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 1px;
  animation: toast-shrink 1.5s linear forwards;
}
</style>
