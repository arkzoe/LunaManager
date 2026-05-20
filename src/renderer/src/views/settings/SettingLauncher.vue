<script setup lang="ts">
defineProps<{
  magpiePath: string
  magpieHotkey: 'fullscreen' | 'windowed'
  autoLaunchMagpie: boolean
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:magpiePath': [value: string]
  'update:magpieHotkey': [value: 'fullscreen' | 'windowed']
  'update:autoLaunchMagpie': [value: boolean]
  selectMagpiePath: []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="launcher" class="setting-group">
    <h3 class="group-title">启动器</h3>
    <div class="group-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">Magpie 路径</span>
          <span class="setting-desc">{{
            magpiePath || 'Magpie.exe 所在路径，用于超分放大游戏窗口'
          }}</span>
        </div>
        <button class="sbtn sbtn-secondary" @click="emit('selectMagpiePath')">选择路径</button>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">触发热键</span>
          <span class="setting-desc">全屏 Alt+Shift+A &nbsp;/&nbsp; 窗口 Alt+Shift+Q</span>
        </div>
        <div class="hotkey-selector">
          <button
            class="sbtn"
            :class="{ active: magpieHotkey === 'fullscreen' }"
            @click="emit('update:magpieHotkey', 'fullscreen')"
          >
            全屏
          </button>
          <button
            class="sbtn"
            :class="{ active: magpieHotkey === 'windowed' }"
            @click="emit('update:magpieHotkey', 'windowed')"
          >
            窗口
          </button>
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">自动启动 Magpie</span>
          <span class="setting-desc">
            启动游戏时自动在后台运行 Magpie（未运行则启动）。建议在 Magpie
            设置中开启「在系统托盘上显示应用程序」以自动隐藏主窗口</span
          >
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="autoLaunchMagpie"
            @change="emit('update:autoLaunchMagpie', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">使用说明</span>
          <span class="setting-desc">
            使用前请保持 Magpie 在后台运行（或开启自动启动）。Magpie 默认热键 Alt+Shift+A 和
            Alt+Shift+Q 分别 触发全屏超分和窗口超分，管理器将自动为您触发。
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';

.hotkey-selector {
  display: flex;
  gap: 8px;
}

.hotkey-selector .sbtn.active {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}
</style>
