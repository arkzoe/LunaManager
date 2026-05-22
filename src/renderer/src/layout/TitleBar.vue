<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isMaximized = ref(false)
let cleanupMaximizeChange: (() => void) | null = null

function minimize(): void {
  window.api.minimizeWindow()
}
function toggleMaximize(): void {
  window.api.toggleMaximizeWindow()
}
function closeWin(): void {
  window.api.closeWindow()
}

onMounted(async () => {
  isMaximized.value = await window.api.isMaximized()
  cleanupMaximizeChange = window.api.onMaximizeChange((maximized) => {
    isMaximized.value = maximized
  })
})

onUnmounted(() => {
  cleanupMaximizeChange?.()
})
</script>

<template>
  <div class="title-bar">
    <div class="title-bar__drag">
      <span class="title-bar__title">Luna Manager</span>
    </div>
    <div class="title-bar__controls">
      <button class="title-bar__btn" title="最小化" @click="minimize()">
        <svg viewBox="0 0 12 12">
          <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button class="title-bar__btn" title="最大化" @click="toggleMaximize()">
        <svg v-if="!isMaximized" viewBox="0 0 12 12">
          <rect
            x="1.5"
            y="1.5"
            width="9"
            height="9"
            rx="1"
            fill="none"
            stroke="currentColor"
            stroke-width="1.25"
          />
        </svg>
        <svg v-else viewBox="0 0 12 12">
          <rect
            x="2.5"
            y="0.5"
            width="8"
            height="8"
            rx="1"
            fill="none"
            stroke="currentColor"
            stroke-width="1.25"
          />
          <rect
            x="0.5"
            y="2.5"
            width="8"
            height="8"
            rx="1"
            fill="var(--bg-sidebar)"
            stroke="currentColor"
            stroke-width="1.25"
          />
        </svg>
      </button>
      <button class="title-bar__btn title-bar__btn--close" title="关闭" @click="closeWin()">
        <svg viewBox="0 0 12 12">
          <path
            d="M1 1l10 10M11 1L1 11"
            stroke="currentColor"
            stroke-width="1.25"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  height: 36px;
  flex-shrink: 0;
  background: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-color);
  user-select: none;
}

.title-bar__drag {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 14px;
  -webkit-app-region: drag;
}

.title-bar__title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  font-family: inherit;
}

.title-bar__controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.title-bar__btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.title-bar__btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.title-bar__btn--close:hover {
  background: #ef4444;
  color: #fff;
}

.title-bar__btn svg {
  width: 12px;
  height: 12px;
}
</style>
