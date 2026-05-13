<script setup lang="ts">
defineProps<{
  currentVersion: string
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'checkUpdate': []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="about" class="setting-group">
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
        <button class="sbtn sbtn-primary" @click="emit('checkUpdate')">检查更新</button>
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
        >GitHub</a>
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
