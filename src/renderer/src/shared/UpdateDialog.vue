<script setup lang="ts">
defineProps<{
  show: boolean
  type: 'checking' | 'available' | 'not-available' | 'error' | 'downloading' | 'downloaded'
  version?: string
  releaseNotes?: string
  errorMessage?: string
  progress?: number
}>()
const emit = defineEmits<{
  close: []
  download: []
  install: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="dialog-overlay" @keydown.esc="emit('close')">
        <div class="dialog-card">
          <div class="dialog-header">
            <h2 class="dialog-title">检查更新</h2>
            <button class="dialog-close" @click="emit('close')">&times;</button>
          </div>

          <div class="dialog-body">
            <div v-if="type === 'checking'" class="state-wrapper">
              <svg viewBox="0 0 24 24" class="state-icon spin">
                <path d="M12 4V2A10 10 0 002 12h2a8 8 0 018-8z" fill="currentColor" />
              </svg>
              <p class="state-text">正在检查更新...</p>
            </div>

            <div v-else-if="type === 'available'" class="state-wrapper">
              <svg viewBox="0 0 24 24" class="state-icon state-available">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="currentColor"
                />
              </svg>
              <p class="state-text">
                发现新版本
                <strong>v{{ version }}</strong>
              </p>
              <div v-if="releaseNotes" class="release-notes">
                <p class="rn-label">更新说明：</p>
                <div class="rn-content">{{ releaseNotes }}</div>
              </div>
            </div>

            <div v-else-if="type === 'not-available'" class="state-wrapper">
              <svg viewBox="0 0 24 24" class="state-icon state-uptodate">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="currentColor"
                />
              </svg>
              <p class="state-text">已是最新版本</p>
            </div>

            <div v-else-if="type === 'downloading'" class="state-wrapper">
              <svg viewBox="0 0 24 24" class="state-icon state-available">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
              </svg>
              <p class="state-text">正在下载更新...</p>
              <div class="progress-bar-wrapper">
                <div class="progress-bar" :style="{ width: (progress || 0) + '%' }"></div>
                <span class="progress-text">{{ Math.round(progress || 0) }}%</span>
              </div>
            </div>

            <div v-else-if="type === 'downloaded'" class="state-wrapper">
              <svg viewBox="0 0 24 24" class="state-icon state-uptodate">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="currentColor"
                />
              </svg>
              <p class="state-text">下载完成，是否立即安装？</p>
            </div>

            <div v-else-if="type === 'error'" class="state-wrapper">
              <svg viewBox="0 0 24 24" class="state-icon state-error">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  fill="currentColor"
                />
              </svg>
              <p class="state-text state-error-text">
                {{ errorMessage || '检查更新失败，请稍后重试' }}
              </p>
            </div>
          </div>

          <div class="dialog-footer">
            <template v-if="type === 'checking'">
              <button class="btn-ghost" @click="emit('close')">取消</button>
            </template>

            <template v-else-if="type === 'available'">
              <button class="btn-ghost" @click="emit('close')">稍后再说</button>
              <button class="btn-primary" @click="emit('download')">下载更新</button>
            </template>

            <template v-else-if="type === 'downloading'">
              <button class="btn-ghost" @click="emit('close')">后台下载</button>
            </template>

            <template v-else-if="type === 'downloaded'">
              <button class="btn-ghost" @click="emit('close')">稍后安装</button>
              <button class="btn-primary" @click="emit('install')">立即安装</button>
            </template>

            <template v-else>
              <button class="btn-primary" @click="emit('close')">确定</button>
            </template>
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
  width: 400px;
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
  padding: 24px 20px;
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

.state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.state-icon {
  width: 40px;
  height: 40px;
  color: var(--text-tertiary);
}

.state-available {
  color: var(--accent-primary);
}

.state-uptodate {
  color: #22c55e;
}

.state-error {
  color: var(--danger);
}

.state-text {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.5;
}

.state-text strong {
  color: var(--accent-primary);
}

.state-error-text {
  color: var(--danger);
}

.release-notes {
  width: 100%;
  margin-top: 4px;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: 8px;
  text-align: left;
}

.rn-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 6px;
}

.rn-content {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
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
  transition: all 0.15s;
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
  transition: all 0.15s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.spin {
  animation: spin 0.8s linear infinite;
}

.progress-bar-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.progress-bar {
  width: 0%;
  height: 6px;
  background: var(--accent-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
