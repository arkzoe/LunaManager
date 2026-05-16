<script setup lang="ts">
import SelectDropdown from '../../shared/SelectDropdown.vue'

defineProps<{
  autoBackup: boolean
  backupDir: string
  backupFrequency: string
  backupMaxCopies: number
  sectionRef?: (el: unknown) => void
}>()

const emit = defineEmits<{
  'update:autoBackup': [value: boolean]
  'update:backupDir': [value: string]
  'update:backupFrequency': [value: string]
  'update:backupMaxCopies': [value: number]
  selectBackupDir: []
}>()
</script>

<template>
  <section :ref="sectionRef" data-section="backup" class="setting-group">
    <h3 class="group-title">备份</h3>
    <div class="group-card">
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">自动备份</span>
          <span class="setting-desc">定期自动备份数据库与封面</span>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="autoBackup"
            @change="emit('update:autoBackup', ($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">备份目录</span>
          <span class="setting-desc">{{ backupDir || '自动备份文件存储路径' }}</span>
        </div>
        <button class="sbtn sbtn-secondary" @click="emit('selectBackupDir')">选择目录</button>
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">备份频率</span>
          <span class="setting-desc">自动备份的执行频率</span>
        </div>
        <SelectDropdown
          :model-value="backupFrequency"
          :options="[{value:'daily',label:'每天'},{value:'weekly',label:'每周'},{value:'monthly',label:'每月'}]"
          class="sselect"
          @update:model-value="emit('update:backupFrequency', $event as string)"
        />
      </div>
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">最大保留份数</span>
          <span class="setting-desc">保留的最大备份份数，超出自动删除旧备份</span>
        </div>
        <SelectDropdown
          :model-value="backupMaxCopies"
          :options="[3,5,10,20,50].map(n => ({ value: n, label: String(n) }))"
          class="sselect"
          @update:model-value="emit('update:backupMaxCopies', $event as number)"
        />
      </div>
    </div>
  </section>
</template>

<style>
@import './shared.css';
</style>
