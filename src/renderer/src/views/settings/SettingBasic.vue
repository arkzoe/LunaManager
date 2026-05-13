<script setup lang="ts">
defineProps<{
  autoStart: boolean
  autoUpdate: boolean
  downloadPath: string
  showGameCover: boolean
  trackPlaytime: boolean
  recordHistory: boolean
  language: string
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:autoStart': [value: boolean]
  'update:autoUpdate': [value: boolean]
  'update:showGameCover': [value: boolean]
  'update:trackPlaytime': [value: boolean]
  'update:recordHistory': [value: boolean]
  'update:language': [value: string]
  'selectDownloadPath': []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="basic" class="setting-group">
    <h3 class="group-title">基础</h3>
    <div class="group-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">开机启动</span>
          <span class="setting-desc">系统启动时自动运行 LunaManager</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="autoStart"
            @change="emit('update:autoStart', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">自动更新</span>
          <span class="setting-desc">自动检查并安装应用更新</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="autoUpdate"
            @change="emit('update:autoUpdate', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">下载路径</span>
          <span class="setting-desc">{{ downloadPath || '未设置' }}</span>
        </div>
        <button class="sbtn sbtn-secondary" @click="emit('selectDownloadPath')">更改</button>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">显示游戏封面</span>
          <span class="setting-desc">在游戏库中显示封面图片</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="showGameCover"
            @change="emit('update:showGameCover', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">追踪游玩时长</span>
          <span class="setting-desc">记录每次游玩的时长数据</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="trackPlaytime"
            @change="emit('update:trackPlaytime', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">记录游玩历史</span>
          <span class="setting-desc">保留完整的游玩会话记录</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="recordHistory"
            @change="emit('update:recordHistory', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">语言</span>
          <span class="setting-desc">选择界面显示语言</span>
        </div>
        <select
          :value="language"
          class="sselect"
          @change="emit('update:language', ($event.target as HTMLSelectElement).value)"
        >
          <option value="zh-CN">简体中文</option>
          <option value="en-US">English</option>
        </select>
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
