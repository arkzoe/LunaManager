<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useSettings } from '../composables/useSettings'
import SettingBasic from './settings/SettingBasic.vue'
import SettingAppearance from './settings/SettingAppearance.vue'
import SettingDatasource from './settings/SettingDatasource.vue'
import SettingLauncher from './settings/SettingLauncher.vue'
import SettingBackup from './settings/SettingBackup.vue'
import SettingAbout from './settings/SettingAbout.vue'

const {
  autoStart,
  autoUpdate,
  language,
  vndbApiKey,
  bangumiToken,
  lePath,
  magpiePath,
  magpieScale,
  backupDir,
  trackPlaytime,
  recordHistory,
  autoSyncMetadata,
  metadataSource,
  loadConfig,
  setupPersistence,
  handleSelectLEPath,
  handleSelectMagpiePath,
  handleSelectBackupDir
} = useSettings()

const currentVersion = ref('1.0.0')

interface TestResult {
  source: 'vndb' | 'bangumi'
  loading: boolean
  ok?: boolean
  message?: string
}

const testResult = ref<TestResult | null>(null)

const handleTestBangumi = async (): Promise<void> => {
  if (!bangumiToken.value) {
    await window.api.openExternal('https://next.bgm.tv/demo/access-token/create')
    return
  }
  testResult.value = { source: 'bangumi', loading: true }
  try {
    const res = await window.api.testApiConnection('bangumi', bangumiToken.value || undefined)
    testResult.value = { source: 'bangumi', loading: false, ...res }
  } catch (err: unknown) {
    testResult.value = {
      source: 'bangumi',
      loading: false,
      ok: false,
      message: (err instanceof Error ? err.message : String(err)) || '测试失败'
    }
  }
}

const handleTestVNDB = async (): Promise<void> => {
  if (!vndbApiKey.value) {
    await window.api.openExternal('https://vndb.org/u/tokens')
    return
  }
  testResult.value = { source: 'vndb', loading: true }
  try {
    const res = await window.api.testApiConnection('vndb', vndbApiKey.value || undefined)
    testResult.value = { source: 'vndb', loading: false, ...res }
  } catch (err: unknown) {
    testResult.value = {
      source: 'vndb',
      loading: false,
      ok: false,
      message: (err instanceof Error ? err.message : String(err)) || '测试失败'
    }
  }
}

const handleOpenGithub = (): void => {
  window.api.openExternal('https://github.com/arkzoe/lunamanager')
}

const handleCheckUpdate = async (): Promise<void> => {
  try {
    const result = await window.api.checkForUpdates()
    if (result?.updateAvailable) {
      window.alert(`发现新版本 ${result.version}，请在下载页面获取`)
    } else {
      window.alert('已是最新版本')
    }
  } catch {
    window.alert('检查更新失败')
  }
}

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
let isScrolling = false
let scrollTimer: ReturnType<typeof setTimeout> | null = null

const setSectionRef = (id: string) => (el: unknown) => {
  if (el instanceof HTMLElement) sectionRefs.value[id] = el
}

onMounted(async () => {
  await loadConfig()
  setupPersistence()

  await nextTick()
  if (!contentRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (isScrolling) return
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
  isScrolling = true
  activeSection.value = id
  sectionRefs.value[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    isScrolling = false
  }, 400)
}
</script>

<template>
  <div class="settings-layout">
    <nav class="settings-nav">
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

    <div ref="contentRef" class="settings-content">
      <SettingBasic
        :section-ref="setSectionRef('basic')"
        :auto-start="autoStart"
        :auto-update="autoUpdate"
        :track-playtime="trackPlaytime"
        :record-history="recordHistory"
        :language="language"
        @update:auto-start="autoStart = $event"
        @update:auto-update="autoUpdate = $event"
        @update:track-playtime="trackPlaytime = $event"
        @update:record-history="recordHistory = $event"
        @update:language="language = $event as 'zh-CN' | 'en-US'"
      />

      <SettingAppearance :section-ref="setSectionRef('appearance')" />

      <SettingDatasource
        :section-ref="setSectionRef('datasource')"
        :metadata-source="metadataSource"
        :auto-sync-metadata="autoSyncMetadata"
        :vndb-api-key="vndbApiKey"
        :bangumi-token="bangumiToken"
        :test-result="testResult"
        @update:metadata-source="metadataSource = $event as 'vndb' | 'bangumi'"
        @update:auto-sync-metadata="autoSyncMetadata = $event"
        @update:vndb-api-key="vndbApiKey = $event"
        @update:bangumi-token="bangumiToken = $event"
        @test-bangumi="handleTestBangumi"
        @test-vndb="handleTestVNDB"
      />

      <SettingLauncher
        :section-ref="setSectionRef('launcher')"
        :le-path="lePath"
        :magpie-path="magpiePath"
        :magpie-scale="magpieScale"
        @update:le-path="lePath = $event"
        @update:magpie-path="magpiePath = $event"
        @update:magpie-scale="magpieScale = $event"
        @select-l-e-path="handleSelectLEPath"
        @select-magpie-path="handleSelectMagpiePath"
      />

      <SettingBackup
        :section-ref="setSectionRef('backup')"
        :backup-dir="backupDir"
        @update:backup-dir="backupDir = $event"
        @select-backup-dir="handleSelectBackupDir"
      />

      <SettingAbout
        :section-ref="setSectionRef('about')"
        :current-version="currentVersion"
        @check-update="handleCheckUpdate"
        @open-github="handleOpenGithub"
      />

      <div class="settings-bottom-spacer"></div>
    </div>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  height: 100%;
  gap: 0;
}

.settings-nav {
  width: 160px;
  min-width: 160px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  margin-right: 16px;
}

@media (max-width: 899px) {
  .settings-nav {
    width: 48px;
    min-width: 48px;
    padding-right: 8px;
    margin-right: 8px;
  }

  .settings-nav .nav-header span,
  .settings-nav .nav-item span {
    display: none;
  }

  .settings-nav .nav-item {
    justify-content: center;
    padding: 9px 0;
  }

  .settings-nav .nav-item.active::before {
    left: -8px;
  }
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
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
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

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  width: 3px;
  height: 18px;
  background: var(--accent-primary);
  border-radius: 0 3px 3px 0;
  animation: active-bar-in 0.3s ease forwards;
}

.settings-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 8px;
  animation: fade-in-up 0.4s ease;
}

.settings-bottom-spacer {
  height: 40px;
}
</style>
