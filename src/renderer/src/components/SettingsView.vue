<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useThemeStore } from '../stores'

const themeStore = useThemeStore()

interface SettingSection {
  id: string
  label: string
  icon: string
}

const sections: SettingSection[] = [
  {
    id: 'basic',
    label: '基础',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'
  },
  {
    id: 'appearance',
    label: '外观',
    icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'
  },
  {
    id: 'datasource',
    label: '数据源',
    icon: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z'
  },
  { id: 'launcher', label: '启动器', icon: 'M8 5v14l11-7z' },
  {
    id: 'backup',
    label: '备份',
    icon: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z'
  },
  {
    id: 'about',
    label: '关于',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
  }
]

const activeSection = ref('basic')
const contentRef = ref<HTMLElement | null>(null)
const sectionRefs = ref<Record<string, HTMLElement>>({})

let observer: IntersectionObserver | null = null

const setSectionRef = (id: string) => (el: Element | null) => {
  if (el) sectionRefs.value[id] = el as HTMLElement
}

onMounted(async () => {
  await nextTick()
  if (!contentRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).dataset.section
          if (id) activeSection.value = id
          break
        }
      }
    },
    {
      root: contentRef.value,
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0
    }
  )

  Object.values(sectionRefs.value).forEach((el) => observer!.observe(el))
})

onUnmounted(() => {
  observer?.disconnect()
})

const scrollToSection = (id: string): void => {
  activeSection.value = id
  sectionRefs.value[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---- config state ----
const autoStart = ref(false)
const autoUpdate = ref(true)
const downloadPath = ref('')
const language = ref('zh-CN')

const vndbApiKey = ref('')
const bangumiToken = ref('')

const lePath = ref('')
const magpiePath = ref('')
const magpieScale = ref('2.0')

const autoBackup = ref(false)
const backupDir = ref('')
const backupFrequency = ref<'daily' | 'weekly' | 'monthly'>('weekly')
const backupMaxCopies = ref(5)

const currentVersion = ref('1.0.0')

// ---- handlers ----
const handleSelectLEPath = (): void => {
  console.log('选择 LE 路径')
}
const handleSelectMagpiePath = (): void => {
  console.log('选择 Magpie 路径')
}
const handleChangeDownloadPath = (): void => {
  console.log('更改下载路径')
}
const handleSelectBackupDir = (): void => {
  console.log('选择备份目录')
}
const handleTestBangumi = (): void => {
  console.log('测试 Bangumi 连接')
}
const handleTestVNDB = (): void => {
  console.log('测试 VNDB 连接')
}
const handleCheckUpdate = (): void => {
  console.log('检查更新')
}
</script>

<template>
  <div class="settings-layout">
    <!-- ====== 左侧导航 ====== -->
    <nav class="settings-nav">
      <div class="nav-header">
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-text-secondary">
          <path
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
          />
        </svg>
        <span>设置</span>
      </div>
      <div class="nav-items">
        <button
          v-for="sec in sections"
          :key="sec.id"
          class="nav-item"
          :class="{ active: activeSection === sec.id }"
          @click="scrollToSection(sec.id)"
        >
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current">
            <path :d="sec.icon" />
          </svg>
          <span>{{ sec.label }}</span>
        </button>
      </div>
    </nav>

    <!-- ====== 右侧内容 ====== -->
    <div ref="contentRef" class="settings-content">
      <!-- 基础 -->
      <section :ref="setSectionRef('basic')" data-section="basic" class="setting-group">
        <h3 class="group-title">基础</h3>
        <div class="group-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">开机启动</span>
              <span class="setting-desc">系统启动时自动运行 LunaManager</span>
            </div>
            <label class="toggle">
              <input v-model="autoStart" type="checkbox" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">自动更新</span>
              <span class="setting-desc">自动检查并安装应用更新</span>
            </div>
            <label class="toggle">
              <input v-model="autoUpdate" type="checkbox" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">下载路径</span>
              <span class="setting-desc">{{ downloadPath || '未设置' }}</span>
            </div>
            <button class="sbtn sbtn-secondary" @click="handleChangeDownloadPath">更改</button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">语言</span>
              <span class="setting-desc">选择界面显示语言</span>
            </div>
            <select v-model="language" class="sselect">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 外观 -->
      <section :ref="setSectionRef('appearance')" data-section="appearance" class="setting-group">
        <h3 class="group-title">外观</h3>
        <div class="group-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">深色模式</span>
              <span class="setting-desc">使用深色主题保护眼睛</span>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                :checked="themeStore.isDark"
                @change="themeStore.toggleTheme"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- 数据源 -->
      <section :ref="setSectionRef('datasource')" data-section="datasource" class="setting-group">
        <h3 class="group-title">数据源</h3>
        <div class="group-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">VNDB API Key</span>
              <span class="setting-desc">用于访问 VNDB 数据库的 API 密钥</span>
            </div>
            <div class="setting-actions">
              <input
                v-model="vndbApiKey"
                type="password"
                placeholder="输入 API Key"
                class="sinput token"
              />
              <button class="sbtn sbtn-secondary" @click="handleTestVNDB">测试</button>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Bangumi Token</span>
              <span class="setting-desc">用于访问 Bangumi API 的用户令牌</span>
            </div>
            <div class="setting-actions">
              <input
                v-model="bangumiToken"
                type="password"
                placeholder="输入 Token"
                class="sinput token"
              />
              <button class="sbtn sbtn-secondary" @click="handleTestBangumi">测试</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 启动器 -->
      <section :ref="setSectionRef('launcher')" data-section="launcher" class="setting-group">
        <h3 class="group-title">启动器</h3>
        <div class="group-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Locale Emulator 路径</span>
              <span class="setting-desc">{{
                lePath || 'LEProc.exe 所在路径，用于转区启动游戏'
              }}</span>
            </div>
            <button class="sbtn sbtn-secondary" @click="handleSelectLEPath">选择路径</button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Magpie 路径</span>
              <span class="setting-desc">{{
                magpiePath || 'Magpie.exe 所在路径，用于超分放大游戏窗口'
              }}</span>
            </div>
            <button class="sbtn sbtn-secondary" @click="handleSelectMagpiePath">选择路径</button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">缩放参数</span>
              <span class="setting-desc">Magpie 缩放倍数（1.0 – 4.0）</span>
            </div>
            <input v-model="magpieScale" type="text" class="sinput narrow" />
          </div>
        </div>
      </section>

      <!-- 备份 -->
      <section :ref="setSectionRef('backup')" data-section="backup" class="setting-group">
        <h3 class="group-title">备份</h3>
        <div class="group-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">自动备份</span>
              <span class="setting-desc">定期自动备份数据库与封面</span>
            </div>
            <label class="toggle">
              <input v-model="autoBackup" type="checkbox" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">备份目录</span>
              <span class="setting-desc">{{ backupDir || '自动备份文件存储路径' }}</span>
            </div>
            <button class="sbtn sbtn-secondary" @click="handleSelectBackupDir">选择目录</button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">备份频率</span>
              <span class="setting-desc">自动备份的执行频率</span>
            </div>
            <select v-model="backupFrequency" class="sselect">
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">最大保留份数</span>
              <span class="setting-desc">保留的最大备份份数，超出自动删除旧备份</span>
            </div>
            <select v-model="backupMaxCopies" class="sselect">
              <option v-for="n in [3, 5, 10, 20, 50]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- 关于 -->
      <section :ref="setSectionRef('about')" data-section="about" class="setting-group">
        <h3 class="group-title">关于</h3>
        <div class="group-card">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">当前版本</span>
              <span class="setting-desc">v{{ currentVersion }}</span>
            </div>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">检查更新</span>
              <span class="setting-desc">手动检查是否有新版本可用</span>
            </div>
            <button class="sbtn sbtn-primary" @click="handleCheckUpdate">检查更新</button>
          </div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">LunaManager</span>
              <span class="setting-desc">Built with ❤️</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              class="sbtn sbtn-secondary"
              style="text-decoration: none"
              >GitHub</a
            >
          </div>
        </div>
      </section>

      <!-- 底部留白 -->
      <div class="settings-bottom-spacer"></div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 整体布局 ===== */
.settings-layout {
  display: flex;
  height: 100%;
  gap: 0;
}

/* ===== 左侧导航 ===== */
.settings-nav {
  width: 160px;
  min-width: 160px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  margin-right: 16px;
}

.nav-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--accent-primary);
  font-weight: 600;
}

/* ===== 右侧内容 ===== */
.settings-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 8px;
}

.setting-group {
  margin-bottom: 32px;
}

.group-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.group-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color-light);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.setting-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== 控件 ===== */

/* toggle */
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  min-width: 44px;
  cursor: pointer;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--border-color-medium);
  border-radius: 24px;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle input:checked + .toggle-slider {
  background: var(--accent-primary);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* input */
.sinput {
  height: 32px;
  padding: 0 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 7px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
  flex-shrink: 0;
}

.sinput:focus {
  border-color: var(--accent-primary);
}

.sinput::placeholder {
  color: var(--text-muted);
}

.sinput.narrow {
  width: 80px;
  text-align: center;
}

.sinput.token {
  width: 160px;
  font-family: monospace;
}

/* select */
.sselect {
  height: 32px;
  padding: 0 28px 0 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 7px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: border-color 0.15s;
}

.sselect:focus {
  border-color: var(--accent-primary);
}

/* button */
.sbtn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.sbtn-primary {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}

.sbtn-primary:hover {
  filter: brightness(1.1);
}

.sbtn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.sbtn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--border-color-medium);
}

.settings-bottom-spacer {
  height: 40px;
}
</style>
