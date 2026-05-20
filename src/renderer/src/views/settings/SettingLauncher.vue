<script setup lang="ts">
defineProps<{
  magpiePath: string
  magpieScale: string
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:magpiePath': [value: string]
  'update:magpieScale': [value: string]
  selectMagpiePath: []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="launcher" class="setting-group">
    <h3 class="group-title">启动器</h3>
    <div class="group-card">
      <div class="setting-row setting-disabled">
        <div class="setting-info">
          <span class="setting-label">Magpie 路径</span>
          <span class="setting-desc">{{
            magpiePath || 'Magpie.exe 所在路径，用于超分放大游戏窗口'
          }}</span>
        </div>
        <button class="sbtn sbtn-secondary" disabled>选择路径</button>
      </div>
      <div class="setting-row setting-disabled">
        <div class="setting-info">
          <span class="setting-label">缩放参数</span>
          <span class="setting-desc">Magpie 缩放倍数（1.0 – 4.0）</span>
        </div>
        <input
          :value="magpieScale"
          type="text"
          class="sinput narrow"
          disabled
          @input="emit('update:magpieScale', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
