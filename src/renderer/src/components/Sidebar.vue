<script setup lang="ts">
import { ref } from 'vue'

interface NavItem {
  id: string
  label: string
  icon: string
}

defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', value: string): void
}>()

const isCollapsed = ref(false)

const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const navItems = ref<NavItem[]>([
  {
    id: 'home',
    label: '首页',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    id: 'library',
    label: '游戏库',
    icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    id: 'stats',
    label: '统计',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  },
  {
    id: 'favorites',
    label: '收藏',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16'
  }
])

const bottomItems = ref<NavItem[]>([
  {
    id: 'cloud',
    label: '云同步',
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
  },
  {
    id: 'download',
    label: '下载',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
  },
  {
    id: 'settings',
    label: '设置',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  }
])

const handleNavClick = (id: string): void => {
  emit('update:activeTab', id)
}
</script>

<template>
  <aside
    class="h-screen bg-bg-sidebar border-r border-border flex flex-col relative z-100 flex-shrink-0 transition-all duration-300"
    :class="[isCollapsed ? 'w-16 min-w-16' : 'w-60 min-w-60']"
  >
    <!-- Logo区域 -->
    <div
      class="px-4 py-5 flex items-center border-b border-border-light flex-shrink-0"
      :class="[isCollapsed ? 'justify-center' : 'justify-between']"
    >
      <div v-if="!isCollapsed" class="flex items-center gap-2.5 select-none">
        <svg viewBox="0 0 24 24" class="w-7 h-7 flex-shrink-0 fill-brand-600">
          <path
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
        <span class="text-xl font-bold text-text-primary tracking-tight">LunaManager</span>
      </div>
      <button
        class="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md cursor-pointer text-text-tertiary transition-all duration-150 hover:bg-bg-secondary hover:text-text-primary"
        @click="toggleSidebar"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 stroke-current stroke-2 fill-none">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- 主导航 -->
    <nav class="flex-1 overflow-y-auto p-3" :class="[isCollapsed ? 'px-2' : '']">
      <ul class="list-none p-0 m-0">
        <li v-for="item in navItems" :key="item.id" class="mb-0.5">
          <button
            class="w-full h-10 flex items-center gap-3 px-3 border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-fast"
            :class="[
              activeTab === item.id
                ? 'bg-brand-100 text-brand-700'
                : 'bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
              isCollapsed ? 'justify-center px-0' : ''
            ]"
            @click="handleNavClick(item.id)"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-5 h-5 flex-shrink-0 stroke-current stroke-2 fill-none"
            >
              <path :d="item.icon" />
            </svg>
            <span v-if="!isCollapsed" class="whitespace-nowrap overflow-hidden text-ellipsis">{{
              item.label
            }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- 底部工具栏 -->
    <div
      class="p-3 border-t border-border-light flex items-center flex-shrink-0 bg-bg-secondary"
      :class="[isCollapsed ? 'flex-col px-2 gap-2' : 'justify-start gap-2']"
    >
      <button
        v-for="item in bottomItems"
        :key="item.id"
        class="w-9 h-9 flex items-center justify-center border-none rounded-lg cursor-pointer transition-all duration-fast"
        :class="[
          activeTab === item.id
            ? 'bg-brand-100 text-brand-700'
            : 'bg-transparent text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary'
        ]"
        @click="handleNavClick(item.id)"
      >
        <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 stroke-current stroke-2 fill-none">
          <path :d="item.icon" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 4px;
}

button svg {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
