<script setup lang="ts">
defineProps<{
  backupDir: string
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:backupDir': [value: string]
  selectBackupDir: []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="backup" class="setting-group">
    <h3 class="group-title">备份</h3>
    <div class="group-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">备份目录</span>
          <span class="setting-desc">{{ backupDir || '手动备份文件存储路径' }}</span>
        </div>
        <button class="sbtn sbtn-secondary" @click="emit('selectBackupDir')">选择目录</button>
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
