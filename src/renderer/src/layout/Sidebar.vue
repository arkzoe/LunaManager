<script setup lang="ts">
defineProps<{ activeTab: string }>()
const emit = defineEmits<{ (e: 'update:activeTab', value: string): void }>()

interface NavItem {
  id: string
  label: string
  icon: string
}

const primaryNav: NavItem[] = [
  { id: 'home', label: '首页', icon: 'home' },
  { id: 'library', label: '游戏库', icon: 'grid' },
  { id: 'stats', label: '统计', icon: 'chart' },
  { id: 'favorites', label: '收藏', icon: 'heart' }
]

const bottomNav: NavItem[] = [{ id: 'settings', label: '设置', icon: 'settings' }]

const iconMap: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  grid: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chart:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  heart:
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  settings:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
}
</script>

<template>
  <aside class="sidebar">
    <div class="logo">
      <div class="logo-icon">L</div>
      <span class="logo-text">Luna</span>
    </div>
    <nav class="nav-group">
      <button
        v-for="item in primaryNav"
        :key="item.id"
        class="nav-item"
        :class="{ active: activeTab === item.id }"
        :title="item.label"
        @click="emit('update:activeTab', item.id)"
      >
        <div v-if="activeTab === item.id" class="active-bar" />
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="iconMap[item.icon]" />
        </svg>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>
    <div class="spacer" />
    <nav class="nav-group">
      <button
        v-for="item in bottomNav"
        :key="item.id"
        class="nav-item"
        :class="{ active: activeTab === item.id }"
        :title="item.label"
        @click="emit('update:activeTab', item.id)"
      >
        <div v-if="activeTab === item.id" class="active-bar" />
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path :d="iconMap[item.icon]" />
        </svg>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  min-width: 200px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  padding: 0 8px;
  user-select: none;
  transition:
    width 0.3s ease,
    min-width 0.3s ease,
    padding 0.3s ease;
}

@media (max-width: 899px) {
  .sidebar {
    width: 56px;
    min-width: 56px;
    padding: 0 6px;
  }

  .sidebar .logo-text,
  .sidebar .nav-label {
    display: none;
  }

  .sidebar .logo {
    padding: 16px 0 20px;
    justify-content: center;
  }

  .sidebar .nav-item {
    justify-content: center;
    padding: 8px 0;
  }

  .sidebar .active-bar {
    left: -6px;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 8px 20px;
}

.logo-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: #fff;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  animation: logo-glow 3s ease-in-out infinite;
}

.logo-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item:hover .nav-icon {
  animation: icon-wiggle 0.4s ease;
}

.nav-item.active {
  color: var(--accent-primary);
}

.active-bar {
  position: absolute;
  left: -8px;
  top: 50%;
  width: 3px;
  height: 18px;
  background: var(--accent-primary);
  border-radius: 0 3px 3px 0;
  animation: active-bar-in 0.3s ease forwards;
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spacer {
  flex: 1;
}
</style>
