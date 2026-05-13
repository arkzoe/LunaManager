<script setup lang="ts">
import { useThemeStore } from '../../stores'

defineProps<{
  sectionRef?: (el: unknown) => void
}>()

const themeStore = useThemeStore()
</script>

<template>
  <section :ref="sectionRef" data-section="appearance" class="setting-group">
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
</template>

<style>
@import './shared.css';
</style>
