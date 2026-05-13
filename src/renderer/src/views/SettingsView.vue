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
  autoStart, autoUpdate, downloadPath, language,
  vndbApiKey, bangumiToken, lePath, magpiePath, magpieScale,
  autoBackup, backupDir, backupFrequency, backupMaxCopies,
  showGameCover, trackPlaytime, recordHistory, autoSyncMetadata, metadataSource,
  loadConfig, setupPersistence,
  handleSelectLEPath, handleSelectMagpiePath, handleChangeDownloadPath, handleSelectBackupDir
} = useSettings()

const currentVersion = ref('1.0.0')

const handleTestBangumi = (): void => {
  console.log('测试 Bangumi 连接')
}

const handleTestVNDB = (): void => {
  console.log('测试 VNDB 连接')
}

const handleCheckUpdate = (): void => {
  console.log('检查更新')
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
</script>

<template>
  <div class="settings-layout">
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

    <div ref="contentRef" class="settings-content">
      <SettingBasic
        :section-ref="setSectionRef('basic')"
        :auto-start="autoStart"
        :auto-update="autoUpdate"
        :download-path="downloadPath"
        :show-game-cover="showGameCover"
        :track-playtime="trackPlaytime"
        :record-history="recordHistory"
        :language="language"
        @update:auto-start="autoStart = $event"
        @update:auto-update="autoUpdate = $event"
        @update:show-game-cover="showGameCover = $event"
        @update:track-playtime="trackPlaytime = $event"
        @update:record-history="recordHistory = $event"
        @update:language="language = $event"
        @select-download-path="handleChangeDownloadPath"
      />

      <SettingAppearance :section-ref="setSectionRef('appearance')" />

      <SettingDatasource
        :section-ref="setSectionRef('datasource')"
        :metadata-source="metadataSource"
        :auto-sync-metadata="autoSyncMetadata"
        :vndb-api-key="vndbApiKey"
        :bangumi-token="bangumiToken"
        @update:metadata-source="metadataSource = $event"
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
        :auto-backup="autoBackup"
        :backup-dir="backupDir"
        :backup-frequency="backupFrequency"
        :backup-max-copies="backupMaxCopies"
        @update:auto-backup="autoBackup = $event"
        @update:backup-dir="backupDir = $event"
        @update:backup-frequency="backupFrequency = $event"
        @update:backup-max-copies="backupMaxCopies = $event"
        @select-backup-dir="handleSelectBackupDir"
      />

      <SettingAbout
        :section-ref="setSectionRef('about')"
        :current-version="currentVersion"
        @check-update="handleCheckUpdate"
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

.settings-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-right: 8px;
}

.settings-bottom-spacer {
  height: 40px;
}
</style>
