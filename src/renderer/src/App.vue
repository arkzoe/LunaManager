<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MainContent from './components/MainContent.vue'
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
  <div class="flex h-screen w-screen min-w-1024px min-h-700px overflow-hidden relative">
    <Sidebar :active-tab="activeTab" @update:active-tab="handleTabChange" />
    <MainContent :active-tab="activeTab" @update:active-tab="handleTabChange" />
  </div>
</template>

<style>
/* 全局样式重置 */
* {
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

/* 设置最小宽度 */
html {
  min-width: 1024px;
}

/* ========== CSS 变量定义 ========== */
:root {
  /* 浅色模式变量 */
  --bg-base: #f1f5f9;
  --bg-sidebar: #ffffff;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-quaternary: #e2e8f0;
  --bg-card: #ffffff;
  --bg-hover: #f8fafc;
  --bg-input: #f8fafc;
  --bg-button: #f1f5f9;

  --text-primary: #0f172a;
  --text-secondary: #334155;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;

  --border-color: #e2e8f0;
  --border-color-light: #f1f5f9;
  --border-color-medium: #cbd5e1;
  --border-color-strong: #94a3b8;

  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-100: #e0e7ff;

  --accent-success: #22c55e;
  --accent-danger: #ef4444;
  --accent-warning: #f97316;
  --accent-info: #06b6d4;
  --accent-success-bg: #f0fdf4;
  --accent-danger-bg: #fef2f2;
}

/* 深色模式变量 */
html.dark {
  --bg-base: #0f172a;
  --bg-sidebar: #1e293b;
  --bg-primary: #1e293b;
  --bg-secondary: #334155;
  --bg-tertiary: #475569;
  --bg-quaternary: #64748b;
  --bg-card: #1e293b;
  --bg-hover: #334155;
  --bg-input: #334155;
  --bg-button: #334155;

  --text-primary: #f8fafc;
  --text-secondary: #e2e8f0;
  --text-tertiary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-inverse: #0f172a;

  --border-color: #334155;
  --border-color-light: #1e293b;
  --border-color-medium: #475569;
  --border-color-strong: #64748b;

  --primary-500: #818cf8;
  --primary-600: #6366f1;
  --primary-700: #4f46e5;
  --primary-100: #312e81;

  --accent-success: #4ade80;
  --accent-danger: #f87171;
  --accent-warning: #fb923c;
  --accent-info: #22d3ee;
  --accent-success-bg: #14532d;
  --accent-danger-bg: #7f1d1d;
}

body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition:
    background 250ms ease,
    color 250ms ease;
  min-width: 1024px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color-medium);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-strong);
}

/* 选中文本样式 */
::selection {
  background: rgba(99, 102, 241, 0.2);
  color: var(--text-primary);
}

html.dark ::selection {
  background: #3730a3;
  color: #eef2ff;
}

/* 焦点样式 */
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 250ms ease;
}

.slide-enter-from {
  transform: translateX(-20px);
}

.slide-leave-to {
  transform: translateX(20px);
}
</style>
