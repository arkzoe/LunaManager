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
}

:root {
  --bg-base: #f7f7fa;
  --bg-sidebar: #f0f0f4;
  --bg-primary: #ffffff;
  --bg-secondary: #f3f3f8;
  --bg-hover: rgba(0, 0, 0, 0.03);
  --bg-active: rgba(99, 102, 241, 0.06);

  --text-primary: #1c1c2e;
  --text-secondary: #6b6b84;
  --text-tertiary: #9494aa;
  --text-muted: #b5b5c8;

  --border-color: transparent;
  --border-color-light: transparent;
  --border-color-medium: rgba(0, 0, 0, 0.04);
  --bg-overlay: rgba(0, 0, 0, 0.35);

  --accent-primary: #6366f1;
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.04);
}

html.dark {
  --bg-base: #0e0e16;
  --bg-sidebar: #12121c;
  --bg-primary: #181824;
  --bg-secondary: #1e1e2e;
  --bg-hover: rgba(255, 255, 255, 0.05);
  --bg-active: rgba(129, 140, 248, 0.12);

  --text-primary: #e8e8f0;
  --text-secondary: #8888a8;
  --text-tertiary: #5a5a7a;
  --text-muted: #3a3a58;

  --border-color: rgba(255, 255, 255, 0.07);
  --border-color-light: rgba(255, 255, 255, 0.03);
  --border-color-medium: rgba(255, 255, 255, 0.11);
  --bg-overlay: rgba(0, 0, 0, 0.6);

  --accent-primary: #818cf8;
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
  min-width: 1024px;
  min-height: 700px;
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
  background: rgba(99, 102, 241, 0.15);
}
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>
