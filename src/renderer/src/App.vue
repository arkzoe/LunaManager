<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import TitleBar from './layout/TitleBar.vue'
import Sidebar from './layout/Sidebar.vue'
import MainContent from './layout/MainContent.vue'
import UpdateDialog from './shared/UpdateDialog.vue'
import { useThemeStore } from './stores'

const activeTab = ref('home')
const themeStore = useThemeStore()

const handleTabChange = (tab: string): void => {
  activeTab.value = tab
}

// --- Update dialog state (global, survives page switches) ---
const updateDialog = ref({
  show: false,
  type: 'checking' as
    | 'checking'
    | 'available'
    | 'not-available'
    | 'error'
    | 'downloading'
    | 'downloaded',
  version: '',
  releaseNotes: '',
  errorMessage: '',
  progress: 0
})

const userDismissedUpdate = ref(false)

function handleUpdateClose(): void {
  userDismissedUpdate.value = true
  window.api.cancelDownload()
  updateDialog.value = {
    show: false,
    type: 'checking',
    version: '',
    releaseNotes: '',
    errorMessage: '',
    progress: 0
  }
}

// Provide actions so child views (e.g. SettingsView) can trigger download/install
provide('update:show', (type: string, data?: Record<string, unknown>) => {
  userDismissedUpdate.value = false
  updateDialog.value = {
    show: true,
    type: type as typeof updateDialog.value.type,
    version: (data?.version as string) || '',
    releaseNotes: (data?.releaseNotes as string) || '',
    errorMessage: (data?.errorMessage as string) || '',
    progress: (data?.progress as number) || 0
  }
})
provide('update:close', handleUpdateClose)

function handleDownload(): void {
  updateDialog.value = {
    ...updateDialog.value,
    show: true,
    type: 'downloading',
    progress: 0
  }
  window.api.downloadUpdate().catch((err: unknown) => {
    updateDialog.value = {
      ...updateDialog.value,
      show: true,
      type: 'error',
      errorMessage: (err instanceof Error ? err.message : String(err)) || '下载失败'
    }
  })
}

function handleInstall(): void {
  window.api.quitAndInstall()
}

// --- Persistent update listeners ---
let cleanupUpdateStatus: (() => void) | null = null

onMounted(() => {
  themeStore.initTheme()
  themeStore.startWatchingSystemTheme()

  // Listen for update status events (downloading, downloaded, etc.)
  cleanupUpdateStatus = window.api.onUpdateStatus((status, data) => {
    if (userDismissedUpdate.value) return
    if (status === 'downloading') {
      const progressData = data as { percent: number } | undefined
      updateDialog.value = {
        ...updateDialog.value,
        show: true,
        type: 'downloading',
        progress: progressData?.percent ?? 0
      }
    } else if (status === 'downloaded') {
      updateDialog.value = {
        ...updateDialog.value,
        show: true,
        type: 'downloaded',
        progress: 100
      }
    }
  })
})

onUnmounted(() => {
  themeStore.stopWatchingSystemTheme()
  cleanupUpdateStatus?.()
})
</script>

<template>
  <div class="app-shell">
    <TitleBar />
    <div class="app-body">
      <Sidebar :active-tab="activeTab" @update:active-tab="handleTabChange" />
      <MainContent :active-tab="activeTab" @update:active-tab="handleTabChange" />
    </div>

    <UpdateDialog
      :show="updateDialog.show"
      :type="updateDialog.type"
      :version="updateDialog.version"
      :release-notes="updateDialog.releaseNotes"
      :error-message="updateDialog.errorMessage"
      :progress="updateDialog.progress"
      @close="handleUpdateClose"
      @download="handleDownload"
      @install="handleInstall"
    />
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  line-height: 1.5;
  transition:
    background-color 0.35s ease,
    color 0.35s ease;
}

.app-shell,
.app-shell .sidebar,
.app-shell .main-area,
.app-shell .panel,
.app-shell .ov-card,
.app-shell .sort-btn,
.app-shell .tt-btn {
  transition-property: background-color, border-color, box-shadow;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  min-width: 520px;
  min-height: 400px;
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-color-medium);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

::selection {
  background: rgba(59, 130, 246, 0.15);
}
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>
