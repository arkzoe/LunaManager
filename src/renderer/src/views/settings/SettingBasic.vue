<script setup lang="ts">
import SelectDropdown from '../../shared/SelectDropdown.vue'

defineProps<{
  autoStart: boolean
  autoUpdate: boolean
  trackPlaytime: boolean
  recordHistory: boolean
  language: string
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:autoStart': [value: boolean]
  'update:autoUpdate': [value: boolean]
  'update:trackPlaytime': [value: boolean]
  'update:recordHistory': [value: boolean]
  'update:language': [value: string]
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
      <div class="setting-row setting-disabled">
        <div class="setting-info">
          <span class="setting-label">语言</span>
          <span class="setting-desc">选择界面显示语言</span>
        </div>
        <div class="setting-disabled-wrap">
          <SelectDropdown
            :model-value="language"
            :options="[
              { value: 'zh-CN', label: '简体中文' },
              { value: 'en-US', label: 'English' }
            ]"
            class="sselect"
            disabled
            @update:model-value="emit('update:language', $event as string)"
          />
          <span class="coming-soon-badge">即将支持</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
