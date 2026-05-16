<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './layout/Sidebar.vue'
import MainContent from './layout/MainContent.vue'
import { useThemeStore } from './stores'

const activeTab = ref('home')
const themeStore = useThemeStore()

const handleTabChange = (tab: string): void => {
  activeTab.value = tab
}

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <div class="app-shell">
    <Sidebar :active-tab="activeTab" @update:active-tab="handleTabChange" />
    <MainContent :active-tab="activeTab" @update:active-tab="handleTabChange" />
  </div>
</template>

<style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
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

.app-shell * {
  transition-property: background-color, border-color, box-shadow;
  transition-duration: 0.25s;
  transition-timing-function: ease;
}

:root {
  --bg-base: #f8f9fa;
  --bg-sidebar: #ffffff;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-hover: rgba(0, 0, 0, 0.03);
  --bg-active: rgba(59, 130, 246, 0.06);

  --text-primary: #374151;
  --text-secondary: #4b5563;
  --text-tertiary: #6b7280;
  --text-muted: #9ca3af;

  --border-color: rgba(0, 0, 0, 0.08);
  --border-color-light: rgba(0, 0, 0, 0.04);
  --border-color-medium: rgba(0, 0, 0, 0.12);
  --bg-overlay: rgba(0, 0, 0, 0.35);

  --accent-primary: #3b82f6;
  --accent-primary-dark: #2563eb;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.04);
}

html.dark {
  --bg-base: #121416;
  --bg-sidebar: #1c1e1f;
  --bg-primary: #1c1e1f;
  --bg-secondary: #303235;
  --bg-hover: rgba(255, 255, 255, 0.05);
  --bg-active: rgba(59, 130, 246, 0.12);

  --text-primary: #f3f4f6;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  --text-muted: #6b7280;

  --border-color: rgba(255, 255, 255, 0.08);
  --border-color-light: rgba(255, 255, 255, 0.04);
  --border-color-medium: rgba(255, 255, 255, 0.12);
  --bg-overlay: rgba(0, 0, 0, 0.6);

  --accent-primary: #60a5fa;
  --accent-primary-dark: #3b82f6;
  --success: #34d399;
  --danger: #f87171;
  --warning: #fbbf24;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.app-shell {
  display: flex;
  height: 100vh;
  width: 100vw;
  min-width: 520px;
  min-height: 400px;
  overflow: hidden;
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
