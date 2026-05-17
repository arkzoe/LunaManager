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
