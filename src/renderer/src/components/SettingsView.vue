<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '../stores'

const themeStore = useThemeStore()

// 展开状态
const expandedSections = ref<string[]>(['basic'])

// 基础配置
const autoStart = ref(false)
const autoUpdate = ref(true)
const downloadPath = ref('D:\\Games\\LunaManager')
const language = ref('zh-CN')

// 元数据设置
const metadataSource = ref('steam')
const autoSyncMetadata = ref(true)

// 外观设置
const sidebarCollapsed = ref(false)
const showGameCover = ref(true)

// 游玩配置
const autoBackupBeforePlay = ref(false)
const autoBackupAfterPlay = ref(true)

// 下载配置
const maxDownloadTasks = ref(3)
const downloadSpeedLimit = ref(0)

// 数据库备份
const lastDbBackup = ref('2024-01-15 14:30')

// 全量数据备份
const lastFullBackup = ref('未备份')

// 应用更新
const currentVersion = ref('1.0.0')
const checkUpdateOnStart = ref(true)

// 应用数据
const clearCache = (): void => {
  console.log('清除缓存')
}

const resetSettings = (): void => {
  console.log('重置设置')
}

const toggleSection = (section: string): void => {
  const index = expandedSections.value.indexOf(section)
  if (index > -1) {
    expandedSections.value.splice(index, 1)
  } else {
    expandedSections.value.push(section)
  }
}

const isExpanded = (section: string): boolean => {
  return expandedSections.value.includes(section)
}

const handleChangeDownloadPath = (): void => {
  console.log('更改下载路径')
}

const handleDbBackup = (): void => {
  console.log('备份数据库')
  lastDbBackup.value = new Date().toLocaleString('zh-CN')
}

const handleFullBackup = (): void => {
  console.log('全量数据备份')
  lastFullBackup.value = new Date().toLocaleString('zh-CN')
}

const handleRestoreDb = (): void => {
  console.log('恢复数据库')
}

const handleRestoreFull = (): void => {
  console.log('恢复全量数据')
}

const handleCheckUpdate = (): void => {
  console.log('检查更新')
}
</script>

<template>
  <div class="settings-view h-full min-h-100 overflow-y-auto pr-2">
    <div class="settings-list flex flex-col gap-3 max-w-200">
      <!-- 基础配置 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('basic') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('basic')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-brand-600">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">基础配置</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('basic') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">开机启动</h3>
                <p class="text-13px text-text-tertiary m-0">系统启动时自动运行 LunaManager</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="autoStart" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">自动更新</h3>
                <p class="text-13px text-text-tertiary m-0">自动检查并安装游戏更新</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="autoUpdate" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">下载路径</h3>
                <p class="path-text font-mono text-xs text-text-muted break-all m-0">
                  {{ downloadPath }}
                </p>
              </div>
              <button
                class="btn-secondary px-4 py-2 min-h-9 bg-bg-tertiary border border-border rounded-lg text-13px font-medium text-text-secondary cursor-pointer transition-all duration-200 flex-shrink-0 hover:bg-bg-quaternary hover:border-border-medium"
                @click="handleChangeDownloadPath"
              >
                更改
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 元数据设置 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('metadata') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('metadata')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-success-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-success-600">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">元数据设置</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('metadata') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">元数据来源</h3>
                <p class="text-13px text-text-tertiary m-0">选择游戏元数据获取来源</p>
              </div>
              <select
                v-model="metadataSource"
                class="select-box h-9 px-3 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary cursor-pointer transition-all duration-200 flex-shrink-0 hover:border-border-medium focus:border-brand-500 focus:outline-none"
              >
                <option value="steam">Steam</option>
                <option value="igdb">IGDB</option>
                <option value="rawg">RAWG</option>
              </select>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">自动同步元数据</h3>
                <p class="text-13px text-text-tertiary m-0">添加游戏时自动获取元数据</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="autoSyncMetadata" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 外观设置 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('appearance') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('appearance')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-purple-600">
                <path
                  d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
                />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">外观设置</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('appearance') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">深色模式</h3>
                <p class="text-13px text-text-tertiary m-0">使用深色主题</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="themeStore.isDark"
                  class="opacity-0 w-0 h-0"
                  @change="themeStore.toggleTheme"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">语言</h3>
                <p class="text-13px text-text-tertiary m-0">选择界面语言</p>
              </div>
              <select
                v-model="language"
                class="select-box h-9 px-3 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary cursor-pointer transition-all duration-200 flex-shrink-0 hover:border-border-medium focus:border-brand-500 focus:outline-none"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">默认收起侧边栏</h3>
                <p class="text-13px text-text-tertiary m-0">启动时侧边栏默认收起</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="sidebarCollapsed" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">显示游戏封面</h3>
                <p class="text-13px text-text-tertiary m-0">在游戏列表中显示封面图片</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="showGameCover" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 游玩配置 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('play') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('play')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-pink-600">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">游玩配置</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('play') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">游玩前自动备份</h3>
                <p class="text-13px text-text-tertiary m-0">启动游戏前自动备份存档</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="autoBackupBeforePlay" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">游玩后自动备份</h3>
                <p class="text-13px text-text-tertiary m-0">退出游戏后自动备份存档。</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="autoBackupAfterPlay" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 下载配置 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('download') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('download')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-info-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-info-600">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">下载配置</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('download') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">最大下载任务数</h3>
                <p class="text-13px text-text-tertiary m-0">同时进行的下载任务数量</p>
              </div>
              <select
                v-model="maxDownloadTasks"
                class="select-box h-9 px-3 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary cursor-pointer transition-all duration-200 flex-shrink-0 hover:border-border-medium focus:border-brand-500 focus:outline-none"
              >
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="5">5</option>
              </select>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">下载速度限制</h3>
                <p class="text-13px text-text-tertiary m-0">限制下载速度（MB/s，0为不限速）</p>
              </div>
              <input
                v-model.number="downloadSpeedLimit"
                type="number"
                min="0"
                placeholder="0"
                class="number-input w-24 h-9 px-3 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary text-center transition-all duration-200 hover:border-border-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 数据库备份 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('dbbackup') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('dbbackup')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-warning-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-warning-600">
                <path
                  d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
                />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">数据库备份</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('dbbackup') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">数据库备份</h3>
                <p class="text-13px text-text-tertiary m-0">备份游戏数据库和配置</p>
                <p class="backup-time text-xs text-text-muted m-0 mt-1">
                  上次备份: {{ lastDbBackup }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  class="btn-secondary px-4 py-2 min-h-9 bg-bg-tertiary border border-border rounded-lg text-13px font-medium text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-quaternary hover:border-border-medium"
                  @click="handleRestoreDb"
                >
                  恢复
                </button>
                <button
                  class="btn-brand px-4 py-2 min-h-9 bg-brand-600 border-none rounded-lg text-13px font-medium text-white cursor-pointer transition-all duration-200 hover:bg-brand-700 shadow-brand hover:shadow-brand-lg"
                  @click="handleDbBackup"
                >
                  备份
                </button>
              </div>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">全量数据备份</h3>
                <p class="text-13px text-text-tertiary m-0">备份所有数据包括游戏文件</p>
                <p class="backup-time text-xs text-text-muted m-0 mt-1">
                  上次备份: {{ lastFullBackup }}
                </p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  class="btn-secondary px-4 py-2 min-h-9 bg-bg-tertiary border border-border rounded-lg text-13px font-medium text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-quaternary hover:border-border-medium"
                  @click="handleRestoreFull"
                >
                  恢复
                </button>
                <button
                  class="btn-brand px-4 py-2 min-h-9 bg-brand-600 border-none rounded-lg text-13px font-medium text-white cursor-pointer transition-all duration-200 hover:bg-brand-700 shadow-brand hover:shadow-brand-lg"
                  @click="handleFullBackup"
                >
                  备份
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 应用更新 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('update') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('update')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-brand-600">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">应用更新</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('update') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">当前版本</h3>
                <p class="version-text font-mono text-xs text-text-muted m-0">
                  v{{ currentVersion }}
                </p>
              </div>
            </div>
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">启动时检查更新</h3>
                <p class="text-13px text-text-tertiary m-0">应用启动时自动检查更新</p>
              </div>
              <label class="toggle-switch relative w-12 h-6.5 min-w-12 min-h-6.5 cursor-pointer">
                <input v-model="checkUpdateOnStart" type="checkbox" class="opacity-0 w-0 h-0" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">检查更新</h3>
                <p class="text-13px text-text-tertiary m-0">手动检查应用更新</p>
              </div>
              <button
                class="btn-brand px-4 py-2 min-h-9 bg-brand-600 border-none rounded-lg text-13px font-medium text-white cursor-pointer transition-all duration-200 hover:bg-brand-700 shadow-brand hover:shadow-brand-lg"
                @click="handleCheckUpdate"
              >
                检查更新
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 应用数据 -->
      <div
        class="settings-section bg-bg-primary border border-border rounded-xl overflow-hidden transition-all duration-200"
        :class="{ expanded: isExpanded('data') }"
      >
        <div
          class="section-header flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 select-none hover:bg-bg-secondary"
          @click="toggleSection('data')"
        >
          <div class="section-title flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-danger-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5 fill-danger-600">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"
                />
              </svg>
            </div>
            <span class="text-15px font-semibold text-text-primary">应用数据</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            class="w-5 h-5 fill-text-muted transition-transform duration-300"
            :class="{ 'rotate-180': isExpanded('data') }"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
        <div class="section-content overflow-hidden transition-all duration-300">
          <div class="px-5 pb-5">
            <div
              class="setting-item flex items-center justify-between gap-4 py-3 border-b border-border-light"
            >
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">清除缓存</h3>
                <p class="text-13px text-text-tertiary m-0">清除应用缓存数据</p>
              </div>
              <button
                class="btn-secondary px-4 py-2 min-h-9 bg-bg-tertiary border border-border rounded-lg text-13px font-medium text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-quaternary hover:border-border-medium"
                @click="clearCache"
              >
                清除缓存
              </button>
            </div>
            <div class="setting-item flex items-center justify-between gap-4 py-3">
              <div class="setting-info flex-1 min-w-0">
                <h3 class="text-sm font-medium text-text-primary m-0 mb-1">重置设置</h3>
                <p class="text-13px text-text-tertiary m-0">恢复默认设置</p>
              </div>
              <button
                class="btn-danger px-4 py-2 min-h-9 bg-danger-500 border-none rounded-lg text-13px font-medium text-white cursor-pointer transition-all duration-200 hover:bg-danger-600 shadow-danger hover:shadow-danger-lg"
                @click="resetSettings"
              >
                重置设置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view::-webkit-scrollbar {
  width: 6px;
}

.settings-view::-webkit-scrollbar-track {
  background: transparent;
}

.settings-view::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.settings-view::-webkit-scrollbar-thumb:hover {
  background: var(--border-color-medium);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--primary-500);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color-medium);
  transition: 0.3s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.section-content {
  max-height: 0;
}

.settings-section.expanded .section-content {
  max-height: 1000px;
}

.number-input::-webkit-inner-spin-button,
.number-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input {
  -moz-appearance: textfield;
}

.select-box {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
</style>
