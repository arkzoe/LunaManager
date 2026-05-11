<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useThemeStore } from '../stores'

const themeStore = useThemeStore()

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
  executablePath?: string
  savePath?: string
}

const props = defineProps<{
  game: Game
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'play', gameId: string): void
  (e: 'install', gameId: string): void
  (e: 'toggleFavorite', gameId: string): void
  (e: 'save', game: Game): void
}>()

const activeTab = ref<'stats' | 'edit' | 'config' | 'backup' | 'progress'>('stats')

// 编辑表单数据
const editForm = ref({
  title: props.game.title,
  cover: props.game.cover,
  developer: props.game.developer || '',
  executablePath: props.game.executablePath || '',
  savePath: props.game.savePath || '',
  description: props.game.description || ''
})

// 启动配置
const configForm = ref({
  executable: props.game.executablePath?.split('\\').pop() || '',
  actualProcess: '',
  localeEmulator: false,
  magpie: false
})

// 备份列表
const backups = ref([
  { id: '1', name: '存档备份 2024-01-15', date: '2024-01-15 14:30', size: '2.5 MB' }
])

const handlePlay = (): void => {
  emit('play', props.game.id)
}

const handleToggleFavorite = (): void => {
  emit('toggleFavorite', props.game.id)
}

const handleSave = (): void => {
  emit('save', { ...props.game, ...editForm.value })
}

// 统计图表数据
const statsChartData = computed(() => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  })

  return {
    labels: dates,
    datasets: [
      {
        label: '游戏时长（分钟）',
        data: [0, 0, 0, 0, 0, 30, 60],
        borderColor: themeStore.isDark ? '#818cf8' : '#6366f1',
        backgroundColor: themeStore.isDark
          ? 'rgba(129, 140, 248, 0.15)'
          : 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: themeStore.isDark ? '#818cf8' : '#6366f1',
        pointBorderColor: themeStore.isDark ? '#1e293b' : '#ffffff',
        pointBorderWidth: 2
      }
    ]
  }
})

const statsChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 12 },
        color: themeStore.isDark ? '#94a3b8' : '#6b7280'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: themeStore.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      },
      ticks: {
        font: { size: 12 },
        color: themeStore.isDark ? '#94a3b8' : '#6b7280',
        callback: function (tickValue: string | number) {
          return `${tickValue}分`
        }
      }
    }
  }
}))
</script>

<template>
  <div class="game-detail-view h-full overflow-y-auto pr-2">
    <!-- 头部信息区 -->
    <div class="detail-header mb-4">
      <button
        class="back-btn flex items-center gap-2 py-2 bg-transparent border-none text-text-tertiary text-sm cursor-pointer transition-colors duration-200 hover:text-text-primary"
        @click="emit('back')"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        <span>返回</span>
      </button>
    </div>

    <!-- 游戏基本信息 -->
    <div class="game-info-section flex gap-6 mb-6">
      <div
        class="game-cover w-50 h-65 bg-bg-secondary rounded-xl flex-shrink-0 flex items-center justify-center"
      >
        <div class="cover-placeholder text-text-muted text-sm">没有封面</div>
      </div>

      <div class="game-meta-info flex-1 min-w-0">
        <h1 class="game-title text-2xl font-bold text-text-primary m-0 mb-4">{{ game.title }}</h1>

        <div class="game-actions flex items-center gap-3 mb-5">
          <button
            v-if="game.installed"
            class="btn-launch flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-brand-600 shadow-brand hover:shadow-brand-lg"
            @click="handlePlay"
          >
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
            启动游戏
          </button>
          <div
            class="status-badge flex items-center gap-1.5 px-3.5 py-2 bg-bg-primary border border-border rounded-full text-13px shadow-none"
            :class="{
              'not-started': !game.lastPlayed,
              'text-success-500': game.lastPlayed,
              'text-text-muted': !game.lastPlayed
            }"
          >
            <svg v-if="game.lastPlayed" viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="w-4 h-4 fill-current">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
              />
            </svg>
            {{ game.lastPlayed ? '进行中' : '未开始' }}
          </div>
          <button
            class="action-icon-btn w-9 h-9 flex items-center justify-center bg-bg-primary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-secondary hover:border-border-medium hover:shadow-sm"
            title="收藏"
            @click="handleToggleFavorite"
          >
            <svg
              viewBox="0 0 24 24"
              class="w-4.5 h-4.5 transition-colors duration-200"
              :class="game.favorite ? 'fill-pink-500' : 'fill-text-muted'"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
          <button
            class="action-icon-btn w-9 h-9 flex items-center justify-center bg-bg-primary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-secondary hover:border-border-medium hover:shadow-sm"
            title="更多"
          >
            <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
              <path
                d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
              />
            </svg>
          </button>
        </div>

        <div class="meta-grid flex flex-wrap gap-6 mb-5">
          <div class="meta-item flex flex-col gap-1">
            <span class="meta-label text-xs text-text-muted">数据来源</span>
            <span class="meta-value text-sm text-text-primary font-medium">local</span>
          </div>
          <div class="meta-item flex flex-col gap-1">
            <span class="meta-label text-xs text-text-muted">开发</span>
            <span class="meta-value text-sm text-text-primary font-medium">{{
              game.developer || '-'
            }}</span>
          </div>
          <div class="meta-item flex flex-col gap-1">
            <span class="meta-label text-xs text-text-muted">添加时间</span>
            <span class="meta-value text-sm text-text-primary font-medium">2026-05-10</span>
          </div>
          <div class="meta-item flex flex-col gap-1">
            <span class="meta-label text-xs text-text-muted">评分</span>
            <span class="meta-value text-sm text-text-primary font-medium">-</span>
          </div>
          <div class="meta-item flex flex-col gap-1">
            <span class="meta-label text-xs text-text-muted">发售日期</span>
            <span class="meta-value text-sm text-text-primary font-medium">{{
              game.releaseDate || '-'
            }}</span>
          </div>
        </div>

        <div class="game-intro mb-4">
          <h4 class="text-sm font-semibold text-text-primary m-0 mb-2">简介</h4>
          <p class="text-sm text-text-secondary leading-relaxed m-0">
            {{ game.description || '暂无简介' }}
          </p>
        </div>

        <div class="game-tags flex gap-2 flex-wrap">
          <button
            class="add-tag-btn flex items-center gap-1 px-3 py-1.5 bg-bg-primary border border-dashed border-border rounded-md text-13px text-text-muted cursor-pointer transition-all duration-200 hover:border-border-medium hover:text-text-secondary"
          >
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            添加标签
          </button>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tabs-nav flex gap-1 border-b border-border mb-6">
      <button
        class="tab-btn px-5 py-3 bg-transparent border-none border-b-2 border-transparent text-sm text-text-secondary cursor-pointer transition-all duration-200 -mb-px hover:text-text-primary"
        :class="{ 'active text-brand-500 border-b-brand-500': activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        游戏统计
      </button>
      <button
        class="tab-btn px-5 py-3 bg-transparent border-none border-b-2 border-transparent text-sm text-text-secondary cursor-pointer transition-all duration-200 -mb-px hover:text-text-primary"
        :class="{ 'active text-brand-500 border-b-brand-500': activeTab === 'edit' }"
        @click="activeTab = 'edit'"
      >
        编辑
      </button>
      <button
        class="tab-btn px-5 py-3 bg-transparent border-none border-b-2 border-transparent text-sm text-text-secondary cursor-pointer transition-all duration-200 -mb-px hover:text-text-primary"
        :class="{ 'active text-brand-500 border-b-brand-500': activeTab === 'config' }"
        @click="activeTab = 'config'"
      >
        启动配置
      </button>
      <button
        class="tab-btn px-5 py-3 bg-transparent border-none border-b-2 border-transparent text-sm text-text-secondary cursor-pointer transition-all duration-200 -mb-px hover:text-text-primary"
        :class="{ 'active text-brand-500 border-b-brand-500': activeTab === 'backup' }"
        @click="activeTab = 'backup'"
      >
        备份
      </button>
      <button
        class="tab-btn px-5 py-3 bg-transparent border-none border-b-2 border-transparent text-sm text-text-secondary cursor-pointer transition-all duration-200 -mb-px hover:text-text-primary"
        :class="{ 'active text-brand-500 border-b-brand-500': activeTab === 'progress' }"
        @click="activeTab = 'progress'"
      >
        游玩进度
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content min-h-100">
      <!-- 游戏统计 -->
      <div v-if="activeTab === 'stats'" class="stats-tab">
        <div class="stats-cards flex gap-4 mb-6">
          <div
            class="stat-card flex-1 min-w-0 h-25 bg-bg-primary border border-border rounded-xl p-4 flex flex-col justify-center gap-2"
          >
            <span class="stat-label text-13px text-text-muted">累计游戏次数</span>
            <span class="stat-value text-2xl font-bold text-text-primary">1</span>
          </div>
          <div
            class="stat-card flex-1 min-w-0 h-25 bg-bg-primary border border-border rounded-xl p-4 flex flex-col justify-center gap-2"
          >
            <span class="stat-label text-13px text-text-muted">今日游戏时长</span>
            <span class="stat-value text-2xl font-bold text-text-primary">1小时</span>
          </div>
          <div
            class="stat-card flex-1 min-w-0 h-25 bg-bg-primary border border-border rounded-xl p-4 flex flex-col justify-center gap-2"
          >
            <span class="stat-label text-13px text-text-muted">累计总时长</span>
            <span class="stat-value text-2xl font-bold text-text-primary">{{
              game.playtime || '120小时'
            }}</span>
          </div>
        </div>
        <div class="chart-card bg-bg-primary border border-border rounded-xl p-5 h-75">
          <h3 class="text-base font-semibold text-text-primary m-0 mb-4">游戏时长趋势</h3>
          <div class="h-[calc(100%-40px)]">
            <Line :data="statsChartData" :options="statsChartOptions" />
          </div>
        </div>
      </div>

      <!-- 编辑 -->
      <div v-if="activeTab === 'edit'" class="edit-tab">
        <div
          class="form-card bg-bg-primary border border-border rounded-xl p-6 w-full max-w-full box-border"
        >
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">游戏名称</label>
            <input
              v-model="editForm.title"
              type="text"
              placeholder="输入游戏名称"
              class="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">封面图片</label>
            <div class="flex gap-2">
              <input
                v-model="editForm.cover"
                type="text"
                placeholder="输入图片 URL 或选择图片"
                class="flex-1 px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 focus:outline-none focus:border-brand-500"
              />
              <button
                class="icon-btn w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-tertiary hover:border-border-medium"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </button>
            </div>
            <span class="block text-xs text-text-muted mt-1.5">支持远端 URL 和本地图片选取</span>
          </div>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">开发商</label>
            <input
              v-model="editForm.developer"
              type="text"
              placeholder="输入开发商"
              class="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">启动路径</label>
            <div class="flex gap-2">
              <input
                v-model="editForm.executablePath"
                type="text"
                placeholder="选择游戏可执行文件"
                class="flex-1 px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 focus:outline-none focus:border-brand-500"
              />
              <button
                class="icon-btn w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-tertiary hover:border-border-medium"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
                  <path
                    d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                  />
                </svg>
              </button>
              <button
                class="icon-btn w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-tertiary hover:border-border-medium"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
                  <path
                    d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">存档路径</label>
            <div class="flex gap-2">
              <input
                v-model="editForm.savePath"
                type="text"
                placeholder="请设置存档路径"
                class="flex-1 px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 focus:outline-none focus:border-brand-500"
              />
              <button
                class="icon-btn w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-tertiary hover:border-border-medium"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
                  <path
                    d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"
                  />
                </svg>
              </button>
              <button
                class="icon-btn w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-tertiary hover:border-border-medium"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
                  <path
                    d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                  />
                </svg>
              </button>
            </div>
            <span class="block text-xs text-text-muted mt-1.5"
              >您可以指定游戏的存档目录或文件，用于云端备份和多端同步</span
            >
          </div>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">简介</label>
            <textarea
              v-model="editForm.description"
              rows="4"
              placeholder="输入游戏简介"
              class="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 resize-y min-h-20 focus:outline-none focus:border-brand-500"
            ></textarea>
          </div>
          <div class="form-actions flex justify-end mt-6">
            <button
              class="btn-save px-6 py-2.5 bg-brand-500 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-brand-600 shadow-brand hover:shadow-brand-lg"
              @click="handleSave"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <!-- 启动配置 -->
      <div v-if="activeTab === 'config'" class="config-tab">
        <div class="config-card bg-bg-primary border border-border rounded-xl p-6 mb-5">
          <h3 class="text-lg font-semibold text-text-primary m-0 mb-5">进程监控</h3>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">可执行程序</label>
            <input
              v-model="configForm.executable"
              type="text"
              readonly
              class="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border"
            />
            <span class="block text-xs text-text-muted mt-1.5"
              >LunaBox 使用此可执行文件启动游戏。这里是您一开始选择的可执行文件路径</span
            >
          </div>
          <div class="form-group mb-5">
            <label class="block text-sm font-medium text-text-primary mb-2">实际游戏进程</label>
            <div class="flex gap-2">
              <input
                v-model="configForm.actualProcess"
                type="text"
                placeholder="输入进程名称"
                class="flex-1 px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary box-border transition-all duration-200 focus:outline-none focus:border-brand-500"
              />
              <button
                class="icon-btn w-10 h-10 flex items-center justify-center bg-bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-bg-tertiary hover:border-border-medium"
              >
                <svg viewBox="0 0 24 24" class="w-4.5 h-4.5 fill-text-muted">
                  <path
                    d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                  />
                </svg>
              </button>
            </div>
            <span class="block text-xs text-text-muted mt-1.5"
              >指定实际游戏的进程名称（包含 .exe 后缀）。如果不指定，LunaBox
              会尝试监控可执行路径。如果之前的选择是启动器，您需要在游戏启动后弹出的选择框中手动指定此进程。在此处预先填写可避免每次启动时手动选择。</span
            >
          </div>
          <div
            class="export-section flex items-center justify-between p-4 bg-bg-secondary rounded-lg mt-5"
          >
            <div class="export-info">
              <h4 class="text-sm font-semibold text-text-primary m-0 mb-1">导出快捷启动方式</h4>
              <p class="text-13px text-text-muted m-0">
                导出一个 `.url` 快捷方式文件。双击后会唤起
                LunaBox，并按当前游戏配置启动和监控该游戏。
              </p>
            </div>
            <button
              class="btn-export flex items-center gap-2 px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-13px text-text-primary cursor-pointer transition-all duration-200 hover:bg-bg-secondary hover:border-border-medium"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
                <path
                  d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                />
              </svg>
              导出快捷启动方式
            </button>
          </div>
        </div>

        <div class="config-card bg-bg-primary border border-border rounded-xl p-6">
          <h3 class="text-lg font-semibold text-text-primary m-0 mb-5">启动增强工具</h3>
          <div
            class="tool-item flex items-start justify-between py-4 border-b border-border last:border-b-0"
          >
            <div class="tool-info">
              <div class="tool-header flex items-center gap-2 mb-2">
                <span class="tool-name text-15px font-semibold text-text-primary"
                  >Locale Emulator</span
                >
                <span class="tool-tag px-2 py-0.5 bg-brand-100 text-brand-600 text-xs rounded"
                  >转区工具</span
                >
              </div>
              <p class="tool-desc text-13px text-text-secondary m-0 mb-2">
                使用日文环境模拟启动游戏，解决乱码和区域限制问题。
              </p>
              <p class="tool-warning flex items-center gap-1.5 text-13px text-danger-500 m-0">
                <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                  />
                </svg>
                请先在设置中配置 LEProc.exe 路径
              </p>
            </div>
            <label class="switch relative inline-block w-11 h-6 flex-shrink-0">
              <input
                v-model="configForm.localeEmulator"
                type="checkbox"
                class="opacity-0 w-0 h-0"
              />
              <span
                class="slider absolute cursor-pointer inset-0 bg-border-medium rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4.5 before:w-4.5 before:left-0.75 before:bottom-0.75 before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-sm"
              ></span>
            </label>
          </div>
          <div
            class="tool-item flex items-start justify-between py-4 border-b border-border last:border-b-0"
          >
            <div class="tool-info">
              <div class="tool-header flex items-center gap-2 mb-2">
                <span class="tool-name text-15px font-semibold text-text-primary">Magpie</span>
                <span class="tool-tag px-2 py-0.5 bg-brand-100 text-brand-600 text-xs rounded"
                  >超分缩放</span
                >
              </div>
              <p class="tool-desc text-13px text-text-secondary m-0">
                游戏启动后自动启动 Magpie 进行全屏超分辨率缩放。
              </p>
            </div>
            <label class="switch relative inline-block w-11 h-6 flex-shrink-0">
              <input v-model="configForm.magpie" type="checkbox" class="opacity-0 w-0 h-0" />
              <span
                class="slider absolute cursor-pointer inset-0 bg-border-medium rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4.5 before:w-4.5 before:left-0.75 before:bottom-0.75 before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-sm"
              ></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 备份 -->
      <div v-if="activeTab === 'backup'" class="backup-tab">
        <div class="backup-card bg-bg-primary border border-border rounded-xl p-5 mb-4">
          <div class="backup-header flex items-center justify-between">
            <div class="backup-title">
              <h3 class="text-base font-semibold text-text-primary m-0 mb-1">存档备份</h3>
              <p class="text-13px text-text-muted m-0">
                请先在编辑页面设置存档路径（文件或文件夹）
              </p>
            </div>
            <div class="backup-actions flex gap-3 items-center">
              <button
                class="btn-text px-4 py-2 bg-transparent border-none text-sm text-text-secondary cursor-pointer transition-colors duration-200 hover:text-text-primary"
              >
                打开备份文件夹
              </button>
              <button
                class="btn-primary px-4 py-2 bg-brand-500 text-white border-none rounded-md text-sm cursor-pointer transition-all duration-200 hover:bg-brand-600 shadow-brand hover:shadow-brand-lg"
              >
                立即备份
              </button>
            </div>
          </div>
        </div>

        <div class="backup-card bg-bg-primary border border-border rounded-xl p-5 mb-4">
          <h3 class="text-base font-semibold text-text-primary m-0 mb-4">本地备份</h3>
          <div class="backup-list">
            <div
              v-if="backups.length === 0"
              class="empty-backup text-center py-10 text-text-muted text-sm"
            >
              暂无本地备份记录
            </div>
            <div
              v-for="backup in backups"
              :key="backup.id"
              class="backup-item flex items-center justify-between py-3 border-b border-border last:border-b-0"
            >
              <div class="backup-info flex flex-col gap-1">
                <span class="backup-name text-sm text-text-primary">{{ backup.name }}</span>
                <span class="backup-meta text-xs text-text-muted"
                  >{{ backup.date }} · {{ backup.size }}</span
                >
              </div>
              <div class="backup-actions flex gap-3">
                <button
                  class="btn-text px-3 py-1.5 bg-transparent border-none text-sm text-text-secondary cursor-pointer transition-colors duration-200 hover:text-text-primary"
                >
                  恢复
                </button>
                <button
                  class="btn-text px-3 py-1.5 bg-transparent border-none text-sm text-danger-500 cursor-pointer transition-colors duration-200 hover:text-danger-600"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="cloud-backup-notice flex items-center gap-3 p-4 bg-bg-primary border border-border rounded-xl"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 fill-text-muted flex-shrink-0">
            <path
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
            />
          </svg>
          <div class="notice-content">
            <h4 class="text-sm font-semibold text-text-primary m-0 mb-1">云备份未启用</h4>
            <p class="text-13px text-text-muted m-0">前往设置页面配置云备份，将存档同步到云端</p>
          </div>
        </div>
      </div>

      <!-- 游玩进度 -->
      <div v-if="activeTab === 'progress'" class="progress-tab">
        <div class="progress-card bg-bg-primary border border-border rounded-xl p-6">
          <h3 class="text-base font-semibold text-text-primary m-0 mb-5">游玩进度</h3>
          <div class="progress-content">
            <div class="progress-item flex items-center gap-4 mb-4">
              <span class="progress-label w-20 text-sm text-text-secondary flex-shrink-0"
                >主线进度</span
              >
              <div class="progress-bar flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  class="progress-fill h-full bg-brand-500 rounded-full transition-all duration-300"
                  style="width: 0%"
                ></div>
              </div>
              <span class="progress-value w-15 text-sm text-text-primary text-right flex-shrink-0"
                >0%</span
              >
            </div>
            <div class="progress-item flex items-center gap-4">
              <span class="progress-label w-20 text-sm text-text-secondary flex-shrink-0"
                >成就完成</span
              >
              <div class="progress-bar flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  class="progress-fill h-full bg-brand-500 rounded-full transition-all duration-300"
                  style="width: 0%"
                ></div>
              </div>
              <span class="progress-value w-15 text-sm text-text-primary text-right flex-shrink-0"
                >0/0</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-detail-view::-webkit-scrollbar {
  width: 6px;
}

.game-detail-view::-webkit-scrollbar-track {
  background: transparent;
}

.game-detail-view::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

/* Switch 开关样式 */
.switch input:checked + .slider {
  background-color: var(--primary-500);
}

.switch input:checked + .slider::before {
  transform: translateX(20px);
}

.switch input:focus-visible + .slider {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
</style>
