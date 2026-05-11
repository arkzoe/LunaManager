<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LibraryView from './LibraryView.vue'
import FavoritesView from './FavoritesView.vue'
import StatsView from './StatsView.vue'
import SettingsView from './SettingsView.vue'
import GameDetailView from './GameDetailView.vue'
import HomeView from './HomeView.vue'

interface Game {
  id: string
  title: string
  cover: string
  category: string
  rating: number
  size: string
  installed: boolean
  favorite: boolean
  lastPlayed?: string
  description?: string
  developer?: string
  publisher?: string
  releaseDate?: string
  playtime?: string
}

const props = defineProps<{
  activeTab: string
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: string): void
}>()

const selectedGame = ref<Game | null>(null)

const handleNavigateLibrary = (): void => {
  emit('update:activeTab', 'library')
}

// 监听 activeTab 变化，清除选中的游戏
watch(
  () => props.activeTab,
  () => {
    selectedGame.value = null
  }
)

const tabTitles: Record<string, string> = {
  home: '首页',
  library: '游戏库',
  favorites: '收藏',
  stats: '统计',
  settings: '设置'
}

const currentTitle = computed(() => {
  if (selectedGame.value) {
    return selectedGame.value.title
  }
  return tabTitles[props.activeTab] || '游戏库'
})

const currentSubtitle = computed(() => {
  if (props.activeTab === 'home') {
    return '欢迎回来！'
  }
  return ''
})

// 模拟游戏数据
const mockGames = ref<Game[]>([
  {
    id: '1',
    title: '赛博朋克 2077',
    cover: '',
    category: 'rpg',
    rating: 4.5,
    size: '70 GB',
    installed: true,
    favorite: true,
    lastPlayed: '2天前',
    description:
      '《赛博朋克 2077》是一款开放世界动作冒险RPG游戏。故事发生在夜之城，这是一座五光十色的大都会，权力更迭和身体改造是这里不变的主题。',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    releaseDate: '2020年12月10日',
    playtime: '120小时'
  },
  {
    id: '2',
    title: '艾尔登法环',
    cover: '',
    category: 'action',
    rating: 4.8,
    size: '50 GB',
    installed: true,
    favorite: true,
    lastPlayed: '1周前',
    description:
      '《艾尔登法环》是一款动作角色扮演游戏，由FromSoftware开发，万代南梦宫娱乐发行。游戏由宫崎英高和乔治·R·R·马丁共同创作。',
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    releaseDate: '2022年2月25日',
    playtime: '85小时'
  },
  {
    id: '3',
    title: '巫师3：狂猎',
    cover: '',
    category: 'rpg',
    rating: 4.9,
    size: '35 GB',
    installed: true,
    favorite: false,
    lastPlayed: '1个月前',
    description:
      '《巫师3：狂猎》是一款动作角色扮演游戏，由CD Projekt Red开发。玩家扮演猎魔人杰洛特，在开放世界中寻找预言之子。',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    releaseDate: '2015年5月19日',
    playtime: '200小时'
  },
  {
    id: '4',
    title: '荒野大镖客：救赎2',
    cover: '',
    category: 'action',
    rating: 4.7,
    size: '150 GB',
    installed: true,
    favorite: false,
    lastPlayed: '3天前',
    description:
      '《荒野大镖客：救赎2》是一款动作冒险游戏，由Rockstar Games开发。游戏背景设定在1899年的美国西部，讲述范德林德帮派的故事。',
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    releaseDate: '2018年10月26日',
    playtime: '95小时'
  },
  {
    id: '5',
    title: '博德之门3',
    cover: '',
    category: 'rpg',
    rating: 4.9,
    size: '122 GB',
    installed: false,
    favorite: true,
    description:
      '《博德之门3》是一款角色扮演游戏，由Larian Studios开发。游戏基于龙与地下城第五版规则，玩家可以在被遗忘的国度展开冒险。',
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    releaseDate: '2023年8月3日',
    playtime: '未知'
  },
  {
    id: '6',
    title: '只狼：影逝二度',
    cover: '',
    category: 'action',
    rating: 4.7,
    size: '25 GB',
    installed: false,
    favorite: true,
    description:
      '《只狼：影逝二度》是由FromSoftware开发的动作冒险游戏。在战国时代的日本，扮演一名独臂忍者，拯救被绑架的皇子。',
    developer: 'FromSoftware',
    publisher: 'Activision',
    releaseDate: '2019年3月22日',
    playtime: '未知'
  }
])

const handleSelectGame = (game: Game): void => {
  selectedGame.value = game
}

const handleBack = (): void => {
  selectedGame.value = null
}

const handleToggleFavorite = (gameId: string): void => {
  const game = mockGames.value.find((g) => g.id === gameId)
  if (game) {
    game.favorite = !game.favorite
  }
}

const handlePlayGame = (gameId: string): void => {
  console.log('开始游戏:', gameId)
}

const handleInstallGame = (gameId: string): void => {
  console.log('安装游戏:', gameId)
}
</script>

<template>
  <main class="flex-1 flex flex-col bg-bg-base overflow-hidden min-w-150">
    <!-- 头部区域 -->
    <header class="flex items-center justify-between px-8 py-6 flex-shrink-0 min-h-20">
      <div class="flex items-center gap-4 min-w-0 flex-1">
        <div class="flex flex-col gap-1 min-w-0">
          <h1 class="text-2xl font-bold text-text-primary m-0 leading-tight tracking-tight">
            {{ currentTitle }}
          </h1>
          <p v-if="currentSubtitle" class="text-sm text-text-tertiary m-0">
            {{ currentSubtitle }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-4 flex-shrink-0">
        <!-- 今日游玩时间卡片 -->
        <div
          v-if="activeTab === 'home'"
          class="flex items-center gap-3 px-4 py-3 bg-bg-primary border border-border rounded-xl"
        >
          <div class="w-10 h-10 flex items-center justify-center bg-brand-100 rounded-lg">
            <svg viewBox="0 0 24 24" class="w-5 h-5 stroke-brand-600 stroke-2 fill-none">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-text-tertiary">今日游玩时间</span>
            <span class="text-base font-semibold text-text-primary">0分钟</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden px-8 pb-6 min-h-125">
      <!-- 游戏详情页面 -->
      <GameDetailView
        v-if="selectedGame"
        :game="selectedGame"
        @back="handleBack"
        @play="handlePlayGame"
        @install="handleInstallGame"
        @toggle-favorite="handleToggleFavorite"
      />

      <!-- 首页 -->
      <HomeView
        v-else-if="activeTab === 'home'"
        :games="mockGames"
        @select-game="handleSelectGame"
        @navigate-library="handleNavigateLibrary"
      />

      <!-- 游戏库 -->
      <LibraryView
        v-else-if="activeTab === 'library'"
        :games="mockGames"
        @select-game="handleSelectGame"
      />

      <!-- 收藏 -->
      <FavoritesView
        v-else-if="activeTab === 'favorites'"
        :games="mockGames"
        @select-game="handleSelectGame"
        @toggle-favorite="handleToggleFavorite"
      />

      <!-- 统计页面 -->
      <StatsView v-else-if="activeTab === 'stats'" :games="mockGames" />

      <!-- 设置页面 -->
      <SettingsView v-else-if="activeTab === 'settings'" />
    </div>
  </main>
</template>

<style scoped>
svg {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
